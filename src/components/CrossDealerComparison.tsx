import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Scale, MapPin, Store } from "lucide-react";

interface ComparisonCar {
  id: string;
  name: string;
  brand: string;
  price: number;
  fuel_type: string;
  transmission: string;
  mileage: string | null;
  dealer_id: string;
  dealers: { dealership_name: string; city: string } | null;
}

const formatPrice = (price: number) => {
  if (price >= 100) return `₹${(price / 100).toFixed(2)} Cr`;
  return `₹${price.toFixed(2)} L`;
};

const CrossDealerComparison = ({ currentCarId, carName, brand }: { currentCarId: string; carName: string; brand: string }) => {
  const [similarCars, setSimilarCars] = useState<ComparisonCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("dealer_cars")
        .select("id, name, brand, price, fuel_type, transmission, mileage, dealer_id, dealers(dealership_name, city)")
        .eq("is_active", true)
        .eq("brand", brand)
        .ilike("name", `%${carName.split(" ").slice(-1)[0]}%`)
        .neq("id", currentCarId)
        .limit(10);

      if (data) setSimilarCars(data as unknown as ComparisonCar[]);
      setLoading(false);
    };
    fetch();
  }, [currentCarId, carName, brand]);

  if (loading || similarCars.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Compare from Other Dealers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Found {similarCars.length} similar listing{similarCars.length > 1 ? "s" : ""} from other dealers
        </p>
        <div className="space-y-3">
          {similarCars.map(car => (
            <Link key={car.id} to={`/dealer-car/${car.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{car.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Store className="w-3 h-3" />
                    <span>{car.dealers?.dealership_name}</span>
                    <MapPin className="w-3 h-3 ml-1" />
                    <span>{car.dealers?.city}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{car.fuel_type}</Badge>
                    <Badge variant="outline" className="text-xs">{car.transmission}</Badge>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary whitespace-nowrap">{formatPrice(car.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossDealerComparison;
