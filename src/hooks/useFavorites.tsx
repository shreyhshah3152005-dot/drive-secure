import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavorites = () => {
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
        .from("favorites")
        .select("car_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setFavorites(data?.map((f) => f.car_id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (carId: string) => {
    if (!user) {
      toast.error("Please sign in to add favorites");
      return false;
    }

    try {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        car_id: carId,
      });

      if (error) throw error;

      setFavorites((prev) => [...prev, carId]);
      toast.success("Added to wishlist!");
      return true;
    } catch (error: any) {
      if (error.code === "23505") {
        toast.info("Already in your wishlist");
      } else {
        console.error("Error adding favorite:", error);
        toast.error("Failed to add to wishlist");
      }
      return false;
    }
  };

  const removeFavorite = async (carId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("car_id", carId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((id) => id !== carId));
      toast.success("Removed from wishlist");
      return true;
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from wishlist");
      return false;
    }
  };

  const toggleFavorite = async (carId: string) => {
    if (favorites.includes(carId)) {
      return removeFavorite(carId);
    } else {
      return addFavorite(carId);
    }
  };

  const isFavorite = (carId: string) => favorites.includes(carId);

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