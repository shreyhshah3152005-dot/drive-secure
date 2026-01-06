import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const notificationSchema = z.object({
  dealerId: z.string().uuid(),
  customerName: z.string().min(1).max(100).trim(),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().min(1).max(20).trim(),
  carName: z.string().min(1).max(200).trim(),
  preferredDate: z.string().min(1).max(50).trim(),
  preferredTime: z.string().min(1).max(50).trim(),
  message: z.string().max(1000).optional(),
});

// HTML escape function to prevent XSS in emails
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
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input data
    const rawData = await req.json();
    const validationResult = notificationSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.format());
      return new Response(
        JSON.stringify({
          error: "Invalid input data",
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { dealerId, customerName, customerEmail, customerPhone, carName, preferredDate, preferredTime, message } =
      validationResult.data;

    // Get dealer email from user_id
    const { data: dealer, error: dealerError } = await supabase
      .from("dealers")
      .select("user_id, dealership_name")
      .eq("id", dealerId)
      .single();

    if (dealerError || !dealer) {
      console.error("Dealer not found:", dealerError);
      return new Response(
        JSON.stringify({ error: "Dealer not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get dealer's email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(dealer.user_id);

    if (authError || !authUser?.user?.email) {
      console.error("Dealer email not found:", authError);
      return new Response(
        JSON.stringify({ error: "Dealer email not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const dealerEmail = authUser.user.email;

    // Escape HTML in user-provided values for email template
    const safeCustomerName = escapeHtml(customerName);
    const safeCarName = escapeHtml(carName);
    const safePreferredDate = escapeHtml(preferredDate);
    const safePreferredTime = escapeHtml(preferredTime);
    const safeCustomerPhone = escapeHtml(customerPhone);
    const safeCustomerEmail = escapeHtml(customerEmail);
    const safeMessage = message ? escapeHtml(message) : "";
    const safeDealershipName = escapeHtml(dealer.dealership_name);

    console.log(`Sending test drive notification to dealer ${dealerEmail} for car ${safeCarName}`);

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
          .alert-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; background: #fef3c7; color: #92400e; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .details p { margin: 8px 0; color: #333; }
          .customer-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .customer-info h3 { margin: 0 0 10px 0; color: #0369a1; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 New Test Drive Request!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${safeDealershipName}</strong>,</p>
            <p>Great news! You have received a new test drive request.</p>
            
            <div class="alert-badge">Action Required ⚡</div>
            
            <div class="details">
              <p><strong>Vehicle:</strong> ${safeCarName}</p>
              <p><strong>Requested Date:</strong> ${safePreferredDate}</p>
              <p><strong>Preferred Time:</strong> ${safePreferredTime}</p>
            </div>
            
            <div class="customer-info">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${safeCustomerName}</p>
              <p><strong>Email:</strong> ${safeCustomerEmail}</p>
              <p><strong>Phone:</strong> ${safeCustomerPhone}</p>
              ${safeMessage ? `<p><strong>Message:</strong> "${safeMessage}"</p>` : ""}
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Log in to your dealer portal to review this request</li>
              <li>Contact the customer to confirm the appointment</li>
              <li>Update the status once confirmed</li>
            </ul>
            
            <div class="footer">
              <p>This is an automated notification from CARBAZAAR</p>
              <p>Please do not reply directly to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CARBAZAAR <onboarding@resend.dev>",
      to: [dealerEmail],
      subject: `🚗 New Test Drive Request - ${safeCarName}`,
      html: htmlContent,
    });

    console.log("Dealer notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-dealer-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while sending the notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
