import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Clock, ThumbsUp, Medal, MapPin, Store } from "lucide-react";
import { Link } from "react-router-dom";

interface LeaderboardDealer {
  id: string;
  dealership_name: string;
  city: string;
  profile_image_url: string | null;
  avg_rating: number;
  total_reviews: number;
  total_test_drives: number;
  completed_test_drives: number;
  response_rate: number;
  score: number;
}

const DealerLeaderboard = () => {
  const [dealers, setDealers] = useState<LeaderboardDealer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: dealersData } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, profile_image_url")
          .eq("is_active", true);

        if (!dealersData?.length) { setLoading(false); return; }

        const results: LeaderboardDealer[] = [];

        for (const dealer of dealersData) {
          const [reviewsRes, testDrivesRes] = await Promise.all([
            supabase.from("dealer_reviews").select("rating").eq("dealer_id", dealer.id),
            supabase.from("test_drive_inquiries").select("status").eq("dealer_id", dealer.id),
          ]);

          const reviews = reviewsRes.data || [];
          const testDrives = testDrivesRes.data || [];
          const avg_rating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
          const completed = testDrives.filter(t => t.status === "completed").length;
          const response_rate = testDrives.length > 0 ? (completed / testDrives.length) * 100 : 0;

          // Weighted score: 50% rating, 30% response rate, 20% volume
          const volumeScore = Math.min(reviews.length / 10, 1) * 5;
          const score = (avg_rating * 0.5) + ((response_rate / 100) * 5 * 0.3) + (volumeScore * 0.2);

          results.push({
            ...dealer,
            avg_rating: Math.round(avg_rating * 10) / 10,
            total_reviews: reviews.length,
            total_test_drives: testDrives.length,
            completed_test_drives: completed,
            response_rate: Math.round(response_rate),
            score: Math.round(score * 100) / 100,
          });
        }

        results.sort((a, b) => b.score - a.score);
        setDealers(results);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10">
              <Trophy className="w-4 h-4" />
              Dealer Rankings
            </span>
            <h1 className="text-4xl font-bold mb-4">
              Dealer <span className="text-gradient-primary">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ranked by customer satisfaction, response time, and overall service quality
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : dealers.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No dealers found.</p>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {dealers.map((dealer, index) => (
                <Link key={dealer.id} to={`/dealer/${dealer.id}`}>
                  <Card className={`hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer ${index < 3 ? 'border-primary/30' : ''}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex-shrink-0">{getRankIcon(index)}</div>

                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {dealer.profile_image_url ? (
                          <img src={dealer.profile_image_url} alt={dealer.dealership_name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{dealer.dealership_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {dealer.city}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            {dealer.avg_rating || "N/A"}
                          </div>
                          <p className="text-xs text-muted-foreground">{dealer.total_reviews} reviews</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {dealer.response_rate}%
                          </div>
                          <p className="text-xs text-muted-foreground">Response</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
                            {dealer.completed_test_drives}
                          </div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <Badge variant={index < 3 ? "default" : "secondary"} className="ml-2">
                          {dealer.score.toFixed(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DealerLeaderboard;
