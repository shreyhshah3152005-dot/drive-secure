import { Link } from "react-router-dom";
import { cars } from "@/data/cars";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Settings } from "lucide-react";

interface StaticSimilarCarsProps {
  currentCarId: string;
  category: string;
  price: number;
  fuelType: string;
}

const formatPrice = (price: number): string => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

const StaticSimilarCars = ({ currentCarId, category, price, fuelType }: StaticSimilarCarsProps) => {
  const similar = cars
    .filter((c) => c.id !== currentCarId)
    .map((c) => ({
      ...c,
      score:
        (c.category === category ? 3 : 0) +
        (c.fuelType === fuelType ? 2 : 0) +
        (Math.abs(c.price - price) < price * 0.3 ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (similar.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Car className="w-6 h-6 text-primary" />
        You Might Also Like
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {similar.map((car) => (
          <Link key={car.id} to={`/car/${car.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors overflow-hidden group">
              <div className="aspect-[4/3] relative bg-muted">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <Badge className="absolute top-2 left-2 text-xs">{car.category}</Badge>
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{car.brand}</p>
                <h3 className="font-semibold text-sm line-clamp-1">{car.model}</h3>
                <p className="text-primary font-bold text-sm mt-1">{formatPrice(car.price)}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    {car.fuelType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
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

export default StaticSimilarCars;
