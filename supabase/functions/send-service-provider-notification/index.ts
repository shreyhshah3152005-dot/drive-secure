const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { packageName, packagePrice, carBrand, carModel, carRegistration, bookingDate, bookingTime, customerName } = await req.json();

    // Fetch all active service providers
    const { data: providers, error: provError } = await supabase
      .from("service_providers")
      .select("user_id, business_name")
      .eq("is_active", true);

    if (provError) throw provError;
    if (!providers || providers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No active service providers" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch emails from profiles
    const userIds = providers.map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, name")
      .in("user_id", userIds);

    const emailPromises = (profiles || [])
      .filter((p) => p.email)
      .map((profile) => {
        const provider = providers.find((pr) => pr.user_id === profile.user_id);
        const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 24px;">🔔 New Service Booking!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">CARBAZAAR Car Services</p>
            </div>
            <div style="padding: 30px;">
              <p style="margin-top: 0;">Hi <strong style="color: #22c55e;">${profile.name || provider?.business_name || "Service Provider"}</strong>,</p>
              <p>A new car service booking has been received. Please review and confirm it from your dashboard.</p>
              
              <div style="background: #16213e; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <h3 style="margin-top: 0; color: #22c55e;">📋 Booking Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #999;">Customer</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${customerName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #999;">Package</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${packageName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #999;">Price</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #22c55e;">₹${Number(packagePrice).toLocaleString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #999;">Car</td><td style="padding: 6px 0; text-align: right;">${carBrand} ${carModel}</td></tr>
                  <tr><td style="padding: 6px 0; color: #999;">Registration</td><td style="padding: 6px 0; text-align: right;">${carRegistration}</td></tr>
                  <tr><td style="padding: 6px 0; color: #999;">Date</td><td style="padding: 6px 0; text-align: right;">${bookingDate}</td></tr>
                  <tr><td style="padding: 6px 0; color: #999;">Time</td><td style="padding: 6px 0; text-align: right;">${bookingTime}</td></tr>
                </table>
              </div>
              
              <p style="font-size: 13px; color: #999;">Please log in to your Service Provider Dashboard to manage this booking.</p>
            </div>
            <div style="background: #16213e; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} CARBAZAAR. All rights reserved.</p>
            </div>
          </div>
        `;

        return fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "CARBAZAAR Services <onboarding@resend.dev>",
            to: [profile.email],
            subject: `🔔 New Service Booking - ${packageName} | CARBAZAAR`,
            html,
          }),
        });
      });

    await Promise.allSettled(emailPromises);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Service provider notification error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
