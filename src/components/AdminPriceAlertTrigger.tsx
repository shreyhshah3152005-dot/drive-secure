import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Mail, Send, AlertTriangle, CheckCircle } from "lucide-react";

interface TriggeredAlert {
  id: string;
  target_price: number;
  triggered_at: string;
  car: {
    name: string;
    brand: string;
    price: number;
  } | null;
  user_email: string | null;
}

const AdminPriceAlertTrigger = () => {
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; errors?: string[] } | null>(null);

  const fetchTriggeredAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .select(`
          id,
          target_price,
          triggered_at,
          user_id,
          dealer_cars:car_id (
            name,
            brand,
            price
          )
        `)
        .eq("is_triggered", true)
        .order("triggered_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails for each alert
      const alertsWithEmails = await Promise.all(
        (data || []).map(async (alert) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("user_id", alert.user_id)
            .maybeSingle();

          return {
            id: alert.id,
            target_price: alert.target_price,
            triggered_at: alert.triggered_at || "",
            car: alert.dealer_cars as any,
            user_email: profile?.email || null,
          };
        })
      );

      setTriggeredAlerts(alertsWithEmails);
    } catch (error) {
      console.error("Error fetching triggered alerts:", error);
      toast.error("Failed to fetch triggered alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const sendPriceAlertEmails = async () => {
    setIsSending(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-price-alert-notification",
        {
          body: { runAll: true },
        }
      );

      if (error) throw error;

      setLastResult({
        count: data.count || 0,
        errors: data.errors,
      });

      if (data.count > 0) {
        toast.success(`Successfully sent ${data.count} price alert email(s)`);
      } else {
        toast.info("No triggered alerts found to send");
      }

      // Refresh the list
      fetchTriggeredAlerts();
    } catch (error: any) {
      console.error("Error sending price alert emails:", error);
      toast.error("Failed to send price alert emails");
    } finally {
      setIsSending(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Price Alert Email Notifications
        </CardTitle>
        <CardDescription>
          Manually trigger email notifications for price drop alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={fetchTriggeredAlerts}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            Load Triggered Alerts
          </Button>
          
          <Button
            onClick={sendPriceAlertEmails}
            disabled={isSending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send All Price Alert Emails
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className={`p-4 rounded-lg ${lastResult.count > 0 ? "bg-green-500/10 border border-green-500/30" : "bg-muted"}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${lastResult.count > 0 ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="font-medium">
                {lastResult.count > 0 
                  ? `Successfully sent ${lastResult.count} email(s)`
                  : "No emails were sent"
                }
              </span>
            </div>
            {lastResult.errors && lastResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-500">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {lastResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Triggered Alerts List */}
        {triggeredAlerts.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Triggered Alerts ({triggeredAlerts.length})
            </h4>
            <div className="divide-y divide-border/50">
              {triggeredAlerts.map((alert) => (
                <div key={alert.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {alert.car ? `${alert.car.brand} ${alert.car.name}` : "Unknown Car"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alert.user_email || "No email found"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      Target: {formatPrice(alert.target_price)}
                    </Badge>
                    {alert.car && (
                      <Badge variant="outline">
                        Now: {formatPrice(alert.car.price)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isLoading ? null : (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Load Triggered Alerts" to see pending notifications</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="font-semibold text-sm text-blue-600 mb-2">ℹ️ How it works</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Price alerts are triggered automatically when a car's price drops below a user's target</li>
            <li>• Use this panel to manually send email notifications to users with triggered alerts</li>
            <li>• For automated emails, set up a scheduled cron job (see documentation)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPriceAlertTrigger;
