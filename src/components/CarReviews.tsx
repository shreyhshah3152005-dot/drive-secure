import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Review {
  id: string;
  user_id: string;
  car_id: string;
  rating: number;
  title: string;
  review_text: string;
  created_at: string;
}

interface CarReviewsProps {
  carId: string;
  carName: string;
}

const CarReviews = ({ carId, carName }: CarReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("car_reviews")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [carId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (!title.trim() || !reviewText.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("car_reviews").insert({
        user_id: user.id,
        car_id: carId,
        rating,
        title: title.trim(),
        review_text: reviewText.trim(),
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setTitle("");
      setReviewText("");
      setRating(5);
      setShowForm(false);
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-${interactive ? "pointer" : "default"} transition-colors ${
              star <= (interactive ? (hoveredRating || rating) : count)
                ? "text-primary fill-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Customer Reviews
          </h2>
          <p className="text-muted-foreground mt-1">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} • Average rating: {averageRating}/5
          </p>
        </div>
        {user && !showForm && (
          <Button variant="hero" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && user && (
        <Card className="gradient-card border-border/50 mb-8">
          <CardHeader>
            <CardTitle>Write a Review for {carName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Rating
                </label>
                {renderStars(rating, true)}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Review Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Review
                </label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this car..."
                  rows={4}
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="gradient-card border-border/50 mb-8">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              Please{" "}
              <a href="/auth" className="text-primary hover:underline">
                login
              </a>{" "}
              to write a review
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="gradient-card border-border/50">
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No reviews yet. Be the first to review this car!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="gradient-card border-border/50">
              <CardContent className="py-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{review.title}</h4>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(review.created_at), "MMM dd, yyyy")}
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {review.review_text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default CarReviews;
