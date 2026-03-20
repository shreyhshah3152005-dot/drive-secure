import { Link } from "react-router-dom";
import { useRecentlyViewedCars } from "@/hooks/useRecentlyViewedCars";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const formatPrice = (price: number): string => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

const RecentlyViewedCars = () => {
  const { recentCars } = useRecentlyViewedCars();

  if (recentCars.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Recently Viewed</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {recentCars.map((car) => (
            <Link
              key={car.id}
              to={car.type === "new" ? `/car/${car.id}` : `/dealer-car/${car.id}`}
            >
              <Card className="group hover:border-primary/50 transition-all hover:shadow-md overflow-hidden h-full">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm truncate">{car.brand} {car.name}</p>
                  <p className="text-primary font-bold text-sm">{formatPrice(car.price)}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {car.type === "new" ? "New" : "Used"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedCars;
