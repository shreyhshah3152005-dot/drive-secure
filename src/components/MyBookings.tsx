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
import { CalendarDays, Car, Clock, Package, XCircle, CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
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
  }, [user]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: "cancelled" })
        .eq("id", cancelId);
      if (error) throw error;
      toast.success("Booking cancelled successfully");
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

  return (
    <>
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="w-5 h-5 text-primary" />
            My Service Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="p-3 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">{b.package_name}</span>
                <div className="flex items-center gap-2">
                  {isUpcoming(b.booking_date, b.status) && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Upcoming</Badge>
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
                  <CalendarDays className="w-3 h-3" /> {format(new Date(b.booking_date), "dd MMM yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {b.booking_time}
                </span>
                <span className="font-medium text-primary">₹{b.package_price.toLocaleString("en-IN")}</span>
              </div>
              {isUpcoming(b.booking_date, b.status) && (
                <div className="flex gap-2 mt-3">
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
          ))}
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
