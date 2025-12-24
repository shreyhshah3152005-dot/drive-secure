import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ComparisonHistoryItem {
  id: string;
  car_ids: string[];
  car_names: string[];
  created_at: string;
}

export const useComparisonHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ComparisonHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comparison_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching comparison history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const addToHistory = async (carIds: string[], carNames: string[]) => {
    if (!user || carIds.length < 2) return;

    try {
      const { error } = await supabase.from("comparison_history").insert({
        user_id: user.id,
        car_ids: carIds,
        car_names: carNames,
      });

      if (error) throw error;
      fetchHistory();
    } catch (error) {
      console.error("Error adding to comparison history:", error);
    }
  };

  const deleteFromHistory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("comparison_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchHistory();
    } catch (error) {
      console.error("Error deleting from comparison history:", error);
    }
  };

  return {
    history,
    isLoading,
    addToHistory,
    deleteFromHistory,
    refetch: fetchHistory,
  };
};
