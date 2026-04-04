import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Car, Clock, Package } from "lucide-react";
import { format } from "date-fns";

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

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false });
      setBookings((data as Booking[]) || []);
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

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

  const isUpcoming = (date: string) => new Date(date) >= new Date();

  return (
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
                {isUpcoming(b.booking_date) && (
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyBookings;
