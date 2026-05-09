import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Car, Clock, Package, XCircle, CalendarIcon, RefreshCw, Droplets, Wrench } from "lucide-react";
import { format, addMonths, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Booking {
  id: string;
  package_name: string;
  package_price: number;
  car_brand: string;
  car_model: string;
  car_registration: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  package_duration_months: number;
  total_services: number;
  total_washes: number;
  services_used: number;
  washes_used: number;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState<Date>();
  const [newTime, setNewTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false });
    setBookings((data as Booking[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    if (!user) return;

    const channel = supabase
      .channel(`my-service-bookings-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_bookings", filter: `user_id=eq.${user.id}` },
        () => fetchBookings()
      )
      .subscribe();

    const refreshOnFocus = () => fetchBookings();
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setActionLoading(true);
    try {
      const booking = bookings.find((b) => b.id === cancelId);
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: "cancelled" })
        .eq("id", cancelId);
      if (error) throw error;
      toast.success("Booking cancelled successfully");

      // Send cancellation email
      if (booking && user?.email) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
        supabase.functions.invoke("send-service-booking-email", {
          body: {
            email: user.email,
            name: profile?.name || "Customer",
            packageName: booking.package_name,
            packagePrice: booking.package_price,
            carBrand: booking.car_brand,
            carModel: booking.car_model,
            carRegistration: booking.car_registration,
            bookingDate: format(new Date(booking.booking_date), "dd MMM yyyy"),
            bookingTime: booking.booking_time,
            statusUpdate: "cancelled",
          },
        }).catch((e) => console.error("Cancel email error:", e));
      }

      setCancelId(null);
      fetchBookings();
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newDate || !newTime) {
      toast.error("Please select a new date and time");
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({
          booking_date: format(newDate, "yyyy-MM-dd"),
          booking_time: newTime,
          status: "confirmed",
        })
        .eq("id", rescheduleBooking.id);
      if (error) throw error;
      toast.success("Booking rescheduled successfully");

      // Send reschedule email
      if (user?.email) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
        supabase.functions.invoke("send-service-booking-email", {
          body: {
            email: user.email,
            name: profile?.name || "Customer",
            packageName: rescheduleBooking.package_name,
            packagePrice: rescheduleBooking.package_price,
            carBrand: rescheduleBooking.car_brand,
            carModel: rescheduleBooking.car_model,
            carRegistration: rescheduleBooking.car_registration,
            bookingDate: format(newDate, "dd MMM yyyy"),
            bookingTime: newTime,
            statusUpdate: "rescheduled",
          },
        }).catch((e) => console.error("Reschedule email error:", e));
      }

      setRescheduleBooking(null);
      setNewDate(undefined);
      setNewTime("");
      fetchBookings();
    } catch {
      toast.error("Failed to reschedule booking");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;
  if (bookings.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "completed": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    }
  };

  const isUpcoming = (date: string, status: string) =>
    new Date(date) >= new Date() && status !== "cancelled";

  const getNextServiceDate = (b: Booking) => {
    if (b.status === "cancelled") return null;
    const startDate = new Date(b.booking_date);
    const endDate = addMonths(startDate, b.package_duration_months);
    const now = new Date();
    if (now > endDate) return null; // subscription expired

    const remainingServices = b.total_services - b.services_used;
    if (remainingServices <= 0) return null;

    // Spread remaining services evenly across remaining duration
    const daysLeft = differenceInDays(endDate, now);
    const intervalDays = Math.floor(daysLeft / remainingServices);
    const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    return nextDate > endDate ? null : nextDate;
  };

  const getSubscriptionExpiry = (b: Booking) => {
    return addMonths(new Date(b.booking_date), b.package_duration_months);
  };

  const getSubscriptionProgress = (b: Booking) => {
    const start = new Date(b.booking_date);
    const end = addMonths(start, b.package_duration_months);
    const now = new Date();
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  return (
    <>
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="w-5 h-5 text-primary" />
            My Service Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.map((b) => {
            const nextService = getNextServiceDate(b);
            const expiry = getSubscriptionExpiry(b);
            const progress = getSubscriptionProgress(b);
            const isExpired = new Date() > expiry;
            const remainingServices = b.total_services - b.services_used;
            const remainingWashes = b.total_washes - b.washes_used;

            return (
              <div key={b.id} className="p-4 rounded-lg bg-secondary/30 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{b.package_name}</span>
                  <div className="flex items-center gap-2">
                    {isExpired && b.status !== "cancelled" && (
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">Expired</Badge>
                    )}
                    {!isExpired && isUpcoming(b.booking_date, b.status) && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Active</Badge>
                    )}
                    <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(b.status)}`}>
                      {b.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3" /> {b.car_brand} {b.car_model} ({b.car_registration})
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Started {format(new Date(b.booking_date), "dd MMM yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {b.package_duration_months} month plan
                  </span>
                  <span className="font-medium text-primary">₹{b.package_price.toLocaleString("en-IN")}</span>
                </div>

                {/* Subscription Progress */}
                {b.status !== "cancelled" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Plan Progress</span>
                      <span>{isExpired ? "Expired" : `Expires ${format(expiry, "dd MMM yyyy")}`}</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/20">
                        <Wrench className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{b.services_used}/{b.total_services} done</p>
                          <p className="text-[10px] text-muted-foreground">{remainingServices} services left</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/20">
                        <Droplets className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{b.washes_used}/{b.total_washes} done</p>
                          <p className="text-[10px] text-muted-foreground">{remainingWashes} washes left</p>
                        </div>
                      </div>
                    </div>

                    {(b.services_used > 0 || b.washes_used > 0 || b.status === "completed") && (
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {b.services_used > 0 && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{b.services_used} service{b.services_used > 1 ? "s" : ""} completed</Badge>}
                        {b.washes_used > 0 && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{b.washes_used} wash{b.washes_used > 1 ? "es" : ""} completed</Badge>}
                        {b.status === "completed" && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Marked done by servicer</Badge>}
                      </div>
                    )}

                    {nextService && !isExpired && remainingServices > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-primary">Next Service Due</p>
                          <p className="text-xs text-muted-foreground">
                            {format(nextService, "dd MMM yyyy")} ({differenceInDays(nextService, new Date())} days away)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isUpcoming(b.booking_date, b.status) && !isExpired && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      onClick={() => {
                        setRescheduleBooking(b);
                        setNewDate(new Date(b.booking_date));
                        setNewTime(b.booking_time);
                      }}
                    >
                      <RefreshCw className="w-3 h-3" /> Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setCancelId(b.id)}
                    >
                      <XCircle className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to cancel this service booking? This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleBooking} onOpenChange={() => setRescheduleBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">New Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(d) => d < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">New Time Slot</p>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRescheduleBooking(null)}>Cancel</Button>
            <Button variant="hero" onClick={handleReschedule} disabled={actionLoading || !newDate || !newTime}>
              {actionLoading ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyBookings;
