import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "@/components/ui/switch";

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2 py-1 backdrop-blur-sm">
      <Sun className={`h-4 w-4 ${isDark ? "text-muted-foreground" : "text-foreground"}`} />
      <Switch
        checked={isDark}
        aria-label="Toggle dark mode"
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className={`h-4 w-4 ${isDark ? "text-foreground" : "text-muted-foreground"}`} />
    </div>
  );
};

export default ThemeToggle;