import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

interface PriceAlertRequest {
  alertId?: string;
  runAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { alertId, runAll }: PriceAlertRequest = await req.json();

    // Build query for triggered alerts that haven't been notified
    let query = supabase
      .from("price_alerts")
      .select(`
        id,
        user_id,
        car_id,
        target_price,
        triggered_at,
        dealer_cars:car_id (
          name,
          brand,
          price,
          image_url,
          dealer_id,
          dealers:dealer_id (
            dealership_name
          )
        )
      `)
      .eq("is_triggered", true);

    if (alertId) {
      query = query.eq("id", alertId);
    }

    const { data: alerts, error: alertsError } = await query;

    if (alertsError) {
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No triggered alerts found", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const alert of alerts) {
      try {
        // Get user email from profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("user_id", alert.user_id)
          .maybeSingle();

        if (profileError || !profile?.email) {
          errors.push(`No email found for user ${alert.user_id}`);
          continue;
        }

        const car = alert.dealer_cars as any;
        if (!car) {
          errors.push(`Car not found for alert ${alert.id}`);
          continue;
        }

        const dealer = car.dealers;
        const safeName = profile.name ? escapeHtml(profile.name) : "there";
        const safeCarName = escapeHtml(`${car.brand} ${car.name}`);
        const safeDealerName = dealer ? escapeHtml(dealer.dealership_name) : "Dealer";
        const currentPrice = formatPrice(car.price);
        const targetPrice = formatPrice(alert.target_price);

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
              .price-drop { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 15px 0; background: #dcfce7; color: #166534; font-size: 18px; }
              .car-card { background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e5e7eb; }
              .car-image { width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin-bottom: 15px; }
              .price-comparison { display: flex; gap: 20px; margin: 15px 0; }
              .price-box { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
              .target-price { background: #fef3c7; color: #92400e; }
              .current-price { background: #dcfce7; color: #166534; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Price Drop Alert!</h1>
              </div>
              <div class="content">
                <p>Hi ${safeName},</p>
                <p>Great news! A car on your watchlist just dropped in price!</p>
                
                <div class="price-drop">💰 Price is now at or below your target!</div>
                
                <div class="car-card">
                  ${car.image_url ? `<img src="${car.image_url}" alt="${safeCarName}" class="car-image" />` : ''}
                  <h2 style="margin: 0 0 10px 0; color: #111;">${safeCarName}</h2>
                  <p style="color: #666; margin: 0;">Available at ${safeDealerName}</p>
                  
                  <div class="price-comparison">
                    <div class="price-box target-price">
                      <small>Your Target</small>
                      <div style="font-size: 18px; font-weight: bold;">${targetPrice}</div>
                    </div>
                    <div class="price-box current-price">
                      <small>Current Price</small>
                      <div style="font-size: 18px; font-weight: bold;">${currentPrice}</div>
                    </div>
                  </div>
                </div>
                
                <p>Don't miss this opportunity! This deal might not last long.</p>
                
                <center>
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dealer-cars/${alert.car_id}" class="cta-button">
                    View Car Details →
                  </a>
                </center>
                
                <div class="footer">
                  <p>You received this email because you set a price alert for this vehicle.</p>
                  <p>Thank you for using CARBAZAAR!</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: "CARBAZAAR <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🎉 Price Drop! ${safeCarName} is now ${currentPrice}`,
          html: htmlContent,
        });

        sentCount++;
        console.log(`Price alert email sent to ${profile.email} for car ${alert.car_id}`);
      } catch (emailError: any) {
        console.error(`Failed to send price alert email for alert ${alert.id}:`, emailError);
        errors.push(`Failed for alert ${alert.id}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentCount} price alert emails`,
        count: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-price-alert-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
