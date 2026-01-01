import { useState } from "react";
import { Car } from "@/data/cars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, User, Mail, Phone, Car as CarIcon, MessageSquare, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTestDriveRateLimit } from "@/hooks/useTestDriveRateLimit";

interface TestDriveFormProps {
  car: Car;
}

const testDriveSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(15),
  preferredDate: z.string().min(1, "Please select a date"),
  preferredTime: z.string().min(1, "Please select a time"),
  message: z.string().max(500).optional(),
});

const timeSlots = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
];

const TestDriveForm = ({ car }: TestDriveFormProps) => {
  const { user } = useAuth();
  const { checkRateLimit, isCheckingLimit } = useTestDriveRateLimit();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Require authentication
    if (!user) {
      toast.error("Please sign in to book a test drive");
      return;
    }
    
    const validation = testDriveSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Check rate limit first
      const rateLimitResult = await checkRateLimit();
      if (!rateLimitResult.allowed) {
        toast.error(rateLimitResult.message || "Rate limit exceeded");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("test_drive_inquiries").insert({
        user_id: user.id,
        car_id: car.id,
        car_name: `${car.brand} ${car.model}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        message: formData.message || null,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Test drive request submitted successfully!");
    } catch (error) {
      console.error("Error submitting test drive request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      preferredDate: "",
      preferredTime: "",
      message: "",
    });
    setIsSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const isProcessing = isSubmitting || isCheckingLimit;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg" className="w-full lg:w-auto">
          <CarIcon className="w-5 h-5 mr-2" />
          Book a Test Drive
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg gradient-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <CarIcon className="w-6 h-6 text-primary" />
            Book a Test Drive
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              Your test drive request for {car.brand} {car.model} has been received. Our team will contact you shortly.
            </p>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Car Info */}
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Selected Car</p>
              <p className="font-semibold text-foreground">{car.brand} {car.model} ({car.year})</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="pl-10 bg-secondary/50 border-border"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="pl-10 bg-secondary/50 border-border"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="pl-10 bg-secondary/50 border-border"
                  required
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    min={today}
                    className="pl-10 bg-secondary/50 border-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preferred Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="w-full h-10 pl-10 pr-4 rounded-md bg-secondary/50 border border-border text-foreground text-sm"
                    required
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Additional Message (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Any specific requirements..."
                  className="pl-10 bg-secondary/50 border-border min-h-[80px]"
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Max 3 requests per day</span>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Submit Request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveForm;
