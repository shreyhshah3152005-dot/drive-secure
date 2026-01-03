import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Car, Calendar, Clock, Mail, Phone, User, AlertCircle, Store, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TestDriveInquiry {
  id: string;
  car_id: string;
  car_name: string;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: string;
  created_at: string;
}

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<TestDriveInquiry[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDealers, setIsLoadingDealers] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingDealerId, setUpdatingDealerId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("test_drive_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Failed to fetch test drive requests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDealers(data || []);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to fetch dealers");
    } finally {
      setIsLoadingDealers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchInquiries();
      fetchDealers();
    }
  }, [isAdmin]);

  const updateStatus = async (inquiry: TestDriveInquiry, newStatus: string) => {
    if (inquiry.status === newStatus) return;

    setUpdatingId(inquiry.id);
    const oldStatus = inquiry.status;

    try {
      const { error: updateError } = await supabase
        .from("test_drive_inquiries")
        .update({ status: newStatus })
        .eq("id", inquiry.id);

      if (updateError) throw updateError;

      const { error: emailError } = await supabase.functions.invoke(
        "send-test-drive-notification",
        {
          body: {
            email: inquiry.email,
            name: inquiry.name,
            carName: inquiry.car_name,
            oldStatus: oldStatus,
            newStatus: newStatus,
            preferredDate: format(new Date(inquiry.preferred_date), "MMMM dd, yyyy"),
            preferredTime: inquiry.preferred_time,
          },
        }
      );

      if (emailError) {
        console.error("Email notification failed:", emailError);
        toast.warning("Status updated but email notification failed");
      } else {
        toast.success(`Status updated to ${newStatus} and email sent to ${inquiry.email}`);
      }

      fetchInquiries();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateDealerSubscription = async (dealer: Dealer, newPlan: string) => {
    if (dealer.subscription_plan === newPlan) return;

    setUpdatingDealerId(dealer.id);

    try {
      const { error } = await supabase
        .from("dealers")
        .update({ 
          subscription_plan: newPlan,
          subscription_start_date: new Date().toISOString()
        })
        .eq("id", dealer.id);

      if (error) throw error;
      
      toast.success(`${dealer.dealership_name}'s plan updated to ${newPlan}`);
      fetchDealers();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    } finally {
      setUpdatingDealerId(null);
    }
  };

  const toggleDealerStatus = async (dealer: Dealer) => {
    setUpdatingDealerId(dealer.id);

    try {
      const { error } = await supabase
        .from("dealers")
        .update({ is_active: !dealer.is_active })
        .eq("id", dealer.id);

      if (error) throw error;
      
      toast.success(`${dealer.dealership_name} ${dealer.is_active ? "deactivated" : "activated"}`);
      fetchDealers();
    } catch (error) {
      console.error("Error updating dealer status:", error);
      toast.error("Failed to update dealer status");
    } finally {
      setUpdatingDealerId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "premium":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "standard":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="gradient-card border-border/50 max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === "pending").length,
    confirmed: inquiries.filter((i) => i.status === "confirmed").length,
    cancelled: inquiries.filter((i) => i.status === "cancelled").length,
    dealers: dealers.length,
    activeDealers: dealers.filter((d) => d.is_active).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage test drives and dealers</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-400">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-red-400">{stats.cancelled}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.dealers}</p>
              <p className="text-sm text-muted-foreground">Total Dealers</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-400">{stats.activeDealers}</p>
              <p className="text-sm text-muted-foreground">Active Dealers</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="test-drives" className="space-y-6">
          <TabsList>
            <TabsTrigger value="test-drives" className="gap-2">
              <Car className="w-4 h-4" />
              Test Drives
            </TabsTrigger>
            <TabsTrigger value="dealers" className="gap-2">
              <Store className="w-4 h-4" />
              Dealers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test-drives">
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Test Drive Requests
                </CardTitle>
                <CardDescription>
                  Click on status to update and send email notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No test drive requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className="p-5 rounded-xl bg-secondary/30 border border-border/50"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-foreground text-lg">
                                {inquiry.car_name}
                              </h3>
                              <Badge className={getStatusColor(inquiry.status)}>
                                {inquiry.status}
                              </Badge>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span>{inquiry.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span>{inquiry.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span>{inquiry.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {format(new Date(inquiry.preferred_date), "MMM dd, yyyy")}
                                </span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{inquiry.preferred_time}</span>
                              </div>
                            </div>
                            {inquiry.message && (
                              <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                                "{inquiry.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Submitted: {format(new Date(inquiry.created_at), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={inquiry.status}
                              onValueChange={(value) => updateStatus(inquiry, value)}
                              disabled={updatingId === inquiry.id}
                            >
                              <SelectTrigger className="w-[140px] bg-secondary/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingId === inquiry.id && (
                              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dealers">
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Dealer Management
                </CardTitle>
                <CardDescription>
                  Manage dealer subscriptions and account status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDealers ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </div>
                ) : dealers.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No dealers registered yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dealership</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealers.map((dealer) => (
                        <TableRow key={dealer.id}>
                          <TableCell className="font-medium">{dealer.dealership_name}</TableCell>
                          <TableCell>{dealer.city}</TableCell>
                          <TableCell>{dealer.phone || "N/A"}</TableCell>
                          <TableCell>
                            <Select
                              value={dealer.subscription_plan}
                              onValueChange={(value) => updateDealerSubscription(dealer, value)}
                              disabled={updatingDealerId === dealer.id}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className={dealer.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                              {dealer.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(dealer.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={dealer.is_active ? "destructive" : "default"}
                              onClick={() => toggleDealerStatus(dealer)}
                              disabled={updatingDealerId === dealer.id}
                            >
                              {dealer.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;