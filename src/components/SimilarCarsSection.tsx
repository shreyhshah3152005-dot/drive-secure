import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Car, Fuel, Settings2 } from "lucide-react";

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  category: string;
  fuel_type: string;
  transmission: string;
  price: number;
  image_url: string | null;
  dealer_id: string;
}

interface SimilarCarsSectionProps {
  currentCarId: string;
  category: string;
  price: number;
  fuelType?: string;
}

const formatPrice = (price: number) => {
  if (price >= 100) {
    return `₹${(price / 100).toFixed(2)} Cr`;
  }
  return `₹${price.toFixed(2)} Lakh`;
};

const SimilarCarsSection = ({
  currentCarId,
  category,
  price,
  fuelType,
}: SimilarCarsSectionProps) => {
  const [similarCars, setSimilarCars] = useState<DealerCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarCars = async () => {
      try {
        // Calculate price range (±30% of current price)
        const minPrice = price * 0.7;
        const maxPrice = price * 1.3;

        // Fetch cars with same category or similar price range
        const { data, error } = await supabase
          .from("dealer_cars")
          .select("id, name, brand, category, fuel_type, transmission, price, image_url, dealer_id")
          .eq("is_active", true)
          .neq("id", currentCarId)
          .or(`category.eq.${category},and(price.gte.${minPrice},price.lte.${maxPrice})`)
          .limit(6);

        if (error) throw error;

        // Sort by relevance: same category first, then by price similarity
        const sorted = (data || []).sort((a, b) => {
          const aScore = (a.category === category ? 2 : 0) + (a.fuel_type === fuelType ? 1 : 0);
          const bScore = (b.category === category ? 2 : 0) + (b.fuel_type === fuelType ? 1 : 0);
          return bScore - aScore;
        });

        setSimilarCars(sorted.slice(0, 4));
      } catch (error) {
        console.error("Error fetching similar cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarCars();
  }, [currentCarId, category, price, fuelType]);

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-xl font-bold mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (similarCars.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Car className="w-5 h-5 text-primary" />
        You Might Also Like
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similarCars.map((car) => (
          <Link key={car.id} to={`/dealer-car/${car.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors overflow-hidden group">
              <div className="aspect-[4/3] relative bg-muted">
                {car.image_url ? (
                  <img
                    src={car.image_url}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 text-xs">{car.category}</Badge>
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{car.brand}</p>
                <h3 className="font-semibold text-sm line-clamp-1">{car.name}</h3>
                <p className="text-primary font-bold text-sm mt-1">{formatPrice(car.price)}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    {car.fuel_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings2 className="w-3 h-3" />
                    {car.transmission.split(" ")[0]}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SimilarCarsSection;