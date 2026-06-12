import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CarLite {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  fuel_type: string;
}

interface Props {
  cars: CarLite[];
}

interface Suggestion {
  suggested_price: number;
  min_price: number;
  max_price: number;
  reasoning: string;
  comparables_count: number;
}

export default function AIPriceSuggestion({ cars }: Props) {
  const [carId, setCarId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Suggestion | null>(null);

  const fetchSuggestion = async () => {
    if (!carId) {
      toast.error("Select a car first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-price-suggestion", {
        body: { car_id: carId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Suggestion);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate suggestion");
    } finally {
      setLoading(false);
    }
  };

  const selected = cars.find((c) => c.id === carId);
  const diff = selected && result ? result.suggested_price - selected.price : 0;

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />AI Price Suggestions</CardTitle>
        <CardDescription>Get a market-driven price recommendation based on comparable listings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={carId} onValueChange={setCarId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Select a car" /></SelectTrigger>
            <SelectContent>
              {cars.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.brand} {c.name} — ₹{(c.price / 100000).toFixed(2)} L</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchSuggestion} disabled={loading || !carId}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Get AI Suggestion
          </Button>
        </div>

        {result && selected && (
          <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Your Price</p>
                <p className="text-lg font-bold">₹{(selected.price / 100000).toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AI Suggested</p>
                <p className="text-lg font-bold text-primary">₹{(result.suggested_price / 100000).toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Difference</p>
                <p className={`text-lg font-bold ${diff >= 0 ? "text-green-500" : "text-destructive"}`}>
                  {diff >= 0 ? "+" : ""}₹{(diff / 100000).toFixed(2)} L
                </p>
              </div>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Range: ₹{(result.min_price / 100000).toFixed(2)} L – ₹{(result.max_price / 100000).toFixed(2)} L • Based on {result.comparables_count} comparable listing(s)
            </div>
            <div className="text-sm whitespace-pre-wrap border-t pt-3">{result.reasoning}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
