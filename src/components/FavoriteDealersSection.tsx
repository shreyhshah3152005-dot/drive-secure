import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, MapPin, Phone, Heart, Car, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoriteDealers } from "@/hooks/useFavoriteDealers";
import DealerRatingBadge from "./DealerRatingBadge";

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  profile_image_url: string | null;
  car_count?: number;
}

const FavoriteDealersSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, removeFavorite, isLoading: favoritesLoading } = useFavoriteDealers();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteDealers = async () => {
      if (!user || favorites.length === 0) {
        setDealers([]);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch dealer details for favorites
        const { data: dealersData, error } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, phone, profile_image_url")
          .in("id", favorites);

        if (error) throw error;

        // Fetch car counts for each dealer
        const dealersWithCounts = await Promise.all(
          (dealersData || []).map(async (dealer) => {
            const { count } = await supabase
              .from("dealer_cars")
              .select("*", { count: "exact", head: true })
              .eq("dealer_id", dealer.id)
              .eq("is_active", true);

            return { ...dealer, car_count: count || 0 };
          })
        );

        setDealers(dealersWithCounts);
      } catch (error) {
        console.error("Error fetching favorite dealers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteDealers();
  }, [user, favorites]);

  if (favoritesLoading || isLoading) {
    return (
      <Card className="gradient-card border-border/50 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Favorite Dealers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border/50 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Favorite Dealers
        </CardTitle>
        <CardDescription>
          {dealers.length === 0
            ? "No favorite dealers saved"
            : `${dealers.length} dealer(s) saved - You'll be notified when they add new cars`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dealers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't saved any favorite dealers yet. Save dealers to get notified when they add new cars!
            </p>
            <Button variant="outline" onClick={() => navigate("/dealers")}>
              Explore Dealers
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dealers.map((dealer) => (
              <div
                key={dealer.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Dealer Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {dealer.profile_image_url ? (
                      <img
                        src={dealer.profile_image_url}
                        alt={dealer.dealership_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Dealer Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">
                      {dealer.dealership_name}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{dealer.city}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Car className="w-3 h-3 mr-1" />
                        {dealer.car_count} cars
                      </Badge>
                      <DealerRatingBadge dealerId={dealer.id} />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/dealer/${dealer.id}`)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => removeFavorite(dealer.id)}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteDealersSection;