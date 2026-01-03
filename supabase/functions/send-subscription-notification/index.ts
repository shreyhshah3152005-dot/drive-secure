import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionNotificationRequest {
  dealerId: string;
  dealershipName: string;
  oldPlan: string;
  newPlan: string;
}

const planPrices: Record<string, string> = {
  basic: "₹999/month",
  standard: "₹1,999/month",
  premium: "₹3,999/month",
};

const planLimits: Record<string, string> = {
  basic: "5 car listings",
  standard: "15 car listings",
  premium: "Unlimited car listings",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verify admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { dealerId, dealershipName, oldPlan, newPlan }: SubscriptionNotificationRequest = await req.json();

    // Get dealer email using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('user_id')
      .eq('id', dealerId)
      .single();

    if (dealerError || !dealer) {
      console.error("Dealer not found:", dealerError);
      return new Response(JSON.stringify({ error: 'Dealer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(dealer.user_id);

    if (authUserError || !authUser?.user?.email) {
      console.error("User email not found:", authUserError);
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const email = authUser.user.email;
    const isUpgrade = ['basic', 'standard', 'premium'].indexOf(newPlan) > ['basic', 'standard', 'premium'].indexOf(oldPlan);

    const emailResponse = await resend.emails.send({
      from: "CARBAZAAR <onboarding@resend.dev>",
      to: [email],
      subject: `${isUpgrade ? '🎉' : '📋'} Your Subscription Plan Has Been ${isUpgrade ? 'Upgraded' : 'Changed'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b8860b, #daa520); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .plan-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b8860b; }
            .plan-name { font-size: 24px; font-weight: bold; color: #333; }
            .plan-price { font-size: 18px; color: #666; }
            .plan-limit { font-size: 14px; color: #888; margin-top: 8px; }
            .arrow { text-align: center; font-size: 24px; color: #b8860b; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Subscription Update</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${dealershipName}</strong>,</p>
              <p>Your subscription plan has been ${isUpgrade ? 'upgraded' : 'updated'} by our admin team.</p>
              
              <div class="plan-box">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #888; text-transform: uppercase;">Previous Plan</div>
                    <div class="plan-name" style="color: #888; text-decoration: line-through;">${oldPlan.charAt(0).toUpperCase() + oldPlan.slice(1)}</div>
                    <div class="plan-price">${planPrices[oldPlan]}</div>
                  </div>
                  <div class="arrow">→</div>
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #b8860b; text-transform: uppercase; font-weight: bold;">New Plan</div>
                    <div class="plan-name" style="color: #b8860b;">${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}</div>
                    <div class="plan-price">${planPrices[newPlan]}</div>
                    <div class="plan-limit">${planLimits[newPlan]}</div>
                  </div>
                </div>
              </div>
              
              ${isUpgrade ? `
                <p>🎉 <strong>Congratulations!</strong> You now have access to more features:</p>
                <ul>
                  <li>${planLimits[newPlan]}</li>
                  ${newPlan !== 'basic' ? '<li>Priority Support</li>' : ''}
                  ${newPlan === 'premium' ? '<li>Featured Placement</li>' : ''}
                </ul>
              ` : ''}
              
              <p>Log in to your dealer panel to take advantage of your updated plan.</p>
              
              <div class="footer">
                <p>Thank you for being a CARBAZAAR dealer!</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Subscription notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);