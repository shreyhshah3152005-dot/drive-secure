import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch available cars for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cars } = await supabase
      .from("dealer_cars")
      .select("id, name, brand, category, fuel_type, transmission, price, mileage, engine, power, seating_capacity, dealer_id")
      .eq("is_active", true)
      .limit(50);

    const dealerIds = [...new Set((cars || []).map(c => c.dealer_id))];
    const { data: dealers } = await supabase
      .from("dealers")
      .select("id, dealership_name, city")
      .in("id", dealerIds);

    const dealerMap = new Map((dealers || []).map(d => [d.id, d]));

    const carsContext = (cars || []).map(car => {
      const dealer = dealerMap.get(car.dealer_id);
      return {
        id: car.id,
        name: car.name,
        brand: car.brand,
        category: car.category,
        fuel_type: car.fuel_type,
        transmission: car.transmission,
        price: car.price,
        mileage: car.mileage,
        engine: car.engine,
        power: car.power,
        seating_capacity: car.seating_capacity,
        dealer_name: dealer?.dealership_name || "Unknown",
        dealer_city: dealer?.city || "Unknown",
      };
    });

    const systemPrompt = `You are CARBAZAAR AI Assistant, a friendly and knowledgeable car recommendation chatbot for an Indian car marketplace.

IMPORTANT: Our platform has TWO categories:
1. **New Cars** - Brand new cars from manufacturers (these are the static catalog cars, NOT from dealer inventory)
2. **Second Hand / Used Cars** - Cars listed by dealers in our dealer inventory

When a user asks about "new cars", provide information about brand new models available in the Indian market (Tata, Mahindra, Maruti Suzuki, Hyundai, Kia, Toyota, Honda, MG, BYD, etc.) with current on-road prices and specifications. Do NOT mix dealer inventory cars as new cars.

When a user asks about "used cars" or "second hand cars", recommend from the dealer inventory below.

Dealer inventory (second hand / used cars):
${JSON.stringify(carsContext, null, 2)}

Your role:
- Help users find the perfect car based on their budget, preferences, and needs
- Clearly distinguish between new cars and used/second-hand cars from dealers
- Provide detailed comparisons between car models
- Answer questions about car specifications, fuel efficiency, maintenance costs
- Suggest alternatives when a preferred car is unavailable
- Be conversational, warm, and helpful

Guidelines:
- When asked about new cars, provide current market information for brand new models in India
- When asked about used/second hand cars, recommend from the dealer inventory above
- Format prices in Indian Lakhs/Crores (e.g., ₹12.5 L, ₹1.2 Cr)
- Consider Indian driving conditions and preferences
- Keep responses concise but informative (2-4 paragraphs max)
- Use emojis sparingly for friendliness 🚗
- When recommending used cars, mention the dealer name and city`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI service error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("car-recommendation-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
