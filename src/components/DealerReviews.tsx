import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface DealerReviewsProps {
  dealerId: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

const DealerReviews = ({ dealerId }: DealerReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("dealer_reviews")
          .select("id, rating, review_text, created_at")
          .eq("dealer_id", dealerId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setReviews(data || []);
        if (data && data.length > 0) {
          const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
          setAverageRating(avg);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [dealerId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Customer Reviews</span>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-normal text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews.length} reviews)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "MMM dd, yyyy")}
              </span>
            </div>
            {review.review_text && (
              <p className="text-sm text-muted-foreground">{review.review_text}</p>
            )}
          </div>
        ))}
        {reviews.length > 5 && (
          <p className="text-sm text-muted-foreground text-center">
            And {reviews.length - 5} more reviews
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DealerReviews;
