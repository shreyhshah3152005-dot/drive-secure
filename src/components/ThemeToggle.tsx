import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const handleThemeChange = async (checked: boolean) => {
    const nextTheme = checked ? "dark" : "light";
    setTheme(nextTheme);

    if (!user || user.user_metadata?.theme_preference === nextTheme) {
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        theme_preference: nextTheme,
      },
    });

    if (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2 py-1 backdrop-blur-sm">
      <Sun className={`h-4 w-4 ${isDark ? "text-muted-foreground" : "text-foreground"}`} />
      <Switch
        checked={isDark}
        aria-label="Toggle dark mode"
        onCheckedChange={handleThemeChange}
      />
      <Moon className={`h-4 w-4 ${isDark ? "text-foreground" : "text-muted-foreground"}`} />
    </div>
  );
};

export default ThemeToggle;