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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for cron secret or admin auth
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    
    // Allow cron jobs with secret or authenticated admins
    const isCronJob = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    
    if (!isCronJob) {
      // Verify admin auth if not a cron job
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      // Check admin role
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }
    }

    // Create service role client for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find confirmed test drives scheduled for tomorrow
    const { data: testDrives, error: fetchError } = await supabase
      .from("test_drive_inquiries")
      .select(`
        id,
        name,
        email,
        car_name,
        preferred_date,
        preferred_time,
        dealer_id,
        dealers:dealer_id (
          dealership_name,
          city,
          address,
          phone
        )
      `)
      .eq("preferred_date", tomorrowStr)
      .eq("status", "confirmed");

    if (fetchError) {
      throw fetchError;
    }

    if (!testDrives || testDrives.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No test drives to remind", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const testDrive of testDrives) {
      try {
        const dealer = testDrive.dealers as any;
        const safeName = escapeHtml(testDrive.name);
        const safeCarName = escapeHtml(testDrive.car_name);
        const safeDealerName = dealer ? escapeHtml(dealer.dealership_name) : "the dealer";
        const safeAddress = dealer?.address ? escapeHtml(dealer.address) : "";
        const safeCity = dealer?.city ? escapeHtml(dealer.city) : "";
        const safePhone = dealer?.phone ? escapeHtml(dealer.phone) : "";

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .reminder-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; background: #dbeafe; color: #1e40af; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .details p { margin: 8px 0; color: #333; }
              .checklist { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Reminder: Your Test Drive is Tomorrow!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${safeName}</strong>,</p>
                <p>This is a friendly reminder that your test drive is scheduled for <strong>tomorrow</strong>!</p>
                
                <div class="reminder-badge">Tomorrow - ${testDrive.preferred_date}</div>
                
                <div class="details">
                  <p><strong>Vehicle:</strong> ${safeCarName}</p>
                  <p><strong>Time:</strong> ${testDrive.preferred_time}</p>
                  <p><strong>Dealer:</strong> ${safeDealerName}</p>
                  ${safeAddress ? `<p><strong>Address:</strong> ${safeAddress}, ${safeCity}</p>` : ""}
                  ${safePhone ? `<p><strong>Contact:</strong> ${safePhone}</p>` : ""}
                </div>
                
                <div class="checklist">
                  <h3 style="margin: 0 0 10px 0; color: #166534;">📋 Don't forget to bring:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #166534;">
                    <li>Valid driving license</li>
                    <li>Government-issued ID</li>
                    <li>Arrive 10 minutes before your scheduled time</li>
                  </ul>
                </div>
                
                <p>If you need to reschedule or cancel, please contact the dealer directly.</p>
                
                <p>We hope you have a great experience!</p>
                
                <div class="footer">
                  <p>Thank you for choosing CARBAZAAR!</p>
                  <p>This is an automated reminder. Please do not reply directly to this email.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: "CARBAZAAR <onboarding@resend.dev>",
          to: [testDrive.email],
          subject: `🔔 Reminder: Test Drive Tomorrow - ${safeCarName}`,
          html: htmlContent,
        });

        sentCount++;
        console.log(`Reminder sent to ${testDrive.email} for test drive ${testDrive.id}`);
      } catch (emailError: any) {
        console.error(`Failed to send reminder for test drive ${testDrive.id}:`, emailError);
        errors.push(`Failed for ${testDrive.email}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentCount} reminders`,
        count: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-drive-reminder function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while sending reminders" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);