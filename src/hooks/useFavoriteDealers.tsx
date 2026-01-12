import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FavoriteDealer {
  id: string;
  dealer_id: string;
  created_at: string;
}

export const useFavoriteDealers = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorite_dealers")
        .select("dealer_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setFavorites(data?.map((f) => f.dealer_id) || []);
    } catch (error) {
      console.error("Error fetching favorite dealers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (dealerId: string) => {
    if (!user) {
      toast.error("Please sign in to save favorite dealers");
      return false;
    }

    try {
      const { error } = await supabase.from("favorite_dealers").insert({
        user_id: user.id,
        dealer_id: dealerId,
      });

      if (error) throw error;

      setFavorites((prev) => [...prev, dealerId]);
      toast.success("Dealer added to favorites! You'll be notified when they add new cars.");
      return true;
    } catch (error: unknown) {
      const errorObj = error as { code?: string };
      if (errorObj.code === "23505") {
        toast.info("Already in your favorites");
      } else {
        console.error("Error adding favorite dealer:", error);
        toast.error("Failed to add to favorites");
      }
      return false;
    }
  };

  const removeFavorite = async (dealerId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("favorite_dealers")
        .delete()
        .eq("user_id", user.id)
        .eq("dealer_id", dealerId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((id) => id !== dealerId));
      toast.success("Dealer removed from favorites");
      return true;
    } catch (error) {
      console.error("Error removing favorite dealer:", error);
      toast.error("Failed to remove from favorites");
      return false;
    }
  };

  const toggleFavorite = async (dealerId: string) => {
    if (favorites.includes(dealerId)) {
      return removeFavorite(dealerId);
    } else {
      return addFavorite(dealerId);
    }
  };

  const isFavorite = (dealerId: string) => favorites.includes(dealerId);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
