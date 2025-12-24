import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User, Calendar, ThumbsUp, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Reply {
  id: string;
  review_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
}

interface Vote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
}

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
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [votes, setVotes] = useState<Record<string, Vote[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("car_reviews")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Fetch all replies and votes for these reviews
      if (reviewsData && reviewsData.length > 0) {
        const reviewIds = reviewsData.map((r) => r.id);

        const { data: repliesData } = await supabase
          .from("review_replies")
          .select("*")
          .in("review_id", reviewIds)
          .order("created_at", { ascending: true });

        const { data: votesData } = await supabase
          .from("review_votes")
          .select("*")
          .in("review_id", reviewIds);

        // Group replies and votes by review_id
        const repliesMap: Record<string, Reply[]> = {};
        const votesMap: Record<string, Vote[]> = {};

        repliesData?.forEach((reply) => {
          if (!repliesMap[reply.review_id]) repliesMap[reply.review_id] = [];
          repliesMap[reply.review_id].push(reply);
        });

        votesData?.forEach((vote) => {
          if (!votesMap[vote.review_id]) votesMap[vote.review_id] = [];
          votesMap[vote.review_id].push(vote);
        });

        setReplies(repliesMap);
        setVotes(votesMap);
      }
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

  const handleReplySubmit = async (reviewId: string) => {
    if (!user) {
      toast.error("Please login to reply");
      return;
    }

    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const { error } = await supabase.from("review_replies").insert({
        review_id: reviewId,
        user_id: user.id,
        reply_text: replyText.trim(),
      });

      if (error) throw error;

      toast.success("Reply added!");
      setReplyText("");
      setReplyingTo(null);
      setExpandedReplies((prev) => new Set([...prev, reviewId]));
      fetchReviews();
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    const existingVote = votes[reviewId]?.find((v) => v.user_id === user.id);

    try {
      if (existingVote) {
        if (existingVote.is_helpful === isHelpful) {
          // Remove vote
          await supabase.from("review_votes").delete().eq("id", existingVote.id);
        } else {
          // Update vote
          await supabase
            .from("review_votes")
            .update({ is_helpful: isHelpful })
            .eq("id", existingVote.id);
        }
      } else {
        // Add new vote
        await supabase.from("review_votes").insert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful,
        });
      }
      fetchReviews();
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to register vote");
    }
  };

  const getVoteCounts = (reviewId: string) => {
    const reviewVotes = votes[reviewId] || [];
    const helpful = reviewVotes.filter((v) => v.is_helpful).length;
    return { helpful, total: reviewVotes.length };
  };

  const hasUserVoted = (reviewId: string) => {
    if (!user) return null;
    const vote = votes[reviewId]?.find((v) => v.user_id === user.id);
    return vote?.is_helpful ?? null;
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 transition-colors ${
              interactive ? "cursor-pointer" : ""
            } ${
              star <= (interactive ? hoveredRating || rating : count)
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
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} • Average rating:{" "}
            {averageRating}/5
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
          {reviews.map((review) => {
            const reviewReplies = replies[review.id] || [];
            const voteCounts = getVoteCounts(review.id);
            const userVote = hasUserVoted(review.id);
            const isExpanded = expandedReplies.has(review.id);

            return (
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
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {review.review_text}
                  </p>

                  {/* Vote and Reply Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(review.id, true)}
                      className={`gap-2 ${userVote === true ? "text-primary" : ""}`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${userVote === true ? "fill-current" : ""}`} />
                      Helpful ({voteCounts.helpful})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                      className="gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Reply ({reviewReplies.length})
                    </Button>
                    {reviewReplies.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedReplies((prev) => {
                            const next = new Set(prev);
                            if (next.has(review.id)) {
                              next.delete(review.id);
                            } else {
                              next.add(review.id);
                            }
                            return next;
                          });
                        }}
                        className="gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Replies
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show Replies
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === review.id && user && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={2}
                        className="bg-secondary/50 border-border/50 mb-3"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="hero"
                          onClick={() => handleReplySubmit(review.id)}
                        >
                          Post Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies List */}
                  {isExpanded && reviewReplies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      {reviewReplies.map((reply) => (
                        <div
                          key={reply.id}
                          className="pl-6 border-l-2 border-primary/30"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.created_at), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{reply.reply_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CarReviews;
