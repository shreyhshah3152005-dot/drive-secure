import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users, 
  Check, 
  X, 
  Mail, 
  BadgeCheck, 
  Store, 
  MapPin, 
  Clock, 
  Loader2,
  CheckCircle2,
  Star,
  Crown,
  AlertCircle
} from "lucide-react";
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
  verification_status: string;
}

const verificationLevels = [
  { value: "unverified", label: "Unverified", icon: AlertCircle, color: "text-muted-foreground" },
  { value: "verified", label: "Verified", icon: CheckCircle2, color: "text-blue-500" },
  { value: "trusted", label: "Trusted", icon: Star, color: "text-amber-500" },
  { value: "premium_partner", label: "Premium Partner", icon: Crown, color: "text-purple-500" },
];

const AdminBulkDealerActions = () => {
  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [activeDealers, setActiveDealers] = useState<PendingDealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [selectedActive, setSelectedActive] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bulk notification dialog
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationSubject, setNotificationSubject] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  
  // Bulk verification dialog
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [newVerificationStatus, setNewVerificationStatus] = useState("verified");

  const fetchDealers = async () => {
    try {
      // Fetch pending dealers
      const { data: pending, error: pendingError } = await supabase
        .from("dealers")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;
      setPendingDealers(pending || []);

      // Fetch active dealers
      const { data: active, error: activeError } = await supabase
        .from("dealers")
        .select("*")
        .eq("is_active", true)
        .order("dealership_name");

      if (activeError) throw activeError;
      setActiveDealers(active || []);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to fetch dealers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const togglePendingSelection = (id: string) => {
    const newSelected = new Set(selectedPending);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPending(newSelected);
  };

  const toggleActiveSelection = (id: string) => {
    const newSelected = new Set(selectedActive);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedActive(newSelected);
  };

  const selectAllPending = () => {
    if (selectedPending.size === pendingDealers.length) {
      setSelectedPending(new Set());
    } else {
      setSelectedPending(new Set(pendingDealers.map(d => d.id)));
    }
  };

  const selectAllActive = () => {
    if (selectedActive.size === activeDealers.length) {
      setSelectedActive(new Set());
    } else {
      setSelectedActive(new Set(activeDealers.map(d => d.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPending.size === 0) return;
    
    setIsProcessing(true);
    try {
      const selectedIds = Array.from(selectedPending);
      
      // Update all selected dealers to active
      const { error } = await supabase
        .from("dealers")
        .update({ is_active: true })
        .in("id", selectedIds);

      if (error) throw error;

      // Send approval notifications
      const selectedDealersData = pendingDealers.filter(d => selectedPending.has(d.id));
      for (const dealer of selectedDealersData) {
        try {
          await supabase.functions.invoke("send-dealer-approval-notification", {
            body: {
              dealerId: dealer.id,
              action: "approved",
              dealershipName: dealer.dealership_name,
            },
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${dealer.dealership_name}:`, emailError);
        }
      }

      toast.success(`Successfully approved ${selectedIds.length} dealer(s)`);
      setSelectedPending(new Set());
      fetchDealers();
    } catch (error) {
      console.error("Error in bulk approve:", error);
      toast.error("Failed to approve dealers");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDecline = async () => {
    if (selectedPending.size === 0) return;
    
    setIsProcessing(true);
    try {
      const selectedIds = Array.from(selectedPending);
      const selectedDealersData = pendingDealers.filter(d => selectedPending.has(d.id));

      // Send decline notifications first
      for (const dealer of selectedDealersData) {
        try {
          await supabase.functions.invoke("send-dealer-approval-notification", {
            body: {
              dealerId: dealer.id,
              action: "declined",
              dealershipName: dealer.dealership_name,
            },
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${dealer.dealership_name}:`, emailError);
        }
      }

      // Delete dealers
      const { error: dealerError } = await supabase
        .from("dealers")
        .delete()
        .in("id", selectedIds);

      if (dealerError) throw dealerError;

      // Delete roles
      const userIds = selectedDealersData.map(d => d.user_id);
      await supabase
        .from("user_roles")
        .delete()
        .in("user_id", userIds)
        .eq("role", "dealer");

      toast.success(`Successfully declined ${selectedIds.length} dealer(s)`);
      setSelectedPending(new Set());
      fetchDealers();
    } catch (error) {
      console.error("Error in bulk decline:", error);
      toast.error("Failed to decline dealers");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkVerificationUpdate = async () => {
    if (selectedActive.size === 0) return;
    
    setIsProcessing(true);
    try {
      const selectedIds = Array.from(selectedActive);
      
      const { error } = await supabase
        .from("dealers")
        .update({ verification_status: newVerificationStatus })
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`Updated verification status for ${selectedIds.length} dealer(s)`);
      setSelectedActive(new Set());
      setShowVerificationDialog(false);
      fetchDealers();
    } catch (error) {
      console.error("Error in bulk verification update:", error);
      toast.error("Failed to update verification status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkNotification = async () => {
    if (selectedActive.size === 0 || !notificationSubject || !notificationMessage) return;
    
    setIsProcessing(true);
    try {
      const selectedDealersData = activeDealers.filter(d => selectedActive.has(d.id));
      let successCount = 0;

      for (const dealer of selectedDealersData) {
        try {
          await supabase.functions.invoke("send-bulk-dealer-notification", {
            body: {
              dealerId: dealer.id,
              dealershipName: dealer.dealership_name,
              subject: notificationSubject,
              message: notificationMessage,
            },
          });
          successCount++;
        } catch (emailError) {
          console.error(`Failed to send notification to ${dealer.dealership_name}:`, emailError);
        }
      }

      toast.success(`Sent notifications to ${successCount} of ${selectedDealersData.length} dealer(s)`);
      setSelectedActive(new Set());
      setShowNotificationDialog(false);
      setNotificationSubject("");
      setNotificationMessage("");
    } catch (error) {
      console.error("Error in bulk notification:", error);
      toast.error("Failed to send notifications");
    } finally {
      setIsProcessing(false);
    }
  };

  const getVerificationInfo = (status: string) => {
    return verificationLevels.find(v => v.value === status) || verificationLevels[0];
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
    <>
      <div className="space-y-6">
        {/* Pending Dealers - Bulk Approve/Decline */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Bulk Dealer Approvals
            </CardTitle>
            <CardDescription>
              Select multiple pending dealers to approve or decline at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingDealers.length === 0 ? (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No pending dealer requests</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedPending.size === pendingDealers.length && pendingDealers.length > 0}
                      onCheckedChange={selectAllPending}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select all ({selectedPending.size} of {pendingDealers.length} selected)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDecline}
                      disabled={selectedPending.size === 0 || isProcessing}
                      className="text-red-500 hover:text-red-600"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
                      Decline Selected
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={selectedPending.size === 0 || isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Approve Selected
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {pendingDealers.map((dealer) => (
                    <div
                      key={dealer.id}
                      className={`p-4 rounded-xl bg-secondary/30 border transition-colors ${
                        selectedPending.has(dealer.id) ? "border-primary" : "border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedPending.has(dealer.id)}
                          onCheckedChange={() => togglePendingSelection(dealer.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{dealer.dealership_name}</h4>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-xs">
                              Pending
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {dealer.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(dealer.created_at), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Dealers - Bulk Actions */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Bulk Dealer Management
            </CardTitle>
            <CardDescription>
              Send bulk notifications or update verification status for multiple dealers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeDealers.length === 0 ? (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active dealers found</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedActive.size === activeDealers.length && activeDealers.length > 0}
                      onCheckedChange={selectAllActive}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select all ({selectedActive.size} of {activeDealers.length} selected)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowVerificationDialog(true)}
                      disabled={selectedActive.size === 0 || isProcessing}
                    >
                      <BadgeCheck className="w-4 h-4 mr-1" />
                      Update Verification
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowNotificationDialog(true)}
                      disabled={selectedActive.size === 0 || isProcessing}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Send Notification
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeDealers.map((dealer) => {
                    const verificationInfo = getVerificationInfo(dealer.verification_status);
                    const VerificationIcon = verificationInfo.icon;
                    return (
                      <div
                        key={dealer.id}
                        className={`p-4 rounded-xl bg-secondary/30 border transition-colors ${
                          selectedActive.has(dealer.id) ? "border-primary" : "border-border/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedActive.has(dealer.id)}
                            onCheckedChange={() => toggleActiveSelection(dealer.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{dealer.dealership_name}</h4>
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <VerificationIcon className={`w-3 h-3 ${verificationInfo.color}`} />
                                {verificationInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {dealer.city}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Notification</DialogTitle>
            <DialogDescription>
              Send an email notification to {selectedActive.size} selected dealer(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <input
                type="text"
                value={notificationSubject}
                onChange={(e) => setNotificationSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkNotification} 
              disabled={!notificationSubject || !notificationMessage || isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Mail className="w-4 h-4 mr-1" />}
              Send to {selectedActive.size} Dealer(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Verification Status</DialogTitle>
            <DialogDescription>
              Update verification status for {selectedActive.size} selected dealer(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">New Verification Status</label>
            <Select value={newVerificationStatus} onValueChange={setNewVerificationStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {verificationLevels.map((level) => {
                  const LevelIcon = level.icon;
                  return (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <LevelIcon className={`w-4 h-4 ${level.color}`} />
                        <span>{level.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkVerificationUpdate} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <BadgeCheck className="w-4 h-4 mr-1" />}
              Update {selectedActive.size} Dealer(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBulkDealerActions;
