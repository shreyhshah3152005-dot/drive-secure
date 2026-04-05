import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Package, Clock, CheckCircle, XCircle, Car, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
}

const statusOptions = ["confirmed", "in_progress", "completed", "cancelled"];

const DealerServiceBookings = () => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updateDialog, setUpdateDialog] = useState<ServiceBooking | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

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
    fetchBookings();
  }, []);

  const handleUpdateStatus = async () => {
    if (!updateDialog || !newStatus) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: newStatus })
        .eq("id", updateDialog.id);

      if (error) throw error;

      // Send email notification about status change
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

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{stats.confirmed}</p><p className="text-xs text-muted-foreground">Confirmed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Service Bookings
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by car, registration, package..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
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
          {filtered.length === 0 ? (
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
                    <TableHead>Price</TableHead>
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
                      <TableCell className="font-semibold text-primary">₹{b.package_price.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{getStatusBadge(b.status)}</TableCell>
                      <TableCell>
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUpdateDialog(b);
                              setNewStatus(b.status);
                            }}
                          >
                            Update
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
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
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
    </div>
  );
};

export default DealerServiceBookings;
