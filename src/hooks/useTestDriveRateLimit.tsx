import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MAX_REQUESTS_PER_DAY = 3;

export const useTestDriveRateLimit = () => {
  const { user } = useAuth();
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);

  const checkRateLimit = useCallback(async (): Promise<{ allowed: boolean; remaining: number; message?: string }> => {
    if (!user) {
      return { allowed: false, remaining: 0, message: "Please sign in to book a test drive" };
    }

    setIsCheckingLimit(true);

    try {
      // Get the start of today (UTC)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Count user's requests today
      const { count, error } = await supabase
        .from("test_drive_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayISO);

      if (error) {
        console.error("Error checking rate limit:", error);
        // Allow on error to not block legitimate users
        return { allowed: true, remaining: MAX_REQUESTS_PER_DAY };
      }

      const requestsToday = count || 0;
      const remaining = MAX_REQUESTS_PER_DAY - requestsToday;

      if (requestsToday >= MAX_REQUESTS_PER_DAY) {
        return {
          allowed: false,
          remaining: 0,
          message: `You've reached the daily limit of ${MAX_REQUESTS_PER_DAY} test drive requests. Please try again tomorrow.`
        };
      }

      return { allowed: true, remaining };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // Allow on error to not block legitimate users
      return { allowed: true, remaining: MAX_REQUESTS_PER_DAY };
    } finally {
      setIsCheckingLimit(false);
    }
  }, [user]);

  return { checkRateLimit, isCheckingLimit };
};
