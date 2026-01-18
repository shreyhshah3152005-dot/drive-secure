import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  templateKey: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { templateKey, recipientEmail, subject, bodyHtml }: TestEmailRequest = await req.json();

    if (!recipientEmail || !subject || !bodyHtml) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch branding settings
    const { data: branding } = await supabase
      .from("email_branding")
      .select("*")
      .limit(1)
      .single();

    const primaryColor = branding?.primary_color || "#b8860b";
    const secondaryColor = branding?.secondary_color || "#1a1a1a";
    const companyName = branding?.company_name || "CARBAZAAR";
    const footerText = branding?.footer_text || "This is an automated message. Please do not reply directly to this email.";

    // Sample data for template variables
    const sampleData: Record<string, string> = {
      customer_name: "John Doe",
      car_name: "2024 Tesla Model 3",
      preferred_date: "January 20, 2026",
      preferred_time: "2:00 PM",
      dealer_name: "Premium Auto Mall",
      dealership_name: "Premium Auto Mall",
      old_status: "Pending",
      new_status: "Confirmed",
      status: "Approved",
      status_emoji: "🎉",
      status_message: "Congratulations! Your dealer registration has been approved.",
      next_steps: "You can now log in to your dealer panel and start listing your vehicles.",
      old_plan: "Basic",
      new_plan: "Premium",
      plan_price: "₹3,999/month",
      plan_limit: "Unlimited car listings",
      action: "upgraded",
      emoji: "🎉",
      original_price: "₹45,00,000",
      new_price: "₹42,00,000",
      target_price: "₹43,00,000",
      car_link: "https://carbazaar.com/car/123",
      customer_email: "john.doe@example.com",
      customer_phone: "+91 98765 43210",
      message: "I am interested in this vehicle. Please contact me at your earliest convenience.",
      company_name: companyName,
    };

    // Replace template variables
    let processedSubject = subject;
    let processedBody = bodyHtml;
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedSubject = processedSubject.replace(regex, value);
      processedBody = processedBody.replace(regex, value);
    });

    // Build full email HTML
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, ${primaryColor}, #daa520); 
            padding: 30px; 
            text-align: center; 
            color: white;
          }
          .header h2 { margin: 0; font-size: 24px; }
          .content { padding: 30px; color: #333; line-height: 1.6; }
          .content h1 { color: #333; margin-top: 0; }
          .content a { color: ${primaryColor}; }
          .footer { 
            background: ${secondaryColor}; 
            padding: 20px; 
            text-align: center; 
            color: #888;
            font-size: 12px;
          }
          .test-banner {
            background: #fef3c7;
            color: #92400e;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border-bottom: 2px solid #fbbf24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="test-banner">
            🧪 TEST EMAIL - Template: ${templateKey}
          </div>
          <div class="header">
            <h2>🚗 ${companyName}</h2>
          </div>
          <div class="content">
            ${processedBody}
          </div>
          <div class="footer">
            <p>${footerText}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send test email
    const emailResult = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `[TEST] ${processedSubject}`,
      html: fullHtml,
    });

    console.log("Test email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${recipientEmail}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
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
