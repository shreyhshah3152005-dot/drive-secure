import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerCarNotifications } from "@/hooks/useDealerCarNotifications";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationPreferences from "@/components/NotificationPreferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  TrendingDown,
  Car,
  Calendar,
  Check,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface PriceAlert {
  id: string;
  target_price: number;
  triggered_at: string | null;
  is_triggered: boolean;
  car: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image_url: string | null;
  } | null;
}

interface TestDriveNotification {
  id: string;
  car_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
}

const formatPrice = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

const NotificationCenter = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    notifications: carNotifications,
    unreadCount: carUnread,
    markAsRead: markCarRead,
    markAllAsRead: markAllCarRead,
    deleteNotification: deleteCarNotification,
  } = useDealerCarNotifications();

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveNotification[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingDrives, setLoadingDrives] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchPriceAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from("price_alerts")
          .select("id, target_price, triggered_at, is_triggered, car:dealer_cars(id, name, brand, price, image_url)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setPriceAlerts(
          (data || []).map((a: any) => ({
            id: a.id,
            target_price: a.target_price,
            triggered_at: a.triggered_at,
            is_triggered: a.is_triggered,
            car: a.car,
          }))
        );
      } catch (e) {
        console.error("Error fetching price alerts:", e);
      } finally {
        setLoadingAlerts(false);
      }
    };

    const fetchTestDrives = async () => {
      try {
        const { data, error } = await supabase
          .from("test_drive_inquiries")
          .select("id, car_name, preferred_date, preferred_time, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        setTestDrives(data || []);
      } catch (e) {
        console.error("Error fetching test drives:", e);
      } finally {
        setLoadingDrives(false);
      }
    };

    fetchPriceAlerts();
    fetchTestDrives();
  }, [user]);

  const handleDismissAlert = async (id: string) => {
    await supabase.from("price_alerts").delete().eq("id", id);
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const triggeredAlerts = priceAlerts.filter((a) => a.is_triggered);
  const totalUnread = carUnread + triggeredAlerts.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notification Center
            </h1>
            <p className="text-muted-foreground mt-1">
              All your alerts and updates in one place
            </p>
          </div>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {totalUnread} unread
            </Badge>
          )}
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="w-4 h-4" />
              All
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="price" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              Price Drops
              {triggeredAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {triggeredAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cars" className="gap-2">
              <Car className="w-4 h-4" />
              New Cars
              {carUnread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {carUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="testdrives" className="gap-2">
              <Calendar className="w-4 h-4" />
              Test Drives
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Bell className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ALL tab */}
          <TabsContent value="all">
            <div className="space-y-4">
              {/* Price drops */}
              {triggeredAlerts.map((alert) => (
                <NotificationCard
                  key={`price-${alert.id}`}
                  icon={<TrendingDown className="w-5 h-5 text-green-500" />}
                  type="Price Drop"
                  title={alert.car ? `${alert.car.brand} ${alert.car.name}` : "Car"}
                  description={`Price dropped to ${alert.car ? formatPrice(alert.car.price) : "N/A"} — your target was ${formatPrice(alert.target_price)}`}
                  time={alert.triggered_at || ""}
                  imageUrl={alert.car?.image_url}
                  link={alert.car ? `/dealer-car/${alert.car.id}` : undefined}
                  onDismiss={() => handleDismissAlert(alert.id)}
                  unread
                />
              ))}
              {/* New cars */}
              {carNotifications.map((n) => (
                <NotificationCard
                  key={`car-${n.id}`}
                  icon={<Car className="w-5 h-5 text-primary" />}
                  type="New Car"
                  title={n.car ? `${n.car.brand} ${n.car.name}` : "New car listed"}
                  description={`Listed by ${n.dealer?.dealership_name || "a dealer"}${n.car?.price ? ` at ${formatPrice(n.car.price)}` : ""}`}
                  time={n.created_at}
                  imageUrl={n.car?.image_url}
                  link={`/dealer-car/${n.car_id}`}
                  onDismiss={() => deleteCarNotification(n.id)}
                  onRead={() => markCarRead(n.id)}
                  unread={!n.is_read}
                />
              ))}
              {/* Test drives */}
              {testDrives.map((td) => (
                <NotificationCard
                  key={`td-${td.id}`}
                  icon={getStatusIcon(td.status)}
                  type="Test Drive"
                  title={td.car_name}
                  description={`${td.status.charAt(0).toUpperCase() + td.status.slice(1)} — ${format(new Date(td.preferred_date), "MMM dd, yyyy")} at ${td.preferred_time}`}
                  time={td.created_at}
                />
              ))}
              {triggeredAlerts.length === 0 && carNotifications.length === 0 && testDrives.length === 0 && (
                <EmptyState />
              )}
            </div>
          </TabsContent>

          {/* Price drops tab */}
          <TabsContent value="price">
            <div className="space-y-4">
              {triggeredAlerts.length === 0 ? (
                <EmptyState message="No price drop alerts yet. Set alerts on cars you're interested in." />
              ) : (
                triggeredAlerts.map((alert) => (
                  <NotificationCard
                    key={alert.id}
                    icon={<TrendingDown className="w-5 h-5 text-green-500" />}
                    type="Price Drop"
                    title={alert.car ? `${alert.car.brand} ${alert.car.name}` : "Car"}
                    description={`Now ${alert.car ? formatPrice(alert.car.price) : "N/A"} (target: ${formatPrice(alert.target_price)})`}
                    time={alert.triggered_at || ""}
                    imageUrl={alert.car?.image_url}
                    link={alert.car ? `/dealer-car/${alert.car.id}` : undefined}
                    onDismiss={() => handleDismissAlert(alert.id)}
                    unread
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* New cars tab */}
          <TabsContent value="cars">
            <div className="space-y-4">
              {carUnread > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={markAllCarRead}>
                    <Check className="w-4 h-4 mr-1" /> Mark all read
                  </Button>
                </div>
              )}
              {carNotifications.length === 0 ? (
                <EmptyState message="No new car notifications. Favorite dealers to get notified when they list new cars." />
              ) : (
                carNotifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    icon={<Car className="w-5 h-5 text-primary" />}
                    type="New Car"
                    title={n.car ? `${n.car.brand} ${n.car.name}` : "New car listed"}
                    description={`by ${n.dealer?.dealership_name || "dealer"}${n.car?.price ? ` — ${formatPrice(n.car.price)}` : ""}`}
                    time={n.created_at}
                    imageUrl={n.car?.image_url}
                    link={`/dealer-car/${n.car_id}`}
                    onDismiss={() => deleteCarNotification(n.id)}
                    onRead={() => markCarRead(n.id)}
                    unread={!n.is_read}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Test drives tab */}
          <TabsContent value="testdrives">
            <div className="space-y-4">
              {testDrives.length === 0 ? (
                <EmptyState message="No test drive updates. Book a test drive to see updates here." />
              ) : (
                testDrives.map((td) => (
                  <NotificationCard
                    key={td.id}
                    icon={getStatusIcon(td.status)}
                    type={`Test Drive — ${td.status}`}
                    title={td.car_name}
                    description={`${format(new Date(td.preferred_date), "MMM dd, yyyy")} at ${td.preferred_time}`}
                    time={td.created_at}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings">
            <NotificationPreferences />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

/* Reusable notification card */
interface NotificationCardProps {
  icon: React.ReactNode;
  type: string;
  title: string;
  description: string;
  time: string;
  imageUrl?: string | null;
  link?: string;
  onDismiss?: () => void;
  onRead?: () => void;
  unread?: boolean;
}

const NotificationCard = ({
  icon,
  type,
  title,
  description,
  time,
  imageUrl,
  link,
  onDismiss,
  onRead,
  unread,
}: NotificationCardProps) => (
  <Card
    className={`transition-colors ${unread ? "border-primary/30 bg-primary/5" : "border-border/50"}`}
  >
    <CardContent className="flex items-start gap-4 p-4">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      {imageUrl && (
        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
          {time && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(time), { addSuffix: true })}
            </span>
          )}
        </div>
        <p className="font-semibold text-foreground truncate">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {link && (
          <Link to={link} onClick={onRead}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDismiss}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ message }: { message?: string }) => (
  <div className="text-center py-16">
    <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
    <p className="text-muted-foreground">{message || "No notifications yet"}</p>
  </div>
);

export default NotificationCenter;
