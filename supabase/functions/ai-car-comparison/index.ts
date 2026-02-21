import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { cars } = await req.json();
    if (!cars || !Array.isArray(cars) || cars.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 cars required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const carsDescription = cars.map((car: any, i: number) => 
      `Car ${i + 1}: ${car.brand} ${car.model} (${car.year})
  - Price: ₹${car.price?.toLocaleString("en-IN")}
  - Horsepower: ${car.horsepower} hp
  - Acceleration: ${car.acceleration}
  - Top Speed: ${car.topSpeed}
  - Fuel Type: ${car.fuelType}
  - Transmission: ${car.transmission}
  - Category: ${car.category}
  - Features: ${car.features?.join(", ")}`
    ).join("\n\n");

    const systemPrompt = `You are an expert automotive analyst for CARBAZAAR, an Indian car marketplace. Generate a detailed comparison report.

Format your response EXACTLY as follows using markdown:

## 🏆 AI Comparison Report

### Overview
Brief 2-sentence summary of the comparison.

### Car-by-Car Analysis

For each car, provide:
#### [Car Name]
**Pros:**
- Pro 1
- Pro 2
- Pro 3

**Cons:**
- Con 1
- Con 2

**Best For:** One line describing ideal buyer

### Head-to-Head Verdict

| Aspect | [Car 1] | [Car 2] | ${cars.length > 2 ? "| [Car 3] |" : ""}
|--------|---------|---------|${cars.length > 2 ? "---------|" : ""}
| Value for Money | ⭐⭐⭐⭐ | ⭐⭐⭐ |${cars.length > 2 ? " ⭐⭐⭐⭐ |" : ""}
| Performance | ... | ... |${cars.length > 2 ? " ... |" : ""}
| Comfort | ... | ... |${cars.length > 2 ? " ... |" : ""}
| Fuel Efficiency | ... | ... |${cars.length > 2 ? " ... |" : ""}

### 🏅 Our Recommendation
A clear recommendation with reasoning (3-4 sentences). Consider Indian driving conditions, resale value, and overall value proposition.

Guidelines:
- Be objective and data-driven
- Format prices in Indian Lakhs/Crores
- Consider Indian road conditions, fuel costs, maintenance
- Be decisive in your recommendation`;

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
          { role: "user", content: `Compare these cars:\n\n${carsDescription}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    console.error("ai-car-comparison error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
