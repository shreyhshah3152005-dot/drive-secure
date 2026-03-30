import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Car, ArrowLeft } from "lucide-react";
import { cars as staticCars } from "@/data/cars";

const SharedWishlist = () => {
  const { code } = useParams();
  const [carIds, setCarIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      if (!code) { setError(true); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from("wishlist_shares")
        .select("car_ids")
        .eq("share_code", code)
        .single();

      if (err || !data) { setError(true); } else { setCarIds(data.car_ids); }
      setLoading(false);
    };
    fetchShare();
  }, [code]);

  const wishlistCars = staticCars.filter(c => carIds.includes(c.id));

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary" />
          Shared Wishlist
        </h1>
        <p className="text-muted-foreground mb-8">Someone shared their favorite cars with you!</p>

        {error ? (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Wishlist Not Found</h2>
              <p className="text-muted-foreground">This share link is invalid or has expired.</p>
            </CardContent>
          </Card>
        ) : wishlistCars.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No cars found in this wishlist.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistCars.map((car) => (
              <Link key={car.id} to={`/car/${car.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <img src={car.image} alt={car.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                    <h3 className="font-semibold text-foreground">{car.name}</h3>
                    <p className="text-primary font-bold">{formatPrice(car.price)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{car.brand} · {car.fuelType}</p>
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

export default SharedWishlist;
