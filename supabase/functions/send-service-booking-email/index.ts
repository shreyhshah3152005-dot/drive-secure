const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const BookingSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  packageName: z.string().min(1),
  packagePrice: z.number(),
  carBrand: z.string().min(1),
  carModel: z.string().min(1),
  carRegistration: z.string().min(1),
  bookingDate: z.string().min(1),
  bookingTime: z.string().min(1),
  statusUpdate: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = await req.json();
    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, name, packageName, packagePrice, carBrand, carModel, carRegistration, bookingDate, bookingTime, statusUpdate } = parsed.data;

    const isCancel = statusUpdate === "cancelled";
    const isReschedule = statusUpdate === "rescheduled";
    const isStatusChange = !!statusUpdate && !isCancel && !isReschedule;

    let headerBg = "linear-gradient(135deg, #b8860b, #d4a017)";
    let headerIcon = "🔧";
    let headerTitle = "Booking Confirmed!";
    let subjectLine = `✅ Booking Confirmed - ${packageName} | CARBAZAAR`;
    let bodyMessage = "Your car service booking has been confirmed. Here are the details:";

    if (isCancel) {
      headerBg = "linear-gradient(135deg, #dc2626, #ef4444)";
      headerIcon = "❌";
      headerTitle = "Booking Cancelled";
      subjectLine = `❌ Booking Cancelled - ${packageName} | CARBAZAAR`;
      bodyMessage = "Your car service booking has been cancelled. Here were the details:";
    } else if (isReschedule) {
      headerBg = "linear-gradient(135deg, #2563eb, #3b82f6)";
      headerIcon = "📅";
      headerTitle = "Booking Rescheduled";
      subjectLine = `📅 Booking Rescheduled - ${packageName} | CARBAZAAR`;
      bodyMessage = "Your car service booking has been rescheduled. Here are the updated details:";
    } else if (isStatusChange) {
      headerBg = "linear-gradient(135deg, #7c3aed, #8b5cf6)";
      headerIcon = "🔄";
      headerTitle = `Booking ${statusUpdate.charAt(0).toUpperCase() + statusUpdate.slice(1).replace("_", " ")}`;
      subjectLine = `🔄 Booking Update - ${packageName} | CARBAZAAR`;
      bodyMessage = `Your car service booking status has been updated to "${statusUpdate.replace("_", " ")}". Here are the details:`;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background: ${headerBg}; padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 24px;">${headerIcon} ${headerTitle}</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">CARBAZAAR Car Services</p>
        </div>
        <div style="padding: 30px;">
          <p style="margin-top: 0;">Hi <strong style="color: #d4a017;">${name}</strong>,</p>
          <p>${bodyMessage}</p>
          
          <div style="background: #16213e; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #b8860b;">
            <h3 style="margin-top: 0; color: #d4a017;">📋 Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #999;">Package</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${packageName}</td></tr>
              <tr><td style="padding: 6px 0; color: #999;">Price</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #d4a017;">₹${packagePrice.toLocaleString("en-IN")}</td></tr>
              <tr><td style="padding: 6px 0; color: #999;">Car</td><td style="padding: 6px 0; text-align: right;">${carBrand} ${carModel}</td></tr>
              <tr><td style="padding: 6px 0; color: #999;">Registration</td><td style="padding: 6px 0; text-align: right;">${carRegistration}</td></tr>
              <tr><td style="padding: 6px 0; color: #999;">Date</td><td style="padding: 6px 0; text-align: right;">${bookingDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #999;">Time</td><td style="padding: 6px 0; text-align: right;">${bookingTime}</td></tr>
            </table>
          </div>
          
          <p style="font-size: 13px; color: #999;">If you have any questions, feel free to reach out. We look forward to servicing your car!</p>
        </div>
        <div style="background: #16213e; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} CARBAZAAR. All rights reserved.</p>
        </div>
      </div>
    `;

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "CARBAZAAR Services <onboarding@resend.dev>",
        to: [email],
        subject: subjectLine,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
