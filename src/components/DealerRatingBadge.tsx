import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DealerRatingBadgeProps {
  dealerId: string;
  className?: string;
  showCount?: boolean;
}

const DealerRatingBadge = ({ dealerId, className = "", showCount = false }: DealerRatingBadgeProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase
          .from("dealer_reviews")
          .select("rating")
          .eq("dealer_id", dealerId);

        if (error) throw error;

        if (data && data.length > 0) {
          const avgRating = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
          setRating(Math.round(avgRating * 10) / 10);
          setCount(data.length);
        }
      } catch (error) {
        console.error("Error fetching dealer rating:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [dealerId]);

  if (loading) {
    return null;
  }

  if (rating === null) {
    return (
      <Badge variant="outline" className={`text-muted-foreground ${className}`}>
        <Star className="w-3 h-3 mr-1" />
        No ratings
      </Badge>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "bg-green-500/20 text-green-500 border-green-500/30";
    if (rating >= 4) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (rating >= 3) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    if (rating >= 2) return "bg-orange-500/20 text-orange-500 border-orange-500/30";
    return "bg-red-500/20 text-red-500 border-red-500/30";
  };

  return (
    <Badge variant="outline" className={`${getRatingColor(rating)} ${className}`}>
      <Star className="w-3 h-3 mr-1 fill-current" />
      {rating.toFixed(1)}
      {showCount && <span className="ml-1 opacity-75">({count})</span>}
    </Badge>
  );
};

export default DealerRatingBadge;
