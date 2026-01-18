import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingDown, X, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TriggeredAlert {
  id: string;
  target_price: number;
  triggered_at: string;
  car: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image_url: string | null;
  };
}

const formatPrice = (price: number) => {
  if (price >= 100) {
    return `₹${(price / 100).toFixed(2)} Cr`;
  }
  return `₹${price.toFixed(2)} L`;
};

const PriceAlertNotifications = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchAlerts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .select(`
          id,
          target_price,
          triggered_at,
          car:dealer_cars(id, name, brand, price, image_url)
        `)
        .eq("user_id", user.id)
        .eq("is_triggered", true)
        .order("triggered_at", { ascending: false });

      if (error) throw error;

      // Transform the data
      const transformedAlerts = (data || [])
        .filter((alert: any) => alert.car)
        .map((alert: any) => ({
          id: alert.id,
          target_price: alert.target_price,
          triggered_at: alert.triggered_at,
          car: alert.car,
        }));

      setAlerts(transformedAlerts);
    } catch (error) {
      console.error("Error fetching price alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to changes
    if (user) {
      const channel = supabase
        .channel("price-alerts-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "price_alerts",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new && (payload.new as any).is_triggered) {
              fetchAlerts();
              toast.success("🎉 Price dropped on one of your watched cars!");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleDismiss = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  if (!user || loading) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <TrendingDown className="h-5 w-5" />
          {alerts.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Price Drop Alerts
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Cars that dropped to or below your target price
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No price drops yet</p>
              <p className="text-xs mt-1">
                Set alerts on cars you're interested in
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                    {alert.car.image_url ? (
                      <img
                        src={alert.car.image_url}
                        alt={alert.car.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/dealer-car/${alert.car.id}`}
                      onClick={() => setOpen(false)}
                      className="hover:underline"
                    >
                      <p className="font-medium text-sm truncate">
                        {alert.car.brand} {alert.car.name}
                      </p>
                    </Link>
                    <p className="text-sm text-green-500 font-semibold">
                      Now {formatPrice(alert.car.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your target: {formatPrice(alert.target_price)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PriceAlertNotifications;