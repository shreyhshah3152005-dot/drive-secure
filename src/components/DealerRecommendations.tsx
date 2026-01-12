import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DealerRatingBadge from "./DealerRatingBadge";
import { Store, MapPin, Car, Star, TrendingUp } from "lucide-react";

interface RecommendedDealer {
  id: string;
  dealership_name: string;
  city: string;
  profile_image_url: string | null;
  carCount: number;
  avgRating: number;
  reviewCount: number;
  matchReason: string;
}

interface DealerRecommendationsProps {
  limit?: number;
  showTitle?: boolean;
}

const DealerRecommendations = ({ limit = 3, showTitle = true }: DealerRecommendationsProps) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedDealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get user's profile for city preference
        let userCity: string | null = null;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("city")
            .eq("user_id", user.id)
            .single();
          userCity = profile?.city || null;
        }

        // Get user's favorite categories from test drive history
        let preferredCategories: string[] = [];
        if (user) {
          const { data: testDrives } = await supabase
            .from("test_drive_inquiries")
            .select("car_id")
            .eq("user_id", user.id);

          if (testDrives && testDrives.length > 0) {
            const carIds = testDrives.map((td) => td.car_id);
            const { data: cars } = await supabase
              .from("dealer_cars")
              .select("category")
              .in("id", carIds);

            if (cars) {
              preferredCategories = [...new Set(cars.map((c) => c.category))];
            }
          }
        }

        // Fetch all active dealers
        const { data: dealers, error } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, profile_image_url")
          .eq("is_active", true);

        if (error) throw error;
        if (!dealers) {
          setRecommendations([]);
          return;
        }

        // Score and rank dealers
        const scoredDealers: RecommendedDealer[] = [];

        for (const dealer of dealers) {
          // Get car count and categories
          const { data: cars, count } = await supabase
            .from("dealer_cars")
            .select("category", { count: "exact" })
            .eq("dealer_id", dealer.id)
            .eq("is_active", true);

          const carCount = count || 0;
          const dealerCategories = cars ? [...new Set(cars.map((c) => c.category))] : [];

          // Get average rating
          const { data: reviews } = await supabase
            .from("dealer_reviews")
            .select("rating")
            .eq("dealer_id", dealer.id);

          const reviewCount = reviews?.length || 0;
          const avgRating = reviewCount > 0
            ? reviews!.reduce((acc, r) => acc + r.rating, 0) / reviewCount
            : 0;

          // Calculate score and match reason
          let score = 0;
          const matchReasons: string[] = [];

          // City match (highest priority)
          if (userCity && dealer.city.toLowerCase() === userCity.toLowerCase()) {
            score += 30;
            matchReasons.push("Near you");
          }

          // Category match
          const categoryMatch = preferredCategories.some((cat) =>
            dealerCategories.includes(cat)
          );
          if (categoryMatch && preferredCategories.length > 0) {
            score += 25;
            matchReasons.push("Matches your interests");
          }

          // High rating bonus
          if (avgRating >= 4) {
            score += 20;
            matchReasons.push("Highly rated");
          } else if (avgRating >= 3) {
            score += 10;
          }

          // Car inventory bonus
          if (carCount >= 10) {
            score += 15;
            matchReasons.push("Large inventory");
          } else if (carCount >= 5) {
            score += 10;
          }

          // Review count bonus (social proof)
          if (reviewCount >= 10) {
            score += 10;
          } else if (reviewCount >= 5) {
            score += 5;
          }

          // Only include dealers with at least one car
          if (carCount > 0) {
            scoredDealers.push({
              ...dealer,
              carCount,
              avgRating,
              reviewCount,
              matchReason: matchReasons.length > 0 ? matchReasons[0] : "Popular dealer",
            });
          }
        }

        // Sort by score (implicit in order) and take top results
        const sortedDealers = scoredDealers
          .sort((a, b) => {
            // Sort by rating first, then car count
            if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
            return b.carCount - a.carCount;
          })
          .slice(0, limit);

        setRecommendations(sortedDealers);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, limit]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Recommended Dealers</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((dealer) => (
          <Card
            key={dealer.id}
            className="transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 aspect-[4/3] rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {dealer.profile_image_url ? (
                      <img
                        src={dealer.profile_image_url}
                        alt={dealer.dealership_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <Link to={`/dealer/${dealer.id}`}>
                      <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer">
                        {dealer.dealership_name}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {dealer.city}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <DealerRatingBadge dealerId={dealer.id} showCount />
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {dealer.carCount} cars
                </Badge>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {dealer.matchReason}
              </Badge>
              <Link to={`/dealer/${dealer.id}`} className="block mt-3">
                <Button variant="outline" size="sm" className="w-full">
                  View Dealer
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DealerRecommendations;
