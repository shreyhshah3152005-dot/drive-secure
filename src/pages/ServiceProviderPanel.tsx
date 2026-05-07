import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceProviderRole } from "@/hooks/useServiceProviderRole";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Package, Clock, CheckCircle, XCircle, Car, Search, Filter, AlertCircle, Receipt, History } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ServiceInvoiceDialog from "@/components/ServiceInvoiceDialog";
import VehicleHistoryDialog from "@/components/VehicleHistoryDialog";

interface ServiceBooking {
  id: string;
  package_name: string;
  package_price: number;
  car_brand: string;
  car_model: string;
  car_registration: string;
  car_year: number;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  user_id: string;
  total_services: number;
  total_washes: number;
  services_used: number;
  washes_used: number;
  package_duration_months: number;
}

const statusOptions = ["confirmed", "in_progress", "completed", "cancelled"];

const ServiceProviderPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { isServiceProvider, isLoading: spLoading, providerInfo } = useServiceProviderRole();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updateDialog, setUpdateDialog] = useState<ServiceBooking | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<ServiceBooking | null>(null);
  const [historyReg, setHistoryReg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !spLoading && !user) {
      navigate("/service-provider-auth");
    }
  }, [user, authLoading, spLoading, navigate]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("service_bookings")
        .select("*")
        .order("booking_date", { ascending: false });
      if (error) throw error;
      setBookings((data as ServiceBooking[]) || []);
    } catch (e) {
      console.error("Error fetching bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isServiceProvider) fetchBookings();
  }, [isServiceProvider]);

  const handleUpdateStatus = async () => {
    if (!updateDialog || !newStatus) return;
    setUpdating(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };

      // If marking as completed, increment usage
      if (newStatus === "completed" && updateDialog.status !== "completed") {
        updateData.services_used = updateDialog.services_used + 1;
      }

      const { error } = await supabase
        .from("service_bookings")
        .update(updateData)
        .eq("id", updateDialog.id);
      if (error) throw error;

      // Send email notification
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("user_id", updateDialog.user_id)
          .single();

        if (profile?.email) {
          await supabase.functions.invoke("send-service-booking-email", {
            body: {
              email: profile.email,
              name: profile.name || "Customer",
              packageName: updateDialog.package_name,
              packagePrice: updateDialog.package_price,
              carBrand: updateDialog.car_brand,
              carModel: updateDialog.car_model,
              carRegistration: updateDialog.car_registration,
              bookingDate: format(new Date(updateDialog.booking_date), "dd MMM yyyy"),
              bookingTime: updateDialog.booking_time,
              statusUpdate: newStatus,
            },
          });
        }
      } catch (emailErr) {
        console.error("Failed to send status email:", emailErr);
      }

      toast.success(`Booking status updated to ${newStatus}`);
      setUpdateDialog(null);
      setNewStatus("");
      fetchBookings();
    } catch {
      toast.error("Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkWash = async (booking: ServiceBooking) => {
    if (booking.washes_used >= booking.total_washes) {
      toast.error("All washes have been used");
      return;
    }
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ washes_used: booking.washes_used + 1 })
        .eq("id", booking.id);
      if (error) throw error;
      toast.success("Wash marked as completed");
      fetchBookings();
    } catch {
      toast.error("Failed to update wash count");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    const matchesSearch =
      !search ||
      b.car_registration.toLowerCase().includes(search.toLowerCase()) ||
      b.car_brand.toLowerCase().includes(search.toLowerCase()) ||
      b.car_model.toLowerCase().includes(search.toLowerCase()) ||
      b.package_name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    inProgress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (authLoading || spLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isServiceProvider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="gradient-card border-border/50 max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the service provider panel.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Wrench className="w-8 h-8 text-primary" />
              {providerInfo?.business_name || "Service Provider"} Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage service appointments and bookings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Bookings</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{stats.confirmed}</p><p className="text-xs text-muted-foreground">Confirmed</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings" className="gap-2"><Package className="w-4 h-4" />Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Service Bookings
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by car, registration, package..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bookings found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>Car</TableHead>
                          <TableHead>Registration</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.package_name}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <Car className="w-3 h-3 text-muted-foreground" />
                                {b.car_brand} {b.car_model} ({b.car_year})
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{b.car_registration}</TableCell>
                            <TableCell>
                              <div className="text-sm">{format(new Date(b.booking_date), "dd MMM yyyy")}</div>
                              <div className="text-xs text-muted-foreground">{b.booking_time}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div>Services: {b.services_used}/{b.total_services}</div>
                                <div>Washes: {b.washes_used}/{b.total_washes}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(b.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {b.status !== "cancelled" && b.status !== "completed" && (
                                  <Button size="sm" variant="outline" onClick={() => { setUpdateDialog(b); setNewStatus(b.status); }}>
                                    Update
                                  </Button>
                                )}
                                {b.washes_used < b.total_washes && b.status !== "cancelled" && (
                                  <Button size="sm" variant="secondary" onClick={() => handleMarkWash(b)}>
                                    +Wash
                                  </Button>
                                )}
                                <Button size="sm" variant="default" onClick={() => setInvoiceBooking(b)}>
                                  <Receipt className="w-3 h-3 mr-1" />Bill
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setHistoryReg(b.car_registration)}>
                                  <History className="w-3 h-3 mr-1" />History
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Dialog */}
        <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Booking Status</DialogTitle>
            </DialogHeader>
            {updateDialog && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-sm space-y-1">
                  <p><strong>{updateDialog.package_name}</strong></p>
                  <p className="text-muted-foreground">{updateDialog.car_brand} {updateDialog.car_model} — {updateDialog.car_registration}</p>
                  <p className="text-muted-foreground">{format(new Date(updateDialog.booking_date), "dd MMM yyyy")} at {updateDialog.booking_time}</p>
                </div>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} disabled={updating}>
                {updating ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ServiceInvoiceDialog
          booking={invoiceBooking}
          providerName={providerInfo?.business_name || "Service Provider"}
          providerCity={providerInfo?.city}
          providerPhone={providerInfo?.phone}
          onClose={() => setInvoiceBooking(null)}
        />

        <VehicleHistoryDialog
          registration={historyReg}
          onClose={() => setHistoryReg(null)}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ServiceProviderPanel;
