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
import { Wrench, Package, Clock, CheckCircle, XCircle, Car, Search, Filter, AlertCircle, Receipt, History, Droplets, RotateCcw, LayoutDashboard, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ServiceInvoiceDialog from "@/components/ServiceInvoiceDialog";
import VehicleHistoryDialog from "@/components/VehicleHistoryDialog";
import ProviderInvoicesList from "@/components/ProviderInvoicesList";
import ServiceAuditLog from "@/components/ServiceAuditLog";

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
  const [confirmStep, setConfirmStep] = useState(false);
  const [serviceDialog, setServiceDialog] = useState<{ booking: ServiceBooking; action: "done" | "undo" } | null>(null);
  const [washDialog, setWashDialog] = useState<{ booking: ServiceBooking; action: "done" | "undo" } | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<ServiceBooking | null>(null);
  const [historyReg, setHistoryReg] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [actionInFlight, setActionInFlight] = useState(false);

  const markPending = (id: string, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });

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
    if (!isServiceProvider) return;
    fetchBookings();
    // realtime: keep panel synced + reflect undo immediately
    const channel = supabase
      .channel("sp-service-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_bookings" }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isServiceProvider]);

  const logAudit = async (b: ServiceBooking, action: string, prev: number | string, next: number | string) => {
    try {
      await (supabase as any).from("service_audit_log").insert({
        booking_id: b.id, user_id: b.user_id, actor_id: user?.id,
        action_type: action, previous_value: String(prev), new_value: String(next),
      });
    } catch (e) { console.error("audit log failed", e); }
  };

  const handleUpdateStatus = async () => {
    if (!updateDialog || !newStatus) return;
    setUpdating(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "completed" && updateDialog.status !== "completed") {
        updateData.services_used = Math.min(updateDialog.total_services, updateDialog.services_used + 1);
      }
      const { error } = await supabase.from("service_bookings").update(updateData).eq("id", updateDialog.id);
      if (error) throw error;
      await logAudit(updateDialog, "status_change", updateDialog.status, newStatus);

      try {
        const { data: profile } = await supabase
          .from("profiles").select("email, name").eq("user_id", updateDialog.user_id).single();
        if (profile?.email) {
          await supabase.functions.invoke("send-service-booking-email", {
            body: {
              email: profile.email, name: profile.name || "Customer",
              packageName: updateDialog.package_name, packagePrice: updateDialog.package_price,
              carBrand: updateDialog.car_brand, carModel: updateDialog.car_model,
              carRegistration: updateDialog.car_registration,
              bookingDate: format(new Date(updateDialog.booking_date), "dd MMM yyyy"),
              bookingTime: updateDialog.booking_time, statusUpdate: newStatus,
            },
          });
        }
      } catch (emailErr) {
        console.error("Failed to send status email:", emailErr);
      }

      toast.success(`Booking status updated to ${newStatus}`);
      setUpdateDialog(null); setNewStatus(""); setConfirmStep(false);
      fetchBookings();
    } catch {
      toast.error("Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const handleWashChange = async () => {
    if (!washDialog || actionInFlight) return;
    const { booking, action } = washDialog;
    if (pending.has(booking.id)) return;
    if (action === "done" && booking.washes_used >= booking.total_washes) { toast.error("All washes used"); return; }
    if (action === "undo" && booking.washes_used <= 0) { toast.error("No washes to undo"); return; }
    const nextCount = action === "done" ? booking.washes_used + 1 : booking.washes_used - 1;
    setActionInFlight(true); markPending(booking.id, true);
    try {
      const { error } = await supabase.from("service_bookings")
        .update({ washes_used: nextCount }).eq("id", booking.id);
      if (error) throw error;
      await logAudit(booking, action === "done" ? "wash_done" : "wash_undo", booking.washes_used, nextCount);
      toast.success(action === "done" ? "Wash marked as done" : "Wash mark undone");
      setWashDialog(null);
      fetchBookings();
    } catch {
      toast.error("Failed to update wash count");
    } finally {
      setActionInFlight(false); markPending(booking.id, false);
    }
  };

  const handleServiceChange = async () => {
    if (!serviceDialog || actionInFlight) return;
    const { booking, action } = serviceDialog;
    if (pending.has(booking.id)) return;
    if (action === "done" && booking.services_used >= booking.total_services) { toast.error("All services used"); return; }
    if (action === "undo" && booking.services_used <= 0) { toast.error("No services to undo"); return; }
    const nextCount = action === "done" ? booking.services_used + 1 : booking.services_used - 1;
    setActionInFlight(true); markPending(booking.id, true);
    try {
      const { error } = await supabase.from("service_bookings")
        .update({ services_used: nextCount }).eq("id", booking.id);
      if (error) throw error;
      await logAudit(booking, action === "done" ? "service_done" : "service_undo", booking.services_used, nextCount);
      toast.success(action === "done" ? "Service marked as done" : "Service mark undone");
      setServiceDialog(null);
      fetchBookings();
    } catch {
      toast.error("Failed to update service count");
    } finally {
      setActionInFlight(false); markPending(booking.id, false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "in_progress": return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed": return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default: return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      b.car_registration.toLowerCase().includes(q) ||
      b.car_brand.toLowerCase().includes(q) ||
      b.car_model.toLowerCase().includes(q) ||
      b.package_name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    inProgress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (authLoading || spLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  if (!isServiceProvider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="gradient-card border-border/50 max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to access the service provider panel.</p>
            <Button variant="outline" onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SearchBar = (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by car, registration, package..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const VehicleCell = (b: ServiceBooking) => (
    <>
      <div className="font-medium text-sm">{b.car_brand} {b.car_model} <span className="text-xs text-muted-foreground">({b.car_year})</span></div>
      <div className="text-xs font-mono text-muted-foreground">{b.car_registration}</div>
      <div className="text-xs text-muted-foreground">{b.package_name}</div>
    </>
  );

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Bookings</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{stats.confirmed}</p><p className="text-xs text-muted-foreground">Confirmed</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="w-4 h-4" />Overview</TabsTrigger>
            <TabsTrigger value="services" className="gap-2"><Wrench className="w-4 h-4" />Services</TabsTrigger>
            <TabsTrigger value="washes" className="gap-2"><Droplets className="w-4 h-4" />Washes</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><Receipt className="w-4 h-4" />Billing</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" />History</TabsTrigger>
            <TabsTrigger value="activity" className="gap-2"><Activity className="w-4 h-4" />Activity</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" />All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {SearchBar}
                {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                  : filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No bookings found</p>
                  : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Vehicle</TableHead><TableHead>Date & Time</TableHead>
                        <TableHead>Usage</TableHead><TableHead>Status</TableHead><TableHead>Update</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filtered.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>{VehicleCell(b)}</TableCell>
                            <TableCell>
                              <div className="text-sm">{format(new Date(b.booking_date), "dd MMM yyyy")}</div>
                              <div className="text-xs text-muted-foreground">{b.booking_time}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div>Services: <strong>{b.services_used}/{b.total_services}</strong></div>
                                <div>Washes: <strong>{b.washes_used}/{b.total_washes}</strong></div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(b.status)}</TableCell>
                            <TableCell>
                              {b.status !== "cancelled" && b.status !== "completed" && (
                                <Button size="sm" variant="outline" disabled={pending.has(b.id)}
                                  onClick={() => { setUpdateDialog(b); setNewStatus(b.status); setConfirmStep(false); }}>
                                  Update Status
                                </Button>
                              )}
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

          {/* SERVICES */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" />Mark Services Done / Undo</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">All actions require confirmation. Buttons disable while saving to prevent double-counting.</p>
              </CardHeader>
              <CardContent>
                {SearchBar}
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No bookings found</p> : (
                  <div className="grid gap-3">
                    {filtered.map((b) => {
                      const isPending = pending.has(b.id);
                      const cancelled = b.status === "cancelled";
                      return (
                        <div key={b.id} className="p-4 rounded-lg border border-border/40 flex flex-wrap justify-between items-center gap-3">
                          <div className="min-w-0">{VehicleCell(b)}</div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm"><Wrench className="inline w-3 h-3 mr-1 text-primary" />
                              <strong>{b.services_used}/{b.total_services}</strong> done
                            </div>
                            <Button size="sm" variant="default" disabled={isPending || cancelled || b.services_used >= b.total_services}
                              onClick={() => setServiceDialog({ booking: b, action: "done" })}>
                              <CheckCircle className="w-3 h-3 mr-1" />Service Done
                            </Button>
                            <Button size="sm" variant="outline" disabled={isPending || cancelled || b.services_used <= 0}
                              onClick={() => setServiceDialog({ booking: b, action: "undo" })}>
                              <RotateCcw className="w-3 h-3 mr-1" />Undo
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WASHES */}
          <TabsContent value="washes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-primary" />Mark Washes Done / Undo</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">All actions require confirmation. Buttons disable while saving to prevent miscounts.</p>
              </CardHeader>
              <CardContent>
                {SearchBar}
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No bookings found</p> : (
                  <div className="grid gap-3">
                    {filtered.map((b) => {
                      const isPending = pending.has(b.id);
                      const cancelled = b.status === "cancelled";
                      return (
                        <div key={b.id} className="p-4 rounded-lg border border-border/40 flex flex-wrap justify-between items-center gap-3">
                          <div className="min-w-0">{VehicleCell(b)}</div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm"><Droplets className="inline w-3 h-3 mr-1 text-primary" />
                              <strong>{b.washes_used}/{b.total_washes}</strong> done
                            </div>
                            <Button size="sm" variant="default" disabled={isPending || cancelled || b.washes_used >= b.total_washes}
                              onClick={() => setWashDialog({ booking: b, action: "done" })}>
                              <CheckCircle className="w-3 h-3 mr-1" />Wash Done
                            </Button>
                            <Button size="sm" variant="outline" disabled={isPending || cancelled || b.washes_used <= 0}
                              onClick={() => setWashDialog({ booking: b, action: "undo" })}>
                              <RotateCcw className="w-3 h-3 mr-1" />Undo
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Generate Invoices</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">GST is fixed at 18%. Totals auto-calculate from parts and labor.</p>
              </CardHeader>
              <CardContent>
                {SearchBar}
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No bookings found</p> : (
                  <div className="grid gap-3">
                    {filtered.map((b) => (
                      <div key={b.id} className="p-4 rounded-lg border border-border/40 flex flex-wrap justify-between items-center gap-3">
                        <div className="min-w-0">{VehicleCell(b)}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{format(new Date(b.booking_date), "dd MMM yyyy")}</span>
                          <Button size="sm" variant="default" onClick={() => setInvoiceBooking(b)}>
                            <Receipt className="w-3 h-3 mr-1" />Generate Bill
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="mt-6">
              <ProviderInvoicesList
                providerName={providerInfo?.business_name || "Service Provider"}
                providerCity={providerInfo?.city}
                providerPhone={providerInfo?.phone}
              />
            </div>
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" />Vehicle History</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Open a vehicle's full history including invoices and current usage counts.</p>
              </CardHeader>
              <CardContent>
                {SearchBar}
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No bookings found</p> : (
                  <div className="grid gap-3">
                    {filtered.map((b) => (
                      <div key={b.id} className="p-4 rounded-lg border border-border/40 flex flex-wrap justify-between items-center gap-3">
                        <div className="min-w-0">
                          {VehicleCell(b)}
                          <div className="text-xs text-muted-foreground mt-1">
                            Current: Services {b.services_used}/{b.total_services} · Washes {b.washes_used}/{b.total_washes}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setHistoryReg(b.car_registration)}>
                          <History className="w-3 h-3 mr-1" />View History
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity">
            <ServiceAuditLog />
          </TabsContent>
        </Tabs>

        {/* Status Update Dialog */}
        <Dialog open={!!updateDialog} onOpenChange={() => { setUpdateDialog(null); setConfirmStep(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmStep ? "Confirm Status Change" : "Update Booking Status"}</DialogTitle>
            </DialogHeader>
            {updateDialog && !confirmStep && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-sm space-y-1">
                  <p><strong>{updateDialog.package_name}</strong></p>
                  <p className="text-muted-foreground">{updateDialog.car_brand} {updateDialog.car_model} — {updateDialog.car_registration}</p>
                  <p className="text-xs">Current: <span className="capitalize font-medium">{updateDialog.status.replace("_", " ")}</span></p>
                </div>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {updateDialog && confirmStep && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-semibold">Please confirm this change</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Change status from <strong className="capitalize">{updateDialog.status.replace("_", " ")}</strong> to <strong className="capitalize">{newStatus.replace("_", " ")}</strong>?
                    {newStatus === "completed" && " This will increment services-used and notify the customer."}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { if (confirmStep) setConfirmStep(false); else setUpdateDialog(null); }}>
                {confirmStep ? "Back" : "Cancel"}
              </Button>
              {!confirmStep ? (
                <Button onClick={() => setConfirmStep(true)} disabled={!newStatus || newStatus === updateDialog?.status}>Continue</Button>
              ) : (
                <Button onClick={handleUpdateStatus} disabled={updating}>{updating ? "Updating..." : "Confirm & Update"}</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Service Confirmation */}
        <Dialog open={!!serviceDialog} onOpenChange={() => !actionInFlight && setServiceDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{serviceDialog?.action === "undo" ? "Undo service mark?" : "Mark service as done?"}</DialogTitle>
            </DialogHeader>
            {serviceDialog && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                  <p><strong>{serviceDialog.booking.car_brand} {serviceDialog.booking.car_model}</strong> — {serviceDialog.booking.car_registration}</p>
                  <p className="text-xs">Current services done: <strong>{serviceDialog.booking.services_used}/{serviceDialog.booking.total_services}</strong></p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {serviceDialog.action === "undo"
                    ? "This reduces the customer's completed service count by one."
                    : "This increases the customer's completed service count by one and updates their profile immediately."}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setServiceDialog(null)} disabled={actionInFlight}>Cancel</Button>
              <Button onClick={handleServiceChange} disabled={actionInFlight}>
                {actionInFlight ? "Saving..." : (serviceDialog?.action === "undo" ? "Confirm Undo" : "Confirm Done")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Wash Confirmation */}
        <Dialog open={!!washDialog} onOpenChange={() => !actionInFlight && setWashDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{washDialog?.action === "undo" ? "Undo wash mark?" : "Mark wash as done?"}</DialogTitle>
            </DialogHeader>
            {washDialog && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                  <p><strong>{washDialog.booking.car_brand} {washDialog.booking.car_model}</strong> — {washDialog.booking.car_registration}</p>
                  <p className="text-xs">Current washes done: <strong>{washDialog.booking.washes_used}/{washDialog.booking.total_washes}</strong></p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {washDialog.action === "undo"
                    ? "This reduces the customer's completed wash count by one."
                    : "This increases the customer's completed wash count by one and updates their profile immediately."}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setWashDialog(null)} disabled={actionInFlight}>Cancel</Button>
              <Button onClick={handleWashChange} disabled={actionInFlight}>
                {actionInFlight ? "Saving..." : (washDialog?.action === "undo" ? "Confirm Undo" : "Confirm Done")}
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
          providerName={providerInfo?.business_name || "Service Provider"}
          providerCity={providerInfo?.city}
          providerPhone={providerInfo?.phone}
          onClose={() => setHistoryReg(null)}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ServiceProviderPanel;
