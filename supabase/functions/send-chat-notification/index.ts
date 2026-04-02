import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const schema = z.object({
  dealerId: z.string().uuid(),
  messagePreview: z.string().min(1).max(500).trim(),
  customerName: z.string().min(1).max(100).trim(),
  carName: z.string().max(200).optional(),
});

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") as string,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
    );

    const rawData = await req.json();
    const parsed = schema.safeParse(rawData);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.format() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { dealerId, messagePreview, customerName, carName } = parsed.data;

    const { data: dealer } = await supabase.from("dealers").select("user_id, dealership_name").eq("id", dealerId).single();
    if (!dealer) {
      return new Response(JSON.stringify({ error: "Dealer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(dealer.user_id);
    if (!authUser?.user?.email) {
      return new Response(JSON.stringify({ error: "Dealer email not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const safeCustomerName = escapeHtml(customerName);
    const safeMessage = escapeHtml(messagePreview);
    const safeCarName = carName ? escapeHtml(carName) : null;
    const safeDealerName = escapeHtml(dealer.dealership_name);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #b8860b, #d4a017); padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
          .message-box p { margin: 5px 0; color: #333; font-size: 14px; }
          .cta { display: inline-block; background: #b8860b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Chat Message</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${safeDealerName}</strong>,</p>
            <p>You have a new message from <strong>${safeCustomerName}</strong>${safeCarName ? ` about <strong>${safeCarName}</strong>` : ""}.</p>
            
            <div class="message-box">
              <p><strong>Message:</strong></p>
              <p>"${safeMessage}"</p>
            </div>
            
            <p>Log in to your dealer panel to reply.</p>
            
            <div class="footer">
              <p>This is an automated notification from CARBAZAAR</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CARBAZAAR <onboarding@resend.dev>",
      to: [authUser.user.email],
      subject: `💬 New message from ${safeCustomerName}${safeCarName ? ` about ${safeCarName}` : ""}`,
      html: htmlContent,
    });

    console.log("Chat notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error in send-chat-notification:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
