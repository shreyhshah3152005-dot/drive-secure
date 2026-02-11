import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatPrice = (price: number): string => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { car_id } = body;

    if (!car_id) {
      return new Response(
        JSON.stringify({ error: "car_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch the new car details
    const { data: car, error: carError } = await supabaseAdmin
      .from("dealer_cars")
      .select("id, name, brand, category, fuel_type, price, image_url, dealer_id")
      .eq("id", car_id)
      .single();

    if (carError || !car) {
      console.error("Car not found:", carError);
      return new Response(
        JSON.stringify({ error: "Car not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch dealer info
    const { data: dealer } = await supabaseAdmin
      .from("dealers")
      .select("dealership_name, city")
      .eq("id", car.dealer_id)
      .single();

    // Find all saved searches with email_notifications enabled that match this car
    const { data: savedSearches, error: searchError } = await supabaseAdmin
      .from("saved_searches")
      .select("id, user_id, name, brand, fuel_type, category, min_price, max_price")
      .eq("email_notifications", true);

    if (searchError) {
      console.error("Error fetching saved searches:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch saved searches" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter matching searches
    const matchingSearches = (savedSearches || []).filter((search) => {
      if (search.brand && search.brand !== car.brand) return false;
      if (search.fuel_type && search.fuel_type !== car.fuel_type) return false;
      if (search.category && search.category !== car.category) return false;
      if (search.min_price && car.price < search.min_price) return false;
      if (search.max_price && car.price > search.max_price) return false;
      return true;
    });

    if (matchingSearches.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No matching saved searches", notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(matchingSearches.map((s) => s.user_id))];

    // Fetch user profiles for emails
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    let notifiedCount = 0;

    for (const userId of userIds) {
      const profile = profileMap.get(userId);
      if (!profile?.email) continue;

      const userSearches = matchingSearches.filter((s) => s.user_id === userId);
      const searchNames = userSearches.map((s) => escapeHtml(s.name)).join(", ");
      const safeName = escapeHtml(profile.name || "Car Enthusiast");
      const safeCarName = escapeHtml(`${car.brand} ${car.name}`);
      const safeDealerName = escapeHtml(dealer?.dealership_name || "A dealer");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b8860b, #daa520); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 22px; }
            .content { background: #1a1a1a; color: #e0e0e0; padding: 30px; border-radius: 0 0 10px 10px; }
            .car-card { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b8860b; }
            .car-card h3 { color: #daa520; margin: 0 0 10px 0; }
            .price { font-size: 24px; color: #daa520; font-weight: bold; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 New Car Matches Your Search!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${safeName}</strong>,</p>
              <p>Great news! A new car has been listed that matches your saved search: <strong>${searchNames}</strong></p>
              
              <div class="car-card">
                <h3>${safeCarName}</h3>
                <p class="price">${formatPrice(car.price)}</p>
                <p>Category: ${escapeHtml(car.category)} | Fuel: ${escapeHtml(car.fuel_type)}</p>
                <p>Listed by: ${safeDealerName}${dealer?.city ? ` (${escapeHtml(dealer.city)})` : ""}</p>
              </div>
              
              <p>Visit CARBAZAAR to check it out and schedule a test drive!</p>
              
              <div class="footer">
                <p>You received this because you have email notifications enabled for your saved searches.</p>
                <p>This is an automated message from CARBAZAAR.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "CARBAZAAR <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🚗 New ${car.brand} ${car.name} matches your saved search!`,
          html: htmlContent,
        });
        notifiedCount++;
        console.log(`Notified ${profile.email} for saved search match`);
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, notified: notifiedCount, matches: matchingSearches.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-saved-search-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
