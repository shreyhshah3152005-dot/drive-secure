import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GitCompare, Store, MapPin, Fuel, Settings, Users, Gauge, Zap } from "lucide-react";

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  fuel_type: string;
  transmission: string;
  seating_capacity: number;
  mileage: string | null;
  engine: string | null;
  power: string | null;
  image_url: string | null;
  dealer_id: string;
  dealers?: {
    id: string;
    dealership_name: string;
    city: string;
    phone: string | null;
  };
}

// Price is stored in Lakhs
const formatPrice = (price: number): string => {
  if (price >= 100) {
    return `₹${(price / 100).toFixed(2)} Cr`;
  }
  return `₹${price.toFixed(2)} L`;
};

const CompareDealerCars = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const carName = searchParams.get("car");
  
  const [allCars, setAllCars] = useState<DealerCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarName, setSelectedCarName] = useState<string>(carName || "");

  useEffect(() => {
    const fetchAllCars = async () => {
      try {
        const { data, error } = await supabase
          .from("dealer_cars")
          .select(`
            *,
            dealers (
              id,
              dealership_name,
              city,
              phone
            )
          `)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setAllCars(data || []);
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCars();
  }, []);

  // Get unique car names that have multiple dealers
  const carNamesWithMultipleDealers = useMemo(() => {
    const carCounts: Record<string, number> = {};
    
    allCars.forEach(car => {
      const key = `${car.brand} ${car.name}`.toLowerCase();
      carCounts[key] = (carCounts[key] || 0) + 1;
    });

    return Object.entries(carCounts)
      .filter(([, count]) => count > 1)
      .map(([name]) => name);
  }, [allCars]);

  // Get all unique car names for selection
  const uniqueCarNames = useMemo(() => {
    const names = new Set<string>();
    allCars.forEach(car => {
      names.add(`${car.brand} ${car.name}`);
    });
    return Array.from(names).sort();
  }, [allCars]);

  // Filter cars by selected name
  const carsToCompare = useMemo(() => {
    if (!selectedCarName) return [];
    
    return allCars.filter(car => 
      `${car.brand} ${car.name}`.toLowerCase() === selectedCarName.toLowerCase()
    );
  }, [allCars, selectedCarName]);

  // Find lowest price
  const lowestPrice = useMemo(() => {
    if (carsToCompare.length === 0) return 0;
    return Math.min(...carsToCompare.map(c => c.price));
  }, [carsToCompare]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 flex items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-primary" />
                  Compare Dealer Prices
                </h1>
                <p className="text-sm text-muted-foreground">
                  Find the best deal from different dealers
                </p>
              </div>
            </div>
            
            {/* Car Selector */}
            <div className="w-full md:w-[300px]">
              <Select value={selectedCarName} onValueChange={setSelectedCarName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a car to compare" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCarNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                      {carNamesWithMultipleDealers.includes(name.toLowerCase()) && (
                        <span className="ml-2 text-xs text-primary">(Multiple Dealers)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {!selectedCarName ? (
            <div className="text-center py-16">
              <GitCompare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select a Car to Compare</h2>
              <p className="text-muted-foreground mb-4">
                Choose a car from the dropdown above to see prices from different dealers
              </p>
              {carNamesWithMultipleDealers.length > 0 && (
                <p className="text-sm text-primary">
                  {carNamesWithMultipleDealers.length} cars available from multiple dealers
                </p>
              )}
            </div>
          ) : carsToCompare.length === 1 ? (
            <div className="text-center py-16">
              <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Only One Dealer</h2>
              <p className="text-muted-foreground mb-4">
                This car is currently available from only one dealer
              </p>
              <Button onClick={() => navigate(`/dealer-car/${carsToCompare[0].id}`)}>
                View Car Details
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedCarName}</h2>
                      <p className="text-muted-foreground">
                        Available from {carsToCompare.length} dealers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Best Price</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(lowestPrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dealer Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {carsToCompare
                  .sort((a, b) => a.price - b.price)
                  .map((car, index) => (
                    <Card 
                      key={car.id} 
                      className={`relative overflow-hidden ${
                        car.price === lowestPrice 
                          ? "border-primary ring-2 ring-primary/20" 
                          : ""
                      }`}
                    >
                      {car.price === lowestPrice && (
                        <Badge className="absolute top-3 right-3 bg-primary">
                          Best Price
                        </Badge>
                      )}
                      
                      {/* Car Image */}
                      <div className="aspect-video bg-muted">
                        {car.image_url ? (
                          <img 
                            src={car.image_url} 
                            alt={car.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">🚗</span>
                          </div>
                        )}
                      </div>
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Store className="w-4 h-4" />
                          {car.dealers?.dealership_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {car.dealers?.city}
                        </div>
                        <CardTitle className="text-2xl text-primary mt-2">
                          {formatPrice(car.price)}
                        </CardTitle>
                        {car.price > lowestPrice && (
                          <p className="text-sm text-muted-foreground">
                            +{formatPrice(car.price - lowestPrice)} vs best
                          </p>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Fuel className="w-4 h-4" />
                            {car.fuel_type}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Settings className="w-4 h-4" />
                            {car.transmission}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {car.seating_capacity} Seats
                          </div>
                          {car.mileage && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Gauge className="w-4 h-4" />
                              {car.mileage}
                            </div>
                          )}
                          {car.power && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                              <Zap className="w-4 h-4" />
                              {car.power}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            onClick={() => navigate(`/dealer-car/${car.id}`)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/dealer/${car.dealer_id}`)}
                          >
                            Dealer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CompareDealerCars;
