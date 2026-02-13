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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather user data in parallel
    const [profileRes, favoritesRes, testDrivesRes, priceAlertsRes, savedSearchesRes] =
      await Promise.all([
        supabase.from("profiles").select("city, name").eq("user_id", user.id).maybeSingle(),
        supabase.from("favorites").select("car_id").eq("user_id", user.id),
        supabase.from("test_drive_inquiries").select("car_id, car_name").eq("user_id", user.id),
        supabase.from("price_alerts").select("car_id, target_price").eq("user_id", user.id),
        supabase.from("saved_searches").select("brand, fuel_type, category, min_price, max_price").eq("user_id", user.id),
      ]);

    // Fetch available cars
    const { data: availableCars } = await supabase
      .from("dealer_cars")
      .select("id, name, brand, category, fuel_type, transmission, price, image_url, mileage, engine, power, seating_capacity, dealer_id")
      .eq("is_active", true)
      .limit(100);

    if (!availableCars || availableCars.length === 0) {
      return new Response(JSON.stringify({ recommendations: [], reasoning: "No cars available." }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get dealer info for available cars
    const dealerIds = [...new Set(availableCars.map((c) => c.dealer_id))];
    const { data: dealers } = await supabase
      .from("dealers")
      .select("id, dealership_name, city")
      .in("id", dealerIds);

    const dealerMap = new Map((dealers || []).map((d) => [d.id, d]));

    // Build user profile context
    const favoriteCarIds = (favoritesRes.data || []).map((f) => f.car_id);
    const testDriveCarNames = (testDrivesRes.data || []).map((t) => t.car_name);
    const priceAlerts = (priceAlertsRes.data || []).map((p) => ({ car_id: p.car_id, target: p.target_price }));
    const savedSearches = savedSearchesRes.data || [];

    // Enrich car data
    const carsWithDealers = availableCars.map((car) => {
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
        image_url: car.image_url,
      };
    });

    const userContext = {
      city: profileRes.data?.city || "Unknown",
      name: profileRes.data?.name || "User",
      favorite_car_ids: favoriteCarIds,
      test_drive_history: testDriveCarNames,
      price_alert_budgets: priceAlerts.map((p) => p.target),
      saved_search_preferences: savedSearches,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert car recommendation assistant for CARBAZAAR, an Indian car marketplace. 
Analyze the user's browsing history, favorites, saved searches, and budget to recommend the best cars.
Be specific about WHY each car is recommended based on the user's preferences.
Return recommendations using the suggest_cars tool.`;

    const userPrompt = `User profile: ${JSON.stringify(userContext)}

Available cars (${carsWithDealers.length} total): ${JSON.stringify(carsWithDealers.map(c => ({
      id: c.id, name: c.name, brand: c.brand, category: c.category, 
      fuel_type: c.fuel_type, price: c.price, dealer_city: c.dealer_city
    })))}

Based on this user's history and preferences, recommend the top 6 best-matching cars with personalized reasoning for each.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_cars",
              description: "Return personalized car recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        car_id: { type: "string", description: "The car's UUID" },
                        reason: { type: "string", description: "Why this car matches the user, 1-2 sentences" },
                        match_score: { type: "number", description: "Match score 1-100" },
                        match_tags: {
                          type: "array",
                          items: { type: "string" },
                          description: "Tags like 'Budget Match', 'Same City', 'Favorite Brand', 'Popular Category'"
                        },
                      },
                      required: ["car_id", "reason", "match_score", "match_tags"],
                    },
                  },
                  summary: { type: "string", description: "One sentence overview of the recommendation strategy" },
                },
                required: ["recommendations", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_cars" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again shortly." }), {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    
    // Enrich recommendations with full car data
    const enriched = (parsed.recommendations || [])
      .map((rec: any) => {
        const car = carsWithDealers.find((c) => c.id === rec.car_id);
        if (!car) return null;
        return {
          ...rec,
          car,
        };
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        recommendations: enriched,
        summary: parsed.summary || "Personalized recommendations based on your preferences.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e) {
    console.error("ai-car-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
