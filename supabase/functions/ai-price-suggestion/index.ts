import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { car_id } = await req.json();
    if (!car_id) return new Response(JSON.stringify({ error: "car_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: car, error: carErr } = await admin.from("dealer_cars").select("*").eq("id", car_id).maybeSingle();
    if (carErr || !car) return new Response(JSON.stringify({ error: "Car not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: comps } = await admin
      .from("dealer_cars")
      .select("name, brand, price, category, fuel_type, transmission, mileage, engine, power, created_at")
      .eq("brand", car.brand)
      .eq("category", car.category)
      .eq("fuel_type", car.fuel_type)
      .eq("is_active", true)
      .neq("id", car_id)
      .limit(20);

    const comparables = comps || [];
    let suggested = car.price;
    let min = car.price;
    let max = car.price;

    if (comparables.length > 0) {
      const prices = comparables.map((c: any) => Number(c.price)).sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)];
      suggested = Math.round(median);
      min = prices[0];
      max = prices[prices.length - 1];
    }

    // Ask AI for refined suggestion and reasoning
    const prompt = `You are an Indian used-car pricing analyst. Suggest a competitive listing price in INR for this car based on the comparable market listings.

Target car:
${JSON.stringify({ brand: car.brand, name: car.name, category: car.category, fuel_type: car.fuel_type, transmission: car.transmission, mileage: car.mileage, engine: car.engine, power: car.power, current_price: car.price }, null, 2)}

Comparable listings (${comparables.length}):
${JSON.stringify(comparables.slice(0, 10), null, 2)}

Initial median-based suggestion: ₹${suggested}
Range observed: ₹${min} - ₹${max}

Respond in strict JSON: {"suggested_price": number, "min_price": number, "max_price": number, "reasoning": "2-4 sentence explanation referencing comparables, demand, condition signals"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      // Fallback to median-based suggestion
      return new Response(JSON.stringify({
        suggested_price: suggested,
        min_price: min,
        max_price: max,
        reasoning: comparables.length === 0
          ? "No directly comparable listings found in the marketplace. Suggestion equals your current price; consider competitor research."
          : `Based on ${comparables.length} comparable listings, the median market price is ₹${suggested}. AI elaboration unavailable (${aiRes.status}).`,
        comparables_count: comparables.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    return new Response(JSON.stringify({
      suggested_price: Math.round(parsed.suggested_price || suggested),
      min_price: Math.round(parsed.min_price || min),
      max_price: Math.round(parsed.max_price || max),
      reasoning: parsed.reasoning || "Suggestion based on comparable market listings.",
      comparables_count: comparables.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
