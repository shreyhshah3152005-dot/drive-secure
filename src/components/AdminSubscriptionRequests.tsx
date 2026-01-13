import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Check, X, Clock, ArrowUp, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface UpgradeRequest {
  id: string;
  dealer_id: string;
  current_plan: string;
  requested_plan: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  dealers?: {
    dealership_name: string;
    city: string;
    user_id: string;
  };
}

const AdminSubscriptionRequests = () => {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_upgrade_requests")
        .select(`
          *,
          dealers (
            dealership_name,
            city,
            user_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching upgrade requests:", error);
      toast.error("Failed to fetch upgrade requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: UpgradeRequest) => {
    setProcessingId(request.id);
    try {
      // Update the dealer's subscription plan
      const { error: dealerError } = await supabase
        .from("dealers")
        .update({ subscription_plan: request.requested_plan })
        .eq("id", request.dealer_id);

      if (dealerError) throw dealerError;

      // Update the request status
      const { error: requestError } = await supabase
        .from("subscription_upgrade_requests")
        .update({ 
          status: "approved",
          admin_notes: adminNotes || null
        })
        .eq("id", request.id);

      if (requestError) throw requestError;

      // Send notification email
      if (request.dealers?.user_id) {
        await supabase.functions.invoke("send-subscription-notification", {
          body: {
            dealerId: request.dealer_id,
            dealershipName: request.dealers.dealership_name,
            oldPlan: request.current_plan,
            newPlan: request.requested_plan,
          },
        });
      }

      toast.success(`Approved upgrade to ${request.requested_plan} for ${request.dealers?.dealership_name}`);
      setNotesDialogOpen(false);
      setAdminNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve upgrade request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: UpgradeRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from("subscription_upgrade_requests")
        .update({ 
          status: "rejected",
          admin_notes: adminNotes || "Request rejected by admin"
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success(`Rejected upgrade request from ${request.dealers?.dealership_name}`);
      setNotesDialogOpen(false);
      setAdminNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject upgrade request");
    } finally {
      setProcessingId(null);
    }
  };

  const openNotesDialog = (request: UpgradeRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    setNotesDialogOpen(true);
  };

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

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: "bg-gray-500",
      standard: "bg-blue-500",
      premium: "bg-purple-500",
    };
    return <Badge className={colors[plan] || "bg-gray-500"}>{plan}</Badge>;
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-primary" />
            Pending Upgrade Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Review and approve dealer subscription upgrade requests</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No pending upgrade requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealership</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Current Plan</TableHead>
                  <TableHead>Requested Plan</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.dealers?.dealership_name}</TableCell>
                    <TableCell>{request.dealers?.city}</TableCell>
                    <TableCell>{getPlanBadge(request.current_plan)}</TableCell>
                    <TableCell>{getPlanBadge(request.requested_plan)}</TableCell>
                    <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNotesDialog(request)}
                          disabled={processingId === request.id}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Add Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                          disabled={processingId === request.id}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests History */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealership</TableHead>
                  <TableHead>Upgrade Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed On</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.slice(0, 10).map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.dealers?.dealership_name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{request.current_plan}</span> → <span className="capitalize">{request.requested_plan}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{request.admin_notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes for {selectedRequest?.dealers?.dealership_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add notes about this upgrade request..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedRequest && handleApprove(selectedRequest)}>
                Approve with Notes
              </Button>
              <Button variant="destructive" onClick={() => selectedRequest && handleReject(selectedRequest)}>
                Reject with Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionRequests;
