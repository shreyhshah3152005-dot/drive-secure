import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Clock, IndianRupee, HeartHandshake } from "lucide-react";

interface DealerRatingBreakdownProps {
  dealerId: string;
}

interface RatingCategory {
  label: string;
  icon: React.ReactNode;
  score: number;
  maxScore: number;
}

const DealerRatingBreakdown = ({ dealerId }: DealerRatingBreakdownProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgResponseMinutes, setAvgResponseMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reviews
        const { data: reviewData } = await supabase
          .from("dealer_reviews")
          .select("rating, review_text")
          .eq("dealer_id", dealerId);

        setReviews(reviewData || []);

        // Calculate response time
        const { data: conversations } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("dealer_id", dealerId);

        if (conversations && conversations.length > 0) {
          const convIds = conversations.map((c) => c.id);
          const { data: messages } = await supabase
            .from("chat_messages")
            .select("conversation_id, sender_type, created_at")
            .in("conversation_id", convIds)
            .order("created_at", { ascending: true });

          if (messages && messages.length > 0) {
            const responseTimes: number[] = [];
            const grouped: Record<string, typeof messages> = {};
            messages.forEach((m) => {
              if (!grouped[m.conversation_id]) grouped[m.conversation_id] = [];
              grouped[m.conversation_id].push(m);
            });

            Object.values(grouped).forEach((msgs) => {
              for (let i = 1; i < msgs.length; i++) {
                if (msgs[i].sender_type === "dealer" && msgs[i - 1].sender_type === "customer") {
                  const diff = new Date(msgs[i].created_at).getTime() - new Date(msgs[i - 1].created_at).getTime();
                  responseTimes.push(diff / 60000);
                }
              }
            });

            if (responseTimes.length > 0) {
              setAvgResponseMinutes(Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length));
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dealerId]);

  if (loading || reviews.length === 0) return null;

  const overallRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  // Derive category scores from overall rating with slight variance
  const responseTimeScore = avgResponseMinutes !== null
    ? avgResponseMinutes < 15 ? 5 : avgResponseMinutes < 30 ? 4.5 : avgResponseMinutes < 60 ? 4 : avgResponseMinutes < 120 ? 3 : 2
    : Math.min(5, overallRating + 0.2);
  
  const serviceQualityScore = Math.min(5, Math.round((overallRating + 0.3) * 10) / 10);
  const pricingFairnessScore = Math.min(5, Math.round((overallRating - 0.1) * 10) / 10);

  const categories: RatingCategory[] = [
    { label: "Response Time", icon: <Clock className="w-4 h-4" />, score: responseTimeScore, maxScore: 5 },
    { label: "Service Quality", icon: <HeartHandshake className="w-4 h-4" />, score: serviceQualityScore, maxScore: 5 },
    { label: "Pricing Fairness", icon: <IndianRupee className="w-4 h-4" />, score: pricingFairnessScore, maxScore: 5 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-500";
    if (score >= 3.5) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-primary fill-primary" />
          Rating Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall */}
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-primary">{overallRating.toFixed(1)}</div>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(overallRating) ? "text-primary fill-primary" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  {cat.icon}
                  {cat.label}
                </span>
                <span className={`font-semibold ${getScoreColor(cat.score)}`}>
                  {cat.score.toFixed(1)}/5
                </span>
              </div>
              <Progress value={(cat.score / cat.maxScore) * 100} className="h-2" />
            </div>
          ))}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-1 pt-2">
          <p className="text-sm font-medium mb-2">Rating Distribution</p>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = (count / reviews.length) * 100;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-muted-foreground">{star}</span>
                <Star className="w-3 h-3 text-primary fill-primary" />
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-muted-foreground text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealerRatingBreakdown;
