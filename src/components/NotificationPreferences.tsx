import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Mail, Phone, MessageCircle, Save, BellRing, Car, TrendingDown, Calendar } from "lucide-react";

interface NotificationPrefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  phone_number: string;
  price_drop_alerts: boolean;
  new_car_alerts: boolean;
  test_drive_reminders: boolean;
}

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    phone_number: "",
    price_drop_alerts: true,
    new_car_alerts: true,
    test_drive_reminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPrefs({
            email_enabled: data.email_enabled,
            sms_enabled: data.sms_enabled,
            whatsapp_enabled: data.whatsapp_enabled,
            phone_number: data.phone_number || "",
            price_drop_alerts: data.price_drop_alerts,
            new_car_alerts: data.new_car_alerts,
            test_drive_reminders: data.test_drive_reminders,
          });
          setHasExisting(true);
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrefs();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if ((prefs.sms_enabled || prefs.whatsapp_enabled) && !prefs.phone_number.trim()) {
      toast.error("Please enter a phone number for SMS/WhatsApp notifications");
      return;
    }

    setIsSaving(true);
    try {
      if (hasExisting) {
        const { error } = await supabase
          .from("notification_preferences")
          .update({
            email_enabled: prefs.email_enabled,
            sms_enabled: prefs.sms_enabled,
            whatsapp_enabled: prefs.whatsapp_enabled,
            phone_number: prefs.phone_number || null,
            price_drop_alerts: prefs.price_drop_alerts,
            new_car_alerts: prefs.new_car_alerts,
            test_drive_reminders: prefs.test_drive_reminders,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            ...prefs,
            phone_number: prefs.phone_number || null,
          });

        if (error) throw error;
        setHasExisting(true);
      }

      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || isLoading) return null;

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Notification Channels</h4>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <Label className="font-medium">Email</Label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={prefs.email_enabled}
              onCheckedChange={(checked) => setPrefs({ ...prefs, email_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-500" />
              <div>
                <Label className="font-medium">SMS</Label>
                <p className="text-xs text-muted-foreground">Receive text message alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
              <Switch
                checked={prefs.sms_enabled}
                onCheckedChange={(checked) => setPrefs({ ...prefs, sms_enabled: checked })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-green-500" />
              <div>
                <Label className="font-medium">WhatsApp</Label>
                <p className="text-xs text-muted-foreground">Receive alerts on WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
              <Switch
                checked={prefs.whatsapp_enabled}
                onCheckedChange={(checked) => setPrefs({ ...prefs, whatsapp_enabled: checked })}
              />
            </div>
          </div>

          {(prefs.sms_enabled || prefs.whatsapp_enabled) && (
            <div className="space-y-2 pl-2">
              <Label htmlFor="phone">Phone Number (with country code)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={prefs.phone_number}
                onChange={(e) => setPrefs({ ...prefs, phone_number: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
          )}
        </div>

        {/* Alert Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Alert Types</h4>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-green-500" />
              <div>
                <Label className="font-medium">Price Drop Alerts</Label>
                <p className="text-xs text-muted-foreground">When a car's price drops below your target</p>
              </div>
            </div>
            <Switch
              checked={prefs.price_drop_alerts}
              onCheckedChange={(checked) => setPrefs({ ...prefs, price_drop_alerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <Label className="font-medium">New Car Alerts</Label>
                <p className="text-xs text-muted-foreground">When new cars match your saved searches</p>
              </div>
            </div>
            <Switch
              checked={prefs.new_car_alerts}
              onCheckedChange={(checked) => setPrefs({ ...prefs, new_car_alerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <Label className="font-medium">Test Drive Reminders</Label>
                <p className="text-xs text-muted-foreground">24-hour reminder before your test drive</p>
              </div>
            </div>
            <Switch
              checked={prefs.test_drive_reminders}
              onCheckedChange={(checked) => setPrefs({ ...prefs, test_drive_reminders: checked })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
