import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DealerRatingBadge from "@/components/DealerRatingBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, MapPin, Phone, Car, Star, ArrowLeft, 
  CheckCircle2, XCircle, Building2, Calendar
} from "lucide-react";

interface DealerData {
  id: string;
  dealership_name: string;
  city: string;
  address: string | null;
  phone: string | null;
  profile_image_url: string | null;
  subscription_plan: string;
  created_at: string;
}

interface DealerWithStats extends DealerData {
  carCount: number;
  categories: string[];
  avgRating: number;
  reviewCount: number;
}

const CompareDealersDetail = () => {
  const [searchParams] = useSearchParams();
  const [dealers, setDealers] = useState<DealerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const dealerIds = searchParams.get("dealers")?.split(",") || [];

  useEffect(() => {
    const fetchDealersData = async () => {
      if (dealerIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch dealer info
        const { data: dealersData, error } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, address, phone, profile_image_url, subscription_plan, created_at")
          .in("id", dealerIds)
          .eq("is_active", true);

        if (error) throw error;

        if (!dealersData || dealersData.length === 0) {
          setDealers([]);
          setLoading(false);
          return;
        }

        // Fetch additional stats for each dealer
        const dealersWithStats: DealerWithStats[] = await Promise.all(
          dealersData.map(async (dealer) => {
            // Get car count and categories
            const { data: cars, count } = await supabase
              .from("dealer_cars")
              .select("category", { count: "exact" })
              .eq("dealer_id", dealer.id)
              .eq("is_active", true);

            const categories = cars ? [...new Set(cars.map(c => c.category))] : [];

            // Get reviews
            const { data: reviews } = await supabase
              .from("dealer_reviews")
              .select("rating")
              .eq("dealer_id", dealer.id);

            const reviewCount = reviews?.length || 0;
            const avgRating = reviewCount > 0 
              ? reviews!.reduce((acc, r) => acc + r.rating, 0) / reviewCount 
              : 0;

            return {
              ...dealer,
              carCount: count || 0,
              categories,
              avgRating,
              reviewCount,
            };
          })
        );

        setDealers(dealersWithStats);
      } catch (error) {
        console.error("Error fetching dealers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealersData();
  }, [dealerIds.join(",")]);

  const getBestValue = (values: number[], higherIsBetter = true) => {
    if (values.length === 0) return -1;
    const validValues = values.filter(v => v > 0);
    if (validValues.length === 0) return -1;
    return higherIsBetter ? Math.max(...validValues) : Math.min(...validValues);
  };

  const ratings = dealers.map(d => d.avgRating);
  const carCounts = dealers.map(d => d.carCount);
  const bestRating = getBestValue(ratings);
  const bestCarCount = getBestValue(carCounts);

  const allCategories = [...new Set(dealers.flatMap(d => d.categories))].sort();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dealers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Compare <span className="text-gradient-gold">Dealers</span>
            </h1>
            <p className="text-muted-foreground">
              Side-by-side comparison of {dealers.length} dealers
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : dealers.length < 2 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Not enough dealers to compare</h3>
            <p className="text-muted-foreground mb-4">
              Please select at least 2 dealers to compare
            </p>
            <Link to="/dealers">
              <Button>Browse Dealers</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dealer Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${dealers.length}, 1fr)` }}>
              {dealers.map((dealer) => (
                <Card key={dealer.id} className="text-center">
                  <CardHeader className="pb-2">
                    <div className="w-20 h-20 mx-auto rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden mb-3">
                      {dealer.profile_image_url ? (
                        <img
                          src={dealer.profile_image_url}
                          alt={dealer.dealership_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-10 h-10 text-primary" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{dealer.dealership_name}</CardTitle>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {dealer.city}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/dealer/${dealer.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dealer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody className="divide-y">
                      {/* Rating */}
                      <tr className="hover:bg-muted/50">
                        <td className="p-4 font-medium text-muted-foreground w-40">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Rating
                          </div>
                        </td>
                        {dealers.map((dealer) => (
                          <td key={dealer.id} className="p-4 text-center">
                            <div className={`inline-flex items-center gap-2 ${dealer.avgRating === bestRating && bestRating > 0 ? "text-primary font-semibold" : ""}`}>
                              <DealerRatingBadge dealerId={dealer.id} showCount />
                              {dealer.avgRating === bestRating && bestRating > 0 && (
                                <Badge variant="default" className="bg-green-500">Best</Badge>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Car Count */}
                      <tr className="hover:bg-muted/50">
                        <td className="p-4 font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            Cars Listed
                          </div>
                        </td>
                        {dealers.map((dealer) => (
                          <td key={dealer.id} className="p-4 text-center">
                            <div className={`inline-flex items-center gap-2 ${dealer.carCount === bestCarCount && bestCarCount > 0 ? "text-primary font-semibold" : ""}`}>
                              <span className="text-lg">{dealer.carCount}</span>
                              {dealer.carCount === bestCarCount && bestCarCount > 0 && (
                                <Badge variant="default" className="bg-green-500">Most</Badge>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Phone */}
                      <tr className="hover:bg-muted/50">
                        <td className="p-4 font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact
                          </div>
                        </td>
                        {dealers.map((dealer) => (
                          <td key={dealer.id} className="p-4 text-center">
                            {dealer.phone || <span className="text-muted-foreground">-</span>}
                          </td>
                        ))}
                      </tr>

                      {/* Address */}
                      <tr className="hover:bg-muted/50">
                        <td className="p-4 font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Address
                          </div>
                        </td>
                        {dealers.map((dealer) => (
                          <td key={dealer.id} className="p-4 text-center text-sm">
                            {dealer.address || <span className="text-muted-foreground">-</span>}
                          </td>
                        ))}
                      </tr>

                      {/* Member Since */}
                      <tr className="hover:bg-muted/50">
                        <td className="p-4 font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Member Since
                          </div>
                        </td>
                        {dealers.map((dealer) => (
                          <td key={dealer.id} className="p-4 text-center">
                            {formatDate(dealer.created_at)}
                          </td>
                        ))}
                      </tr>

                      {/* Subscription */}
                      <tr className="hover:bg-muted/50">
                        <td className="p-4 font-medium text-muted-foreground">
                          Subscription
                        </td>
                        {dealers.map((dealer) => (
                          <td key={dealer.id} className="p-4 text-center">
                            <Badge variant={dealer.subscription_plan === "premium" ? "default" : "secondary"}>
                              {dealer.subscription_plan.charAt(0).toUpperCase() + dealer.subscription_plan.slice(1)}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Categories Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Car Categories Available
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody className="divide-y">
                      {allCategories.map((category) => (
                        <tr key={category} className="hover:bg-muted/50">
                          <td className="p-4 font-medium text-muted-foreground w-40">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </td>
                          {dealers.map((dealer) => (
                            <td key={dealer.id} className="p-4 text-center">
                              {dealer.categories.includes(category) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {allCategories.length === 0 && (
                        <tr>
                          <td colSpan={dealers.length + 1} className="p-8 text-center text-muted-foreground">
                            No categories available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CompareDealersDetail;
