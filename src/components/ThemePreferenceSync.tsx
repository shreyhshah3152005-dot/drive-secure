import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { useAuth } from "@/contexts/AuthContext";

const isSupportedTheme = (value: unknown): value is "light" | "dark" =>
  value === "light" || value === "dark";

const ThemePreferenceSync = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const lastAppliedTheme = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    const preferredTheme = user.user_metadata?.theme_preference;
    if (!isSupportedTheme(preferredTheme)) return;

    if (theme !== preferredTheme && lastAppliedTheme.current !== preferredTheme) {
      setTheme(preferredTheme);
    }

    lastAppliedTheme.current = preferredTheme;
  }, [loading, setTheme, theme, user]);

  return null;
};

export default ThemePreferenceSync;