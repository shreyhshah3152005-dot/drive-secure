import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HandCoins, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  carId: string;
  dealerId: string;
  currentPrice: number;
  carName: string;
}

const formatPrice = (price: number) =>
  price >= 100 ? `₹${(price / 100).toFixed(2)} Cr` : `₹${price.toFixed(2)} Lakh`;

const PriceNegotiationForm = ({ carId, dealerId, currentPrice, carName }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [offerPrice, setOfferPrice] = useState("");
  const [message, setMessage] = useState("");

  const { data: negotiations = [], isLoading } = useQuery({
    queryKey: ["negotiations", carId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("price_negotiations")
        .select("*")
        .eq("car_id", carId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const submitOffer = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const price = parseFloat(offerPrice);
      if (!price || price <= 0) throw new Error("Invalid price");

      const { error } = await supabase.from("price_negotiations").insert({
        car_id: carId,
        dealer_id: dealerId,
        user_id: user.id,
        offer_price: price,
        message: message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offer submitted! The dealer will review it.");
      setOfferPrice("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["negotiations", carId, user?.id] });
    },
    onError: () => toast.error("Failed to submit offer"),
  });

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="w-5 h-5 text-primary" />
            Make an Offer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please sign in to negotiate price.</p>
        </CardContent>
      </Card>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "rejected": return <XCircle className="w-3 h-3 text-red-500" />;
      case "countered": return <HandCoins className="w-3 h-3 text-amber-500" />;
      default: return <Clock className="w-3 h-3 text-yellow-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/10 text-green-600 border-green-500/30";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "countered": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      default: return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    }
  };

  const hasPending = negotiations.some(n => n.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HandCoins className="w-5 h-5 text-primary" />
          Negotiate Price
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Listed at <span className="text-primary font-semibold">{formatPrice(currentPrice)}</span>
        </p>

        {!hasPending && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Your Offer (in Lakhs) *</Label>
              <Input
                type="number"
                step="0.01"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="e.g. 8.50"
              />
            </div>
            <div className="space-y-1">
              <Label>Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why should the dealer consider your offer?"
                rows={2}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => submitOffer.mutate()}
              disabled={submitOffer.isPending || !offerPrice}
            >
              <Send className="w-4 h-4" />
              {submitOffer.isPending ? "Submitting..." : "Submit Offer"}
            </Button>
          </div>
        )}

        {hasPending && (
          <p className="text-sm text-muted-foreground text-center py-2">
            You have a pending offer. Wait for the dealer's response.
          </p>
        )}

        {negotiations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium text-foreground">Your Offers</p>
            {negotiations.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-secondary/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{formatPrice(n.offer_price)}</span>
                  <Badge className={statusColor(n.status)}>
                    {statusIcon(n.status)}
                    <span className="ml-1 capitalize">{n.status}</span>
                  </Badge>
                </div>
                {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                {n.dealer_response && (
                  <p className="text-xs text-primary">Dealer: {n.dealer_response}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceNegotiationForm;
