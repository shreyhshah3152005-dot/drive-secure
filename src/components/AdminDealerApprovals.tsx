import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Store, MapPin, Phone, Mail, Clock } from "lucide-react";
import { format } from "date-fns";

interface PendingDealer {
  id: string;
  user_id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  is_active: boolean;
}

const AdminDealerApprovals = () => {
  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingDealers = async () => {
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingDealers(data || []);
    } catch (error) {
      console.error("Error fetching pending dealers:", error);
      toast.error("Failed to fetch pending dealers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDealers();
  }, []);

  const handleApprove = async (dealer: PendingDealer) => {
    setProcessingId(dealer.id);
    try {
      const { error } = await supabase
        .from("dealers")
        .update({ is_active: true })
        .eq("id", dealer.id);

      if (error) throw error;

      toast.success(`${dealer.dealership_name} has been approved!`);
      fetchPendingDealers();
    } catch (error) {
      console.error("Error approving dealer:", error);
      toast.error("Failed to approve dealer");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (dealer: PendingDealer) => {
    setProcessingId(dealer.id);
    try {
      // Delete the dealer record
      const { error: dealerError } = await supabase
        .from("dealers")
        .delete()
        .eq("id", dealer.id);

      if (dealerError) throw dealerError;

      // Delete the dealer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", dealer.user_id)
        .eq("role", "dealer");

      if (roleError) {
        console.error("Error removing dealer role:", roleError);
      }

      toast.success(`${dealer.dealership_name} has been declined`);
      fetchPendingDealers();
    } catch (error) {
      console.error("Error declining dealer:", error);
      toast.error("Failed to decline dealer");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Dealer Approval Requests
        </CardTitle>
        <CardDescription>
          Review and approve new dealer registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingDealers.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">No pending dealer requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDealers.map((dealer) => (
              <div
                key={dealer.id}
                className="p-5 rounded-xl bg-secondary/30 border border-border/50"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-foreground text-lg">
                        {dealer.dealership_name}
                      </h3>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                        Pending Approval
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{dealer.city}</span>
                      </div>
                      {dealer.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{dealer.phone}</span>
                        </div>
                      )}
                      {dealer.address && (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <Store className="w-4 h-4" />
                          <span>{dealer.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Registered: {format(new Date(dealer.created_at), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecline(dealer)}
                      disabled={processingId === dealer.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(dealer)}
                      disabled={processingId === dealer.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === dealer.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDealerApprovals;
