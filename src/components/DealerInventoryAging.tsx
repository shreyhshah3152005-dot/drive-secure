import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Flame } from "lucide-react";

interface AgingCar {
  id: string;
  name: string;
  brand: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface Props {
  cars: AgingCar[];
}

const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const severity = (d: number) => {
  if (d >= 90) return { label: "Critical (90+ days)", color: "destructive" as const, icon: Flame };
  if (d >= 60) return { label: "Stale (60+ days)", color: "default" as const, icon: AlertTriangle };
  if (d >= 30) return { label: "Aging (30+ days)", color: "secondary" as const, icon: Clock };
  return null;
};

export default function DealerInventoryAging({ cars }: Props) {
  const flagged = useMemo(() => {
    return cars
      .filter((c) => c.is_active)
      .map((c) => ({ ...c, days: daysSince(c.created_at) }))
      .filter((c) => c.days >= 30)
      .sort((a, b) => b.days - a.days);
  }, [cars]);

  const counts = useMemo(() => ({
    aging: flagged.filter((c) => c.days >= 30 && c.days < 60).length,
    stale: flagged.filter((c) => c.days >= 60 && c.days < 90).length,
    critical: flagged.filter((c) => c.days >= 90).length,
  }), [flagged]);

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" />Inventory Aging Alerts</CardTitle>
        <CardDescription>Cars sitting unsold for too long — consider price drops or promotions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg p-3 bg-secondary/30 border">
            <p className="text-xs text-muted-foreground">Aging (30+ d)</p>
            <p className="text-2xl font-bold">{counts.aging}</p>
          </div>
          <div className="rounded-lg p-3 bg-secondary/30 border">
            <p className="text-xs text-muted-foreground">Stale (60+ d)</p>
            <p className="text-2xl font-bold text-amber-500">{counts.stale}</p>
          </div>
          <div className="rounded-lg p-3 bg-secondary/30 border">
            <p className="text-xs text-muted-foreground">Critical (90+ d)</p>
            <p className="text-2xl font-bold text-destructive">{counts.critical}</p>
          </div>
        </div>
        {flagged.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No aging inventory — great job!</p>
        ) : (
          <div className="space-y-2">
            {flagged.map((c) => {
              const s = severity(c.days)!;
              const Icon = s.icon;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div>
                    <p className="font-medium">{c.brand} {c.name}</p>
                    <p className="text-xs text-muted-foreground">Listed {c.days} days ago • ₹{(c.price / 100000).toFixed(2)} L</p>
                  </div>
                  <Badge variant={s.color}><Icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
