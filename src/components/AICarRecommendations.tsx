import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Car, Fuel, Settings2, Star, MapPin, RefreshCw } from "lucide-react";

interface CarRecommendation {
  car_id: string;
  reason: string;
  match_score: number;
  match_tags: string[];
  car: {
    id: string;
    name: string;
    brand: string;
    category: string;
    fuel_type: string;
    transmission: string;
    price: number;
    image_url: string | null;
    dealer_name: string;
    dealer_city: string;
  };
}

const formatPrice = (price: number) => {
  if (price >= 100) return `₹${(price / 100).toFixed(2)} Cr`;
  return `₹${price.toFixed(2)} Lakh`;
};

const AICarRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<CarRecommendation[]>([]);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRecommendations = async () => {
    if (!user) {
      toast.error("Please sign in to get personalized recommendations");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-car-recommendations", {
        body: {},
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setRecommendations(data.recommendations || []);
      setSummary(data.summary || "");
      setHasLoaded(true);
    } catch (error: any) {
      console.error("Error fetching AI recommendations:", error);
      toast.error("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <Button
            onClick={fetchRecommendations}
            disabled={isLoading}
            variant={hasLoaded ? "outline" : "default"}
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {hasLoaded ? "Refresh" : "Get Recommendations"}
          </Button>
        </div>
        {summary && (
          <p className="text-sm text-muted-foreground mt-1">{summary}</p>
        )}
      </CardHeader>
      <CardContent>
        {!hasLoaded && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Get Recommendations" to see AI-powered car suggestions based on your browsing history and preferences.</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing your preferences...</p>
          </div>
        )}

        {hasLoaded && recommendations.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-4">
            No recommendations available. Try browsing more cars to help our AI learn your preferences!
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <Link key={rec.car_id} to={`/dealer-car/${rec.car_id}`}>
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 overflow-hidden group">
                  <div className="aspect-[4/3] relative bg-muted">
                    {rec.car.image_url ? (
                      <img
                        src={rec.car.image_url}
                        alt={rec.car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                      <Badge className="text-xs bg-primary/90">{rec.car.category}</Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        {rec.match_score}% match
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider">
                      {rec.car.brand}
                    </p>
                    <h3 className="font-bold text-foreground line-clamp-1">{rec.car.name}</h3>
                    <p className="text-primary font-bold text-lg mt-1">
                      {formatPrice(rec.car.price)}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        {rec.car.fuel_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings2 className="w-3 h-3" />
                        {rec.car.transmission.split(" ")[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {rec.car.dealer_city}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">
                      "{rec.reason}"
                    </p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {rec.match_tags.slice(0, 3).map((tag, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AICarRecommendations;
