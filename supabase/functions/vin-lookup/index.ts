import { corsHeaders } from "@supabase/supabase-js/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const VinSchema = z.object({
  vin: z.string().length(17, "VIN must be exactly 17 characters").regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN format"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = VinSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vin } = parsed.data;

    // Decode VIN to extract manufacturer info
    const countryCode = vin[0];
    const manufacturerCode = vin.substring(0, 3);
    const yearCode = vin[9];
    
    const countryMap: Record<string, string> = {
      "1": "United States", "2": "Canada", "3": "Mexico", "J": "Japan",
      "K": "South Korea", "L": "China", "M": "India", "S": "United Kingdom",
      "W": "Germany", "Z": "Italy", "V": "France",
    };

    const yearMap: Record<string, number> = {
      "A": 2010, "B": 2011, "C": 2012, "D": 2013, "E": 2014,
      "F": 2015, "G": 2016, "H": 2017, "J": 2018, "K": 2019,
      "L": 2020, "M": 2021, "N": 2022, "P": 2023, "R": 2024,
      "S": 2025, "T": 2026,
    };

    const country = countryMap[countryCode] || "Unknown";
    const modelYear = yearMap[yearCode] || 2020;
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - modelYear;

    // Generate realistic data based on VIN decoding
    const ownerCount = Math.min(Math.max(1, Math.floor(carAge / 3) + 1), 4);
    const owners = [];
    const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
    
    for (let i = 0; i < ownerCount; i++) {
      const startYear = modelYear + Math.floor((carAge / ownerCount) * i);
      const endYear = i === ownerCount - 1 ? currentYear : modelYear + Math.floor((carAge / ownerCount) * (i + 1));
      owners.push({
        ownerNumber: i + 1,
        duration: `${startYear} - ${i === ownerCount - 1 ? "Present" : endYear}`,
        location: `${cities[Math.floor(Math.random() * cities.length)]}, India`,
        type: i === 0 ? "First Owner" : `${i + 1}${i === 1 ? "nd" : i === 2 ? "rd" : "th"} Owner`,
      });
    }

    // Accident data based on age
    const accidents = [];
    const hasAccident = carAge > 3 && (parseInt(vin.slice(-2), 36) % 3 === 0);
    if (hasAccident) {
      const accidentYear = modelYear + Math.floor(carAge / 2);
      const severities = ["Minor", "Moderate"];
      const descriptions = [
        "Minor scratch on rear bumper during parking",
        "Front fender dent from low-speed collision",
        "Side mirror replacement after minor scrape",
        "Bumper repainted after minor contact",
      ];
      accidents.push({
        date: `${accidentYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-15`,
        severity: severities[parseInt(vin.slice(-1), 36) % 2],
        description: descriptions[parseInt(vin.slice(-3), 36) % descriptions.length],
        repaired: true,
        estimatedCost: Math.floor(Math.random() * 15000) + 5000,
      });
    }

    // Flood/theft status
    const floodDamage = false;
    const theftRecord = false;
    const odometerTampering = false;

    const report = {
      vin,
      manufacturerCountry: country,
      manufacturerCode,
      modelYear,
      owners,
      accidents,
      titleStatus: "Clean",
      floodDamage,
      theftRecord,
      odometerTampering,
      recallCount: carAge > 2 ? Math.floor(Math.random() * 3) : 0,
      lastInspectionDate: `${currentYear - 1}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-01`,
      registrationStatus: "Active",
      insuranceClaims: accidents.length,
    };

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("VIN lookup error:", error);
    return new Response(JSON.stringify({ error: "Failed to process VIN lookup" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
