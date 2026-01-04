import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Store, ArrowLeft, Car, Fuel, Settings2 } from "lucide-react";

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  address: string | null;
}

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  category: string;
  fuel_type: string;
  transmission: string;
  price: number;
  image_url: string | null;
  power: string | null;
  engine: string | null;
  mileage: string | null;
  description: string | null;
  seating_capacity: number;
}

const formatPrice = (price: number) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(price / 100000).toFixed(2)} Lakh`;
};

const DealerDetail = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [cars, setCars] = useState<DealerCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealerAndCars = async () => {
      if (!id) return;

      try {
        // Fetch dealer info
        const { data: dealerData, error: dealerError } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, phone, address")
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (dealerError) throw dealerError;
        setDealer(dealerData);

        // Fetch dealer's cars
        const { data: carsData, error: carsError } = await supabase
          .from("dealer_cars")
          .select("*")
          .eq("dealer_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (carsError) throw carsError;
        setCars(carsData || []);
      } catch (error) {
        console.error("Error fetching dealer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealerAndCars();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Dealer Not Found</h1>
          <p className="text-muted-foreground mb-6">This dealer doesn't exist or is no longer active.</p>
          <Link to="/dealers">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dealers
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        {/* Back button */}
        <Link to="/dealers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dealers
        </Link>

        {/* Dealer Header */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{dealer.dealership_name}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {dealer.city}
                </div>
                {dealer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${dealer.phone}`} className="hover:text-primary">
                      {dealer.phone}
                    </a>
                  </div>
                )}
              </div>
              {dealer.address && (
                <p className="text-sm text-muted-foreground mt-2">{dealer.address}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Car className="w-4 h-4 mr-2" />
              {cars.length} Cars
            </Badge>
          </div>
        </div>

        {/* Cars Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6">Available Cars</h2>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-lg">
            <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Cars Listed</h3>
            <p className="text-muted-foreground">This dealer hasn't listed any cars yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Link key={car.id} to={`/dealer-car/${car.id}`}>
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer group overflow-hidden">
                  <div className="aspect-video relative bg-muted">
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3">{car.category}</Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{car.brand}</p>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {car.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        {car.fuel_type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings2 className="w-4 h-4" />
                        {car.transmission}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">{formatPrice(car.price)}</span>
                      <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DealerDetail;
