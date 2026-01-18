import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PriceAlertButtonProps {
  carId: string;
  carName: string;
  currentPrice: number;
  className?: string;
}

interface PriceAlert {
  id: string;
  target_price: number;
  is_triggered: boolean;
}

const formatPrice = (price: number) => {
  if (price >= 100) {
    return `₹${(price / 100).toFixed(2)} Cr`;
  }
  return `₹${price.toFixed(2)} Lakh`;
};

const PriceAlertButton = ({
  carId,
  carName,
  currentPrice,
  className = "",
}: PriceAlertButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [existingAlert, setExistingAlert] = useState<PriceAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExistingAlert = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("price_alerts")
          .select("id, target_price, is_triggered")
          .eq("user_id", user.id)
          .eq("car_id", carId)
          .maybeSingle();

        if (error) throw error;
        setExistingAlert(data);
        if (data) {
          setTargetPrice(data.target_price.toString());
        }
      } catch (error) {
        console.error("Error checking price alert:", error);
      } finally {
        setChecking(false);
      }
    };

    checkExistingAlert();
  }, [user, carId]);

  const handleSetAlert = async () => {
    if (!user) {
      toast.error("Please log in to set price alerts");
      return;
    }

    const priceValue = parseFloat(targetPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (priceValue >= currentPrice) {
      toast.error("Alert price should be lower than current price");
      return;
    }

    setLoading(true);
    try {
      if (existingAlert) {
        // Update existing alert
        const { error } = await supabase
          .from("price_alerts")
          .update({ target_price: priceValue, is_triggered: false, triggered_at: null })
          .eq("id", existingAlert.id);

        if (error) throw error;
        setExistingAlert({ ...existingAlert, target_price: priceValue, is_triggered: false });
        toast.success("Price alert updated!");
      } else {
        // Create new alert
        const { data, error } = await supabase
          .from("price_alerts")
          .insert({
            user_id: user.id,
            car_id: carId,
            target_price: priceValue,
          })
          .select("id, target_price, is_triggered")
          .single();

        if (error) throw error;
        setExistingAlert(data);
        toast.success("Price alert set! You'll be notified when the price drops.");
      }
      setOpen(false);
    } catch (error) {
      console.error("Error setting price alert:", error);
      toast.error("Failed to set price alert");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAlert = async () => {
    if (!existingAlert) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", existingAlert.id);

      if (error) throw error;
      setExistingAlert(null);
      setTargetPrice("");
      toast.success("Price alert removed");
      setOpen(false);
    } catch (error) {
      console.error("Error removing price alert:", error);
      toast.error("Failed to remove price alert");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Bell className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={existingAlert ? "default" : "outline"}
          size="sm"
          className={className}
        >
          {existingAlert ? (
            <>
              <Bell className="w-4 h-4 mr-2 fill-current" />
              Alert Set: {formatPrice(existingAlert.target_price)}
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              Set Price Alert
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Price Drop Alert</DialogTitle>
          <DialogDescription>
            Get notified when {carName} drops below your target price.
            <br />
            <span className="text-foreground font-medium">
              Current price: {formatPrice(currentPrice)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Alert me when price drops below (in Lakhs)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              min="0"
              max={currentPrice - 0.01}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder={`Less than ${currentPrice}`}
            />
            {targetPrice && parseFloat(targetPrice) > 0 && (
              <p className="text-sm text-muted-foreground">
                You'll be notified when price drops to or below {formatPrice(parseFloat(targetPrice))}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingAlert && (
            <Button
              variant="destructive"
              onClick={handleRemoveAlert}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Alert
            </Button>
          )}
          <Button onClick={handleSetAlert} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : existingAlert ? "Update Alert" : "Set Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertButton;