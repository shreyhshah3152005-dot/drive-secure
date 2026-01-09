import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompare } from "@/contexts/CompareContext";
import Navbar from "@/components/Navbar";
import DealerReviewForm from "@/components/DealerReviewForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Calendar, Car, Clock, Heart, MapPin, GitCompare, Trash2, Play, Star } from "lucide-react";
import { format } from "date-fns";
import EditProfileDialog from "@/components/EditProfileDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useComparisonHistory } from "@/hooks/useComparisonHistory";
import { cars } from "@/data/cars";

interface TestDriveInquiry {
  id: string;
  car_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
  dealer_id: string | null;
  dealers?: {
    id: string;
    dealership_name: string;
  } | null;
  has_review?: boolean;
}

interface Profile {
  email: string | null;
  phone: string | null;
  name: string | null;
  city: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { clearCompare, addToCompare } = useCompare();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<TestDriveInquiry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<TestDriveInquiry | null>(null);
  const { favorites } = useFavorites();
  const { history: comparisonHistory, deleteFromHistory, isLoading: historyLoading } = useComparisonHistory();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("email, phone, name, city, created_at")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch test drive inquiries with dealer info
      const { data: inquiriesData } = await supabase
        .from("test_drive_inquiries")
        .select(`
          id, car_name, preferred_date, preferred_time, status, created_at, dealer_id,
          dealers (id, dealership_name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (inquiriesData) {
        // Check which inquiries already have reviews
        const { data: reviewsData } = await supabase
          .from("dealer_reviews")
          .select("test_drive_id")
          .in("test_drive_id", inquiriesData.map(i => i.id));

        const reviewedIds = new Set(reviewsData?.map(r => r.test_drive_id) || []);
        
        const enrichedInquiries = inquiriesData.map(inquiry => ({
          ...inquiry,
          has_review: reviewedIds.has(inquiry.id)
        }));
        
        setInquiries(enrichedInquiries);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const favoriteCars = cars.filter((car) => favorites.includes(car.id));

  const formatPrice = (price: number): string => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const handleReopenComparison = (carIds: string[]) => {
    // Clear current comparison and add cars from history
    clearCompare();
    const carsToCompare = cars.filter((car) => carIds.includes(car.id));
    carsToCompare.forEach((car) => addToCompare(car));
    navigate("/compare");
  };

  const handleOpenReviewDialog = (inquiry: TestDriveInquiry) => {
    setSelectedInquiry(inquiry);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmitted = () => {
    setReviewDialogOpen(false);
    setSelectedInquiry(null);
    fetchData(); // Refresh data
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8">
          Welcome, <span className="text-gradient-gold">{profile?.name || user?.email?.split("@")[0]}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
              {profile && (
                <EditProfileDialog profile={profile} onProfileUpdate={fetchData} />
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.name && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.name}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.phone}</span>
                </div>
              )}
              {profile?.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.city}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  Member since {profile?.created_at ? format(new Date(profile.created_at), "MMM yyyy") : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Test Drive Inquiries */}
          <Card className="gradient-card border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Your Test Drive Requests
              </CardTitle>
              <CardDescription>
                {inquiries.length === 0 ? "No test drive requests yet" : `${inquiries.length} request(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You haven't booked any test drives yet. Explore our collection and book one today!
                </p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {inquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">{inquiry.car_name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(inquiry.preferred_date), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {inquiry.preferred_time}
                          </span>
                        </div>
                        {inquiry.dealers && (
                          <p className="text-xs text-muted-foreground">
                            at {inquiry.dealers.dealership_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {inquiry.status === "completed" && inquiry.dealer_id && !inquiry.has_review && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviewDialog(inquiry)}
                            className="gap-1"
                          >
                            <Star className="w-3 h-3" />
                            Review
                          </Button>
                        )}
                        {inquiry.has_review && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Reviewed
                          </Badge>
                        )}
                        <Badge className={getStatusColor(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Dialog */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rate Your Test Drive Experience</DialogTitle>
              </DialogHeader>
              {selectedInquiry && selectedInquiry.dealer_id && selectedInquiry.dealers && (
                <DealerReviewForm
                  testDriveId={selectedInquiry.id}
                  dealerId={selectedInquiry.dealer_id}
                  dealerName={selectedInquiry.dealers.dealership_name}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Comparison History */}
          <Card className="gradient-card border-border/50 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
                Comparison History
              </CardTitle>
              <CardDescription>
                {comparisonHistory.length === 0 ? "No comparisons yet" : `${comparisonHistory.length} comparison(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : comparisonHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven't compared any cars yet.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/cars")}>
                    Explore Cars
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {comparisonHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {item.car_names.join(" vs ")}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReopenComparison(item.car_ids)}
                          className="gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Re-open
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFromHistory(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wishlist */}
          <Card className="gradient-card border-border/50 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Your Wishlist
              </CardTitle>
              <CardDescription>
                {favoriteCars.length === 0 ? "No cars in wishlist" : `${favoriteCars.length} car(s) saved`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteCars.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven't added any cars to your wishlist yet.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/cars")}>
                    Explore Cars
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {favoriteCars.map((car) => (
                    <div
                      key={car.id}
                      onClick={() => navigate(`/car/${car.id}`)}
                      className="p-4 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-semibold text-foreground text-sm">{car.name}</h4>
                      <p className="text-primary font-bold">{formatPrice(car.price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;