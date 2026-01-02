import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DealerInfo {
  id: string;
  dealership_name: string;
  subscription_plan: string;
  city: string;
  is_active: boolean;
}

export const useDealerRole = () => {
  const { user } = useAuth();
  const [isDealer, setIsDealer] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<DealerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDealerRole = async () => {
      if (!user) {
        setIsDealer(false);
        setDealerInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("id, dealership_name, subscription_plan, city, is_active")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data && data.is_active) {
          setIsDealer(true);
          setDealerInfo(data);
        } else {
          setIsDealer(false);
          setDealerInfo(null);
        }
      } catch (error) {
        console.error("Error checking dealer role:", error);
        setIsDealer(false);
        setDealerInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkDealerRole();
  }, [user]);

  return { isDealer, dealerInfo, isLoading };
};
