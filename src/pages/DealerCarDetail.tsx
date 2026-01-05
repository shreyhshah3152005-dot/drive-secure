import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  ArrowLeft, Car, Fuel, Settings2, Users, Gauge, 
  Phone, MapPin, Store, Calendar, Clock, Zap, Cog
} from "lucide-react";

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  category: string;
  fuel_type: string;
  transmission: string;
  price: number;
  image_url: string | null;
  power: string | null;
  engine: string | null;
  mileage: string | null;
  description: string | null;
  seating_capacity: number;
  dealer_id: string;
}

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  address: string | null;
}

const formatPrice = (price: number) => {
  if (price >= 100) {
    return `₹${(price / 100).toFixed(2)} Cr`;
  }
  return `₹${price.toFixed(2)} Lakh`;
};

const DealerCarDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [car, setCar] = useState<DealerCar | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Test drive form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCarAndDealer = async () => {
      if (!id) return;

      try {
        // Fetch car
        const { data: carData, error: carError } = await supabase
          .from("dealer_cars")
          .select("*")
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (carError) throw carError;
        setCar(carData);

        // Fetch dealer
        const { data: dealerData, error: dealerError } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, phone, address")
          .eq("id", carData.dealer_id)
          .single();

        if (dealerError) throw dealerError;
        setDealer(dealerData);
      } catch (error) {
        console.error("Error fetching car:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarAndDealer();
  }, [id]);

  const handleTestDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to book a test drive");
      return;
    }

    if (!car || !dealer) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("test_drive_inquiries").insert({
        user_id: user.id,
        car_id: car.id,
        car_name: `${car.brand} ${car.name}`,
        dealer_id: dealer.id,
        name,
        email,
        phone,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        message: message || null,
      });

      if (error) throw error;

      // Send confirmation email to customer
      try {
        await supabase.functions.invoke("send-customer-notification", {
          body: {
            type: "submission",
            email,
            name,
            carName: `${car.brand} ${car.name}`,
            dealerName: dealer.dealership_name,
            preferredDate,
            preferredTime,
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the main request if email fails
      }

      toast.success("Test drive request submitted successfully!");
      setName("");
      setEmail("");
      setPhone("");
      setPreferredDate("");
      setPreferredTime("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting test drive:", error);
      toast.error("Failed to submit test drive request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!car || !dealer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
          <p className="text-muted-foreground mb-6">This car doesn't exist or is no longer available.</p>
          <Link to="/dealers">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dealers
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        {/* Back button */}
        <Link 
          to={`/dealer/${dealer.id}`} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {dealer.dealership_name}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Car Image */}
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={car.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
              <Badge className="absolute top-4 left-4 text-sm">{car.category}</Badge>
            </div>

            {/* Car Info */}
            <div>
              <p className="text-muted-foreground">{car.brand}</p>
              <h1 className="text-3xl font-bold mb-2">{car.name}</h1>
              <p className="text-3xl font-bold text-primary">{formatPrice(car.price)}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Fuel className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Fuel Type</p>
                  <p className="font-semibold">{car.fuel_type}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Settings2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Transmission</p>
                  <p className="font-semibold">{car.transmission}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Seating</p>
                  <p className="font-semibold">{car.seating_capacity} Seats</p>
                </CardContent>
              </Card>
              {car.mileage && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Gauge className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="font-semibold">{car.mileage}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {car.engine && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Cog className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Engine</p>
                        <p className="font-medium">{car.engine}</p>
                      </div>
                    </div>
                  )}
                  {car.power && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Power</p>
                        <p className="font-medium">{car.power}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Fuel className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel Type</p>
                      <p className="font-medium">{car.fuel_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Settings2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Transmission</p>
                      <p className="font-medium">{car.transmission}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {car.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About this Car</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{car.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dealer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Dealer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{dealer.dealership_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {dealer.city}
                  </div>
                </div>
                {dealer.address && (
                  <p className="text-sm text-muted-foreground">{dealer.address}</p>
                )}
                {dealer.phone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${dealer.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      {dealer.phone}
                    </a>
                  </Button>
                )}
                <Link to={`/dealer/${dealer.id}`}>
                  <Button variant="secondary" className="w-full">
                    View All Cars from this Dealer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Test Drive Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Book a Test Drive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTestDriveSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Preferred Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Preferred Time *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="time"
                          type="time"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any specific questions or requirements..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting..." : "Book Test Drive"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DealerCarDetail;
