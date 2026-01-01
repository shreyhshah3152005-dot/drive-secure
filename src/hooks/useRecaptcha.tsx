import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Replace with your actual reCAPTCHA site key
const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key - replace with your actual key

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptcha = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if script already exists
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      if (window.grecaptcha) {
        setIsLoaded(true);
      }
      return;
    }

    // Load reCAPTCHA v3 script
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.grecaptcha.ready(() => {
        setIsLoaded(true);
      });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup is optional for reCAPTCHA
    };
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!isLoaded || !window.grecaptcha) {
      console.error("reCAPTCHA not loaded");
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error("reCAPTCHA execution error:", error);
      return null;
    }
  }, [isLoaded]);

  const verifyRecaptcha = useCallback(async (action: string): Promise<{ success: boolean; error?: string }> => {
    setIsVerifying(true);

    try {
      const token = await executeRecaptcha(action);
      
      if (!token) {
        return { success: false, error: "Failed to get reCAPTCHA token" };
      }

      // Verify token with backend
      const { data, error } = await supabase.functions.invoke("verify-recaptcha", {
        body: { token }
      });

      if (error) {
        console.error("reCAPTCHA verification error:", error);
        return { success: false, error: "Verification failed" };
      }

      if (data?.success) {
        return { success: true };
      } else {
        return { success: false, error: data?.error || "Verification failed" };
      }
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return { success: false, error: "Verification failed" };
    } finally {
      setIsVerifying(false);
    }
  }, [executeRecaptcha]);

  return { isLoaded, isVerifying, verifyRecaptcha };
};
