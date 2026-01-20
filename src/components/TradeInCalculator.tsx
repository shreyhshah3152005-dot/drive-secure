import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, Car, TrendingDown, IndianRupee } from "lucide-react";

const carMakes = [
  "Tata", "Mahindra", "Maruti Suzuki", "Hyundai", "Honda", "Toyota", "Kia", "MG",
  "Volkswagen", "Skoda", "BMW", "Mercedes-Benz", "Audi", "Nissan", "Renault", "Ford"
];

const conditions = [
  { value: "excellent", label: "Excellent", description: "Like new, no issues", multiplier: 0.95 },
  { value: "good", label: "Good", description: "Minor wear, well maintained", multiplier: 0.85 },
  { value: "fair", label: "Fair", description: "Some repairs needed", multiplier: 0.70 },
  { value: "poor", label: "Poor", description: "Significant issues", multiplier: 0.50 },
];

// Base depreciation rates per year
const depreciationRates: Record<number, number> = {
  0: 1.0,
  1: 0.85, // 15% first year
  2: 0.75, // 10% second year
  3: 0.65, // 10% third year
  4: 0.58, // 7% fourth year
  5: 0.52, // 6% fifth year
  6: 0.47, // 5% per year after
  7: 0.42,
  8: 0.38,
  9: 0.34,
  10: 0.30,
};

interface ValuationResult {
  estimatedValue: number;
  originalPrice: number;
  depreciationPercentage: number;
  condition: string;
}

const TradeInCalculator = () => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    originalPrice: "",
    mileage: "",
    condition: "",
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  const calculateTradeInValue = async () => {
    if (!formData.make || !formData.model || !formData.year || !formData.originalPrice || !formData.mileage || !formData.condition) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsCalculating(true);
    try {
      const originalPrice = parseFloat(formData.originalPrice);
      const mileage = parseInt(formData.mileage);
      const carAge = currentYear - parseInt(formData.year);
      
      // Base depreciation based on age
      const ageDepreciation = depreciationRates[Math.min(carAge, 10)] || 0.25;
      
      // Condition multiplier
      const conditionData = conditions.find(c => c.value === formData.condition);
      const conditionMultiplier = conditionData?.multiplier || 0.7;
      
      // Mileage adjustment (average 12,000 km/year is standard)
      const expectedMileage = carAge * 12000;
      const mileageDifference = mileage - expectedMileage;
      const mileageAdjustment = 1 - (mileageDifference * 0.00001); // 1% per 10,000 km extra
      const finalMileageMultiplier = Math.max(0.7, Math.min(1.1, mileageAdjustment));
      
      // Calculate final value
      const baseValue = originalPrice * ageDepreciation;
      const conditionAdjusted = baseValue * conditionMultiplier;
      const finalValue = conditionAdjusted * finalMileageMultiplier;
      
      const depreciationPercentage = ((originalPrice - finalValue) / originalPrice) * 100;

      const valuationResult: ValuationResult = {
        estimatedValue: Math.round(finalValue),
        originalPrice,
        depreciationPercentage: Math.round(depreciationPercentage),
        condition: conditionData?.label || formData.condition,
      };

      setResult(valuationResult);

      // Save to database
      if (user) {
        await supabase.from("trade_in_valuations").insert({
          user_id: user.id,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          mileage: mileage,
          condition: formData.condition,
          estimated_value: valuationResult.estimatedValue,
        });
      }
    } catch (error) {
      console.error("Error calculating trade-in value:", error);
      toast.error("Failed to calculate value");
    } finally {
      setIsCalculating(false);
    }
  };

  const resetCalculator = () => {
    setFormData({
      make: "",
      model: "",
      year: "",
      originalPrice: "",
      mileage: "",
      condition: "",
    });
    setResult(null);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString()}`;
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="h-4 w-4" />
          Trade-In Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Trade-In Value Calculator
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Make *</Label>
                <Select value={formData.make} onValueChange={(v) => setFormData({ ...formData, make: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {carMakes.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Model *</Label>
                <Input
                  placeholder="e.g., Nexon, Creta"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year of Purchase *</Label>
                <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Original Price (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1500000"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Current Mileage (km) *</Label>
              <Input
                type="number"
                placeholder="e.g., 45000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              />
            </div>

            <div>
              <Label>Condition *</Label>
              <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-muted-foreground">{c.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={calculateTradeInValue} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Trade-In Value
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="text-center pb-2">
                <CardDescription>Estimated Trade-In Value</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">
                  {formatPrice(result.estimatedValue)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground">Original Price</p>
                    <p className="font-semibold">{formatPrice(result.originalPrice)}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground">Total Depreciation</p>
                    <p className="font-semibold text-destructive flex items-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      {result.depreciationPercentage}%
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-muted-foreground text-sm mb-1">Vehicle Details</p>
                  <p className="font-medium">
                    {formData.year} {formData.make} {formData.model}
                  </p>
                  <div className="flex justify-center gap-2 mt-2">
                    <Badge variant="secondary">{formData.mileage} km</Badge>
                    <Badge variant="secondary">{result.condition}</Badge>
                  </div>
                </div>

                <div className="p-3 bg-yellow-500/10 rounded-lg text-center text-sm">
                  <p className="text-muted-foreground">
                    💡 This is an estimate based on market data. Actual value may vary based on specific vehicle condition and market demand.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetCalculator}>
                    Calculate Another
                  </Button>
                  <Button className="flex-1" onClick={() => setDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TradeInCalculator;
