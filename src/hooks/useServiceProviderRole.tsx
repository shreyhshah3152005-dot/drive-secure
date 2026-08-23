import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useServiceProviderRole = () => {
  const { user } = useAuth();
  const [isServiceProvider, setIsServiceProvider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [providerInfo, setProviderInfo] = useState<{
    id: string;
    business_name: string;
    city: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
  } | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsServiceProvider(false);
        setProviderInfo(null);
        setCheckedUserId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("service_providers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setIsServiceProvider(!!data?.is_active);
        setProviderInfo(data);
      } catch (error) {
        console.error("Error checking service provider role:", error);
        setIsServiceProvider(false);
      } finally {
        setCheckedUserId(user.id);
        setIsLoading(false);
      }
    };

    check();
  }, [user]);

  return {
    isServiceProvider,
    isLoading: isLoading || (!!user && checkedUserId !== user.id),
    providerInfo,
  };
};
