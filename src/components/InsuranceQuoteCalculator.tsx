import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, IndianRupee } from "lucide-react";

interface InsuranceQuote {
  provider: string;
  planName: string;
  premium: number;
  coverAmount: number;
  features: string[];
  recommended?: boolean;
}

const InsuranceQuoteCalculator = () => {
  const [carValue, setCarValue] = useState("");
  const [carAge, setCarAge] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [city, setCity] = useState("");
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);

  const calculateQuotes = () => {
    const value = parseFloat(carValue);
    if (!value || !carAge || !fuelType || !city) return;

    const age = parseInt(carAge);
    const depreciation = Math.max(0.5, 1 - age * 0.1);
    const idv = value * depreciation;
    const cityFactor = city === "metro" ? 1.15 : city === "tier2" ? 1.05 : 1.0;
    const fuelFactor = fuelType === "diesel" ? 1.1 : fuelType === "electric" ? 0.85 : fuelType === "cng" ? 0.95 : 1.0;
    const base = idv * 0.028 * cityFactor * fuelFactor;

    const providers: InsuranceQuote[] = [
      {
        provider: "HDFC ERGO",
        planName: "Comprehensive Plus",
        premium: Math.round(base * 1.0),
        coverAmount: Math.round(idv),
        features: ["Zero Depreciation", "Roadside Assistance", "Engine Protection", "NCB Protection"],
        recommended: true,
      },
      {
        provider: "ICICI Lombard",
        planName: "Platinum Cover",
        premium: Math.round(base * 1.08),
        coverAmount: Math.round(idv * 1.05),
        features: ["Zero Depreciation", "Key Replacement", "Tyre Protection", "Consumables Cover"],
      },
      {
        provider: "Bajaj Allianz",
        planName: "Standard Shield",
        premium: Math.round(base * 0.88),
        coverAmount: Math.round(idv * 0.95),
        features: ["Third Party Cover", "Personal Accident", "Roadside Assistance"],
      },
      {
        provider: "New India Assurance",
        planName: "Value Protect",
        premium: Math.round(base * 0.82),
        coverAmount: Math.round(idv * 0.9),
        features: ["Third Party Cover", "Fire & Theft", "Personal Accident"],
      },
      {
        provider: "Tata AIG",
        planName: "Premium Guard",
        premium: Math.round(base * 1.12),
        coverAmount: Math.round(idv * 1.1),
        features: ["Zero Depreciation", "Engine Protection", "Return to Invoice", "Daily Allowance", "EMI Protection"],
      },
    ];

    setQuotes(providers.sort((a, b) => a.premium - b.premium));
  };

  const formatCurrency = (n: number) =>
    `₹${n >= 100000 ? (n / 100000).toFixed(2) + " L" : n.toLocaleString("en-IN")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Car Insurance Quote Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Car Value (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 1200000"
              value={carValue}
              onChange={(e) => setCarValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Car Age (Years)</Label>
            <Select value={carAge} onValueChange={setCarAge}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y === 0 ? "New" : `${y} year${y > 1 ? "s" : ""}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>City Type</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metro">Metro City</SelectItem>
                <SelectItem value="tier2">Tier 2 City</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculateQuotes} className="w-full" disabled={!carValue || !carAge || !fuelType || !city}>
          Get Insurance Quotes
        </Button>

        {quotes.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Estimated Quotes</h3>
            {quotes.map((q) => (
              <Card key={q.provider} className={q.recommended ? "border-primary/50 bg-primary/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{q.provider}</p>
                        {q.recommended && <Badge className="text-xs">Recommended</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{q.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {q.premium.toLocaleString("en-IN")}
                        <span className="text-xs text-muted-foreground font-normal">/yr</span>
                      </p>
                      <p className="text-xs text-muted-foreground">IDV: {formatCurrency(q.coverAmount)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q.features.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                        <CheckCircle className="w-3 h-3" />
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground">* Premiums are estimates. Actual rates may vary by insurer.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceQuoteCalculator;
