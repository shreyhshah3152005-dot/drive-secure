import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildStreamResponse = (content: string) => {
  const sseData = `data: ${JSON.stringify({
    choices: [{ delta: { content } }],
  })}\n\ndata: [DONE]\n\n`;

  return new Response(sseData, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
};

const extractImageUrl = (message: any) => {
  const directImageUrl = message?.images?.[0]?.image_url?.url;
  if (typeof directImageUrl === "string" && directImageUrl.length > 0) {
    return directImageUrl;
  }

  if (Array.isArray(message?.content)) {
    const imagePart = message.content.find((part: any) => part?.type === "image_url");
    const nestedUrl = imagePart?.image_url?.url;

    if (typeof nestedUrl === "string" && nestedUrl.length > 0) {
      return nestedUrl;
    }
  }

  return "";
};

const extractTextContent = (rawContent: unknown) => {
  if (typeof rawContent === "string") {
    return rawContent.trim();
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .filter((part: any) => part?.type === "text")
      .map((part: any) => part?.text || "")
      .join("\n")
      .trim();
  }

  return "";
};

const normalizeImageSearchQuery = (input: string) =>
  input
    .replace(/\b(show|generate|create|display|image|photo|picture|pic|render|visual(?:ize)?|illustrate|me|please|can|you)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim() || input.trim();

const fetchWikimediaImage = async (query: string) => {
  const searchQuery = normalizeImageSearchQuery(query);
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", searchQuery);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "CARBAZAAR/1.0 (Lovable Cloud image fallback)",
      },
    });

    if (!response.ok) {
      console.error("Wikimedia fallback error:", response.status, await response.text());
      return "";
    }

    const data = await response.json();
    const pages = Object.values(data?.query?.pages ?? {}) as Array<any>;

    return (
      pages
        .map((page) => page?.imageinfo?.[0]?.url)
        .find((imageUrl) => typeof imageUrl === "string" && imageUrl.length > 0) || ""
    );
  } catch (error) {
    console.error("Wikimedia image lookup failed:", error);
    return "";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

IMPORTANT - IMAGE REQUESTS:
- If the user asks to see an image/photo/picture/rendering of a car, do NOT output placeholder tags like [GENERATE_IMAGE: ...].
- The backend handles image generation separately, so just answer naturally about the car itself.

Guidelines:
- When asked about new cars, provide current market information for brand new models in India
- When asked about used/second hand cars, recommend from the dealer inventory above
- Format prices in Indian Lakhs/Crores (e.g., ₹12.5 L, ₹1.2 Cr)
- Consider Indian driving conditions and preferences
- Keep responses concise but informative (2-4 paragraphs max)
- Use emojis sparingly for friendliness 🚗
- When recommending used cars, mention the dealer name and city`;

    // Check if last user message is asking for an image
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lastUserMsg = lastUserMessage.toLowerCase();
    const isImageRequest =
      /\b(show|generate|create|display|image|photo|picture|pic|render|visual(?:ize)?|illustrate)\b/.test(lastUserMsg) ||
      /what does .+ look like/.test(lastUserMsg);

    if (isImageRequest) {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Generate exactly one photorealistic car image for this request: ${lastUserMessage}. Show the full car clearly, realistic automotive photography, no UI, no watermarks, no text overlays.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const choice = imageData.choices?.[0]?.message;
        const rawContent = choice?.content;

        let imageUrl = extractImageUrl(choice);
        if (!imageUrl) {
          imageUrl = await fetchWikimediaImage(lastUserMessage);
        }

        const textContent = extractTextContent(rawContent) || "Here is the requested car image.";

        if (imageUrl) {
          return buildStreamResponse(`![Generated car image](${imageUrl})\n\n${textContent}`);
        }
      } else {
        const errText = await imageResponse.text();
        console.error("Image gen error:", imageResponse.status, errText);
        const fallbackImageUrl = await fetchWikimediaImage(lastUserMessage);
        if (fallbackImageUrl) {
          return buildStreamResponse(`![Car image](${fallbackImageUrl})\n\nHere is a matching car image from a public web source.`);
        }
      }
    }

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
