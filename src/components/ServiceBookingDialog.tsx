import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ServiceBookingDialogProps {
  packageId: string;
  packageName: string;
  packagePrice: number;
  trigger: React.ReactNode;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

const carBrands = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Kia",
  "Toyota", "Honda", "MG", "Skoda", "Volkswagen",
  "BMW", "Mercedes-Benz", "Audi", "Jeep", "Renault",
];

const ServiceBookingDialog = ({ packageId, packageName, packagePrice, trigger }: ServiceBookingDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [carRegistration, setCarRegistration] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to book a service");
      return;
    }
    if (!date || !timeSlot || !carBrand || !carModel || !carYear || !carRegistration) {
      toast.error("Please fill in all required fields");
      return;
    }

    const yearNum = parseInt(carYear);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
      toast.error("Please enter a valid car year");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("service_bookings").insert({
        user_id: user.id,
        package_id: packageId,
        package_name: packageName,
        package_price: packagePrice,
        car_brand: carBrand,
        car_model: carModel,
        car_year: yearNum,
        car_registration: carRegistration.toUpperCase(),
        booking_date: format(date, "yyyy-MM-dd"),
        booking_time: timeSlot,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Service booked successfully! We'll send you a confirmation shortly.");

      // Send email confirmation
      try {
        const userEmail = user.email;
        const profileRes = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
        const userName = profileRes.data?.name || "Customer";

        await supabase.functions.invoke("send-service-booking-email", {
          body: {
            email: userEmail,
            name: userName,
            packageName,
            packagePrice,
            carBrand,
            carModel,
            carRegistration: carRegistration.toUpperCase(),
            bookingDate: format(date, "dd MMM yyyy"),
            bookingTime: timeSlot,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }

      setOpen(false);
      // Reset form
      setDate(undefined);
      setTimeSlot("");
      setCarBrand("");
      setCarModel("");
      setCarYear("");
      setCarRegistration("");
      setNotes("");
    } catch (e: any) {
      toast.error(e.message || "Failed to book service");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {packageName}</DialogTitle>
          <p className="text-sm text-muted-foreground">₹{packagePrice.toLocaleString("en-IN")} package</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Car Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Car Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Brand *</Label>
                <Select value={carBrand} onValueChange={setCarBrand}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {carBrands.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Model *</Label>
                <Input placeholder="e.g. Swift" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Year *</Label>
                <Input type="number" placeholder="e.g. 2022" value={carYear} onChange={(e) => setCarYear(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Registration No. *</Label>
                <Input placeholder="e.g. MH01AB1234" value={carRegistration} onChange={(e) => setCarRegistration(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
            <div>
              <Label className="text-xs">Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">Time Slot *</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time">
                    {timeSlot && (
                      <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {timeSlot}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Additional Notes</Label>
            <Textarea
              placeholder="Any specific issues or requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingDialog;
