import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Car, Store, Star, ChevronRight } from "lucide-react";

interface DealerWithCarCount {
  id: string;
  dealership_name: string;
  city: string;
  profile_image_url: string | null;
  car_count: number;
}

const FeaturedDealers = () => {
  const [dealers, setDealers] = useState<DealerWithCarCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedDealers = async () => {
      try {
        // First get all active dealers
        const { data: dealersData, error: dealersError } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, profile_image_url")
          .eq("is_active", true);

        if (dealersError) throw dealersError;

        if (!dealersData || dealersData.length === 0) {
          setDealers([]);
          setLoading(false);
          return;
        }

        // Get car counts for each dealer
        const dealersWithCounts: DealerWithCarCount[] = [];
        for (const dealer of dealersData) {
          const { count } = await supabase
            .from("dealer_cars")
            .select("id", { count: "exact", head: true })
            .eq("dealer_id", dealer.id)
            .eq("is_active", true);

          dealersWithCounts.push({
            ...dealer,
            car_count: count || 0
          });
        }

        // Sort by car count and get top 6
        const topDealers = dealersWithCounts
          .sort((a, b) => b.car_count - a.car_count)
          .slice(0, 6);

        setDealers(topDealers);
      } catch (error) {
        console.error("Error fetching featured dealers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDealers();
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (dealers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10">
            <Star className="w-4 h-4" />
            Featured Partners
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Top <span className="text-gradient-primary">Dealers</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our most trusted dealership partners with the widest selection of vehicles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dealers.map((dealer) => (
            <Link key={dealer.id} to={`/dealer/${dealer.id}`}>
              <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {dealer.profile_image_url ? (
                        <img 
                          src={dealer.profile_image_url} 
                          alt={dealer.dealership_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                        {dealer.dealership_name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {dealer.city}
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                      <Car className="w-3 h-3" />
                      {dealer.car_count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/dealers">
            <Button variant="outline" size="lg" className="gap-2">
              View All Dealers
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDealers;