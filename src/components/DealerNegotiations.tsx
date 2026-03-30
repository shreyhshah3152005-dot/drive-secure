import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HandCoins, Check, X, MessageSquare } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  dealerId: string;
}

const formatPrice = (price: number) =>
  price >= 100 ? `₹${(price / 100).toFixed(2)} Cr` : `₹${price.toFixed(2)} Lakh`;

const DealerNegotiations = ({ dealerId }: Props) => {
  const queryClient = useQueryClient();
  const [respondDialog, setRespondDialog] = useState(false);
  const [selectedNeg, setSelectedNeg] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: negotiations = [], isLoading } = useQuery({
    queryKey: ["dealer-negotiations", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_negotiations")
        .select("*, dealer_cars(name, brand, price)")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!dealerId,
  });

  const handleRespond = async (status: "accepted" | "rejected" | "countered") => {
    if (!selectedNeg) return;
    setIsSubmitting(true);
    try {
      const updateData: any = {
        status,
        dealer_response: response || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("price_negotiations")
        .update(updateData)
        .eq("id", selectedNeg.id);

      if (error) throw error;
      toast.success(`Offer ${status}!`);
      setRespondDialog(false);
      setSelectedNeg(null);
      setResponse("");
      setCounterPrice("");
      queryClient.invalidateQueries({ queryKey: ["dealer-negotiations", dealerId] });
    } catch {
      toast.error("Failed to respond");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = negotiations.filter(n => n.status === "pending").length;

  const statusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/10 text-green-600";
      case "rejected": return "bg-red-500/10 text-red-600";
      case "countered": return "bg-amber-500/10 text-amber-600";
      default: return "bg-yellow-500/10 text-yellow-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary" />
          Price Negotiations
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">{pendingCount} new</Badge>
          )}
        </CardTitle>
        <CardDescription>Review and respond to customer price offers</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : negotiations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No negotiations yet.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {negotiations.map((neg) => (
              <div key={neg.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {neg.dealer_cars?.brand} {neg.dealer_cars?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Listed: {formatPrice(neg.dealer_cars?.price || 0)} → Offer: <span className="text-primary font-semibold">{formatPrice(neg.offer_price)}</span>
                    </p>
                  </div>
                  <Badge className={statusColor(neg.status)}>
                    <span className="capitalize">{neg.status}</span>
                  </Badge>
                </div>
                {neg.message && <p className="text-xs text-muted-foreground mb-2">{neg.message}</p>}
                {neg.dealer_response && <p className="text-xs text-primary">Your response: {neg.dealer_response}</p>}
                {neg.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="default" className="gap-1" onClick={() => { setSelectedNeg(neg); setRespondDialog(true); }}>
                      <MessageSquare className="w-3 h-3" /> Respond
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-green-600" onClick={() => { setSelectedNeg(neg); handleRespond("accepted"); }}>
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => { setSelectedNeg(neg); handleRespond("rejected"); }}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={respondDialog} onOpenChange={setRespondDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedNeg && (
                <p className="text-sm text-muted-foreground">
                  Offer: <span className="text-primary font-semibold">{formatPrice(selectedNeg.offer_price)}</span>
                </p>
              )}
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your response to the buyer..."
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-1 text-green-600" onClick={() => handleRespond("accepted")} disabled={isSubmitting}>
                <Check className="w-4 h-4" /> Accept
              </Button>
              <Button variant="default" className="gap-1" onClick={() => handleRespond("countered")} disabled={isSubmitting}>
                <HandCoins className="w-4 h-4" /> Counter
              </Button>
              <Button variant="outline" className="gap-1 text-red-600" onClick={() => handleRespond("rejected")} disabled={isSubmitting}>
                <X className="w-4 h-4" /> Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DealerNegotiations;
