import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, TrendingUp } from "lucide-react";

interface DealerSoldCarsProps {
  dealerId: string;
}

const DealerSoldCars = ({ dealerId }: DealerSoldCarsProps) => {
  const [soldCars, setSoldCars] = useState<any[]>([]);
  const [totalCars, setTotalCars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: sold } = await supabase
          .from("dealer_cars")
          .select("id, name, brand, price, image_url, category, updated_at")
          .eq("dealer_id", dealerId)
          .eq("is_active", false)
          .order("updated_at", { ascending: false })
          .limit(6);

        const { count } = await supabase
          .from("dealer_cars")
          .select("id", { count: "exact", head: true })
          .eq("dealer_id", dealerId);

        setSoldCars(sold || []);
        setTotalCars(count || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [dealerId]);

  if (loading) return null;

  const soldCount = soldCars.length;
  const successRate = totalCars > 0 ? Math.round((soldCount / totalCars) * 100) : 0;

  if (soldCount === 0) return null;

  const formatPrice = (price: number) => {
    if (price >= 100) return `₹${(price / 100).toFixed(2)} Cr`;
    return `₹${price.toFixed(2)} Lakh`;
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Recently Sold</h2>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            {successRate}% Success Rate
          </Badge>
          <Badge variant="outline">{soldCount} Sold</Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {soldCars.map((car) => (
          <Card key={car.id} className="opacity-75 relative overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-destructive/90 text-destructive-foreground">Sold</Badge>
            </div>
            <div className="aspect-video bg-muted">
              {car.image_url ? (
                <img src={car.image_url} alt={car.name} className="w-full h-full object-cover grayscale" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{car.brand}</p>
              <p className="font-semibold">{car.name}</p>
              <p className="text-sm text-primary font-bold">{formatPrice(car.price)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DealerSoldCars;
