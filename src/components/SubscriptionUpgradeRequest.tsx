import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowUp, Check, Clock, X, Star, Zap, Crown } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  listings: number;
  icon: React.ReactNode;
}

const plans: SubscriptionPlan[] = [
  { id: "basic", name: "Basic", price: "₹999/month", listings: 5, icon: <Star className="w-5 h-5" /> },
  { id: "standard", name: "Standard", price: "₹1,999/month", listings: 15, icon: <Zap className="w-5 h-5" /> },
  { id: "premium", name: "Premium", price: "₹3,999/month", listings: 999999, icon: <Crown className="w-5 h-5" /> },
];

interface UpgradeRequest {
  id: string;
  current_plan: string;
  requested_plan: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface SubscriptionUpgradeRequestProps {
  currentPlan: string;
  dealerId: string;
}

const SubscriptionUpgradeRequest = ({ currentPlan, dealerId }: SubscriptionUpgradeRequestProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<UpgradeRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<UpgradeRequest[]>([]);

  useEffect(() => {
    fetchUpgradeRequests();
  }, [dealerId]);

  const fetchUpgradeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_upgrade_requests")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const pending = data?.find(r => r.status === "pending");
      setPendingRequest(pending || null);
      setRequestHistory(data?.filter(r => r.status !== "pending") || []);
    } catch (error) {
      console.error("Error fetching upgrade requests:", error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan to upgrade to");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("subscription_upgrade_requests")
        .insert({
          dealer_id: dealerId,
          current_plan: currentPlan,
          requested_plan: selectedPlan,
        });

      if (error) throw error;

      toast.success("Upgrade request submitted! Admin will review it shortly.");
      setSelectedPlan("");
      fetchUpgradeRequests();
    } catch (error: any) {
      console.error("Error submitting upgrade request:", error);
      toast.error("Failed to submit upgrade request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availablePlans = plans.filter(plan => {
    const planOrder = ["basic", "standard", "premium"];
    return planOrder.indexOf(plan.id) > planOrder.indexOf(currentPlan);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  if (currentPlan === "premium") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Premium Plan
          </CardTitle>
          <CardDescription>You're on our highest tier with unlimited listings!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Request */}
      {pendingRequest && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Upgrade Request
            </CardTitle>
            <CardDescription>
              Your request to upgrade from <strong>{pendingRequest.current_plan}</strong> to{" "}
              <strong>{pendingRequest.requested_plan}</strong> is being reviewed by admin.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Request New Upgrade */}
      {!pendingRequest && availablePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-primary" />
              Request Plan Upgrade
            </CardTitle>
            <CardDescription>
              Select a higher tier plan and submit a request. Admin will review and approve your upgrade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlan === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <RadioGroupItem value={plan.id} id={plan.id} />
                  <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan.icon}
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <span className="text-primary font-semibold">{plan.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.listings === 999999 ? "Unlimited" : plan.listings} car listings
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button 
              onClick={handleSubmitRequest} 
              disabled={!selectedPlan || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Upgrade Request"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request History */}
      {requestHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requestHistory.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm">
                      <span className="capitalize">{request.current_plan}</span> → <span className="capitalize">{request.requested_plan}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {request.admin_notes}</p>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionUpgradeRequest;
