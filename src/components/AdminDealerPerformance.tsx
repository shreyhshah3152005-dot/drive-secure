import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Clock, 
  Star, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Car,
  Users
} from "lucide-react";
import DealerVerificationBadge, { type VerificationStatus } from "./DealerVerificationBadge";

interface DealerPerformance {
  id: string;
  dealership_name: string;
  city: string;
  verification_status: string;
  subscription_plan: string;
  // Metrics
  total_test_drives: number;
  completed_test_drives: number;
  cancelled_test_drives: number;
  pending_test_drives: number;
  avg_response_time_hours: number | null;
  total_reviews: number;
  avg_rating: number | null;
  total_cars: number;
}

const AdminDealerPerformance = () => {
  const [dealers, setDealers] = useState<DealerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDealerPerformance = async () => {
    try {
      // Fetch all active dealers
      const { data: dealersData, error: dealersError } = await supabase
        .from("dealers")
        .select("id, dealership_name, city, verification_status, subscription_plan")
        .eq("is_active", true)
        .order("dealership_name");

      if (dealersError) throw dealersError;

      // Fetch test drive stats for each dealer
      const dealerPerformance: DealerPerformance[] = await Promise.all(
        (dealersData || []).map(async (dealer) => {
          // Get test drive stats
          const { data: testDrives } = await supabase
            .from("test_drive_inquiries")
            .select("id, status, created_at, completed_at")
            .eq("dealer_id", dealer.id);

          const total_test_drives = testDrives?.length || 0;
          const completed_test_drives = testDrives?.filter(td => td.status === "completed").length || 0;
          const cancelled_test_drives = testDrives?.filter(td => td.status === "cancelled").length || 0;
          const pending_test_drives = testDrives?.filter(td => td.status === "pending").length || 0;

          // Calculate avg response time for completed test drives
          let avg_response_time_hours: number | null = null;
          const completedWithTime = testDrives?.filter(td => td.status === "completed" && td.completed_at);
          if (completedWithTime && completedWithTime.length > 0) {
            const totalHours = completedWithTime.reduce((acc, td) => {
              const created = new Date(td.created_at);
              const completed = new Date(td.completed_at!);
              const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
              return acc + hours;
            }, 0);
            avg_response_time_hours = totalHours / completedWithTime.length;
          }

          // Get review stats
          const { data: reviews } = await supabase
            .from("dealer_reviews")
            .select("rating")
            .eq("dealer_id", dealer.id);

          const total_reviews = reviews?.length || 0;
          const avg_rating = total_reviews > 0 
            ? reviews!.reduce((acc, r) => acc + r.rating, 0) / total_reviews 
            : null;

          // Get car count
          const { data: cars } = await supabase
            .from("dealer_cars")
            .select("id")
            .eq("dealer_id", dealer.id)
            .eq("is_active", true);

          return {
            ...dealer,
            total_test_drives,
            completed_test_drives,
            cancelled_test_drives,
            pending_test_drives,
            avg_response_time_hours,
            total_reviews,
            avg_rating,
            total_cars: cars?.length || 0,
          };
        })
      );

      setDealers(dealerPerformance);
    } catch (error) {
      console.error("Error fetching dealer performance:", error);
      toast.error("Failed to fetch dealer performance metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealerPerformance();
  }, []);

  const getConversionRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getResponseTimeColor = (hours: number | null) => {
    if (hours === null) return "text-muted-foreground";
    if (hours <= 24) return "text-green-500";
    if (hours <= 48) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null) return "text-muted-foreground";
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 3.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceScore = (dealer: DealerPerformance) => {
    let score = 0;
    
    // Conversion rate (max 30 points)
    const conversionRate = getConversionRate(dealer.completed_test_drives, dealer.total_test_drives);
    score += Math.min(conversionRate * 0.3, 30);
    
    // Response time (max 25 points)
    if (dealer.avg_response_time_hours !== null) {
      if (dealer.avg_response_time_hours <= 24) score += 25;
      else if (dealer.avg_response_time_hours <= 48) score += 15;
      else if (dealer.avg_response_time_hours <= 72) score += 5;
    }
    
    // Customer rating (max 30 points)
    if (dealer.avg_rating !== null) {
      score += (dealer.avg_rating / 5) * 30;
    }
    
    // Activity (max 15 points based on test drives)
    score += Math.min(dealer.total_test_drives * 1.5, 15);
    
    return Math.round(score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    if (score >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Dealer Performance Metrics
        </CardTitle>
        <CardDescription>
          Track dealer performance to help with verification decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dealers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active dealers found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dealers.map((dealer) => {
              const conversionRate = getConversionRate(dealer.completed_test_drives, dealer.total_test_drives);
              const performanceScore = getPerformanceScore(dealer);
              
              return (
                <div
                  key={dealer.id}
                  className="p-5 rounded-xl bg-secondary/30 border border-border/50"
                >
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-foreground text-lg">
                        {dealer.dealership_name}
                      </h3>
                      <DealerVerificationBadge 
                        status={dealer.verification_status as VerificationStatus} 
                        size="sm" 
                      />
                      <Badge variant="outline" className="text-xs">
                        {dealer.subscription_plan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Performance Score:</span>
                      <Badge className={`${getScoreColor(performanceScore)} text-white`}>
                        {performanceScore}/100
                      </Badge>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Booking Rate */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        Booking Rate
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">{conversionRate}%</span>
                        <span className="text-xs text-muted-foreground">
                          {dealer.completed_test_drives}/{dealer.total_test_drives}
                        </span>
                      </div>
                      <Progress value={conversionRate} className="h-2" />
                    </div>

                    {/* Response Time */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        Avg Response Time
                      </div>
                      <div className={`text-2xl font-bold ${getResponseTimeColor(dealer.avg_response_time_hours)}`}>
                        {dealer.avg_response_time_hours !== null 
                          ? `${Math.round(dealer.avg_response_time_hours)}h`
                          : "N/A"
                        }
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dealer.avg_response_time_hours !== null && dealer.avg_response_time_hours <= 24 
                          ? "Excellent" 
                          : dealer.avg_response_time_hours !== null && dealer.avg_response_time_hours <= 48
                          ? "Good"
                          : dealer.avg_response_time_hours !== null
                          ? "Needs improvement"
                          : "No data"
                        }
                      </span>
                    </div>

                    {/* Customer Rating */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Star className="w-4 h-4" />
                        Customer Rating
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getRatingColor(dealer.avg_rating)}`}>
                          {dealer.avg_rating !== null 
                            ? dealer.avg_rating.toFixed(1)
                            : "N/A"
                          }
                        </span>
                        {dealer.avg_rating !== null && (
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= Math.round(dealer.avg_rating!)
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dealer.total_reviews} review{dealer.total_reviews !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Inventory & Activity */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Car className="w-4 h-4" />
                        Inventory & Activity
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {dealer.total_cars} cars
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle className="w-3 h-3" />
                          {dealer.completed_test_drives} done
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <XCircle className="w-3 h-3" />
                          {dealer.cancelled_test_drives} cancelled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scoring Legend */}
        <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Performance Score Guide</h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">70-100: Excellent (Premium Partner ready)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">50-69: Good (Trusted ready)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">30-49: Average (Verified ready)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">0-29: Needs improvement</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDealerPerformance;
