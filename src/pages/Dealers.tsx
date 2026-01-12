import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DealerRatingBadge from "@/components/DealerRatingBadge";
import DealerCompareBar from "@/components/DealerCompareBar";
import DealerRecommendations from "@/components/DealerRecommendations";
import { useFavoriteDealers } from "@/hooks/useFavoriteDealers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Store, Search, Car, Filter, X, Star, Scale, Heart } from "lucide-react";

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  address: string | null;
  profile_image_url: string | null;
}

interface DealerWithStats extends Dealer {
  categories: string[];
  avgRating: number;
  reviewCount: number;
}

const Dealers = () => {
  const [dealers, setDealers] = useState<DealerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [carCounts, setCarCounts] = useState<Record<string, number>>({});
  const [compareDealers, setCompareDealers] = useState<DealerWithStats[]>([]);
  const { isFavorite, toggleFavorite } = useFavoriteDealers();

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, phone, address, profile_image_url")
          .eq("is_active", true)
          .order("dealership_name");

        if (error) throw error;
        
        // Fetch car counts, categories, and ratings for each dealer
        if (data && data.length > 0) {
          const counts: Record<string, number> = {};
          const dealersWithStats: DealerWithStats[] = [];

          for (const dealer of data) {
            // Get cars and categories
            const { data: cars, count } = await supabase
              .from("dealer_cars")
              .select("category", { count: "exact" })
              .eq("dealer_id", dealer.id)
              .eq("is_active", true);
            
            counts[dealer.id] = count || 0;
            
            // Get unique categories for this dealer
            const categories = cars ? [...new Set(cars.map(c => c.category))] : [];
            
            // Get reviews for rating
            const { data: reviews } = await supabase
              .from("dealer_reviews")
              .select("rating")
              .eq("dealer_id", dealer.id);
            
            const reviewCount = reviews?.length || 0;
            const avgRating = reviewCount > 0 
              ? reviews!.reduce((acc, r) => acc + r.rating, 0) / reviewCount 
              : 0;

            dealersWithStats.push({ ...dealer, categories, avgRating, reviewCount });
          }
          
          setCarCounts(counts);
          setDealers(dealersWithStats);
        } else {
          setDealers([]);
        }
      } catch (error) {
        console.error("Error fetching dealers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, []);

  // Get unique cities and categories for filters
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(dealers.map(d => d.city))];
    return uniqueCities.sort();
  }, [dealers]);

  const categories = useMemo(() => {
    const allCategories = dealers.flatMap(d => d.categories);
    const uniqueCategories = [...new Set(allCategories)];
    return uniqueCategories.sort();
  }, [dealers]);

  // Filter dealers based on search and filters
  const filteredDealers = useMemo(() => {
    return dealers.filter((dealer) => {
      const matchesSearch = 
        dealer.dealership_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dealer.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCity = selectedCity === "all" || dealer.city === selectedCity;
      
      const matchesCategory = selectedCategory === "all" || 
        dealer.categories.includes(selectedCategory);
      
      // Rating filter
      let matchesRating = true;
      if (selectedRating !== "all") {
        const minRating = parseFloat(selectedRating);
        matchesRating = dealer.avgRating >= minRating;
      }
      
      return matchesSearch && matchesCity && matchesCategory && matchesRating;
    });
  }, [dealers, searchQuery, selectedCity, selectedCategory, selectedRating]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedCategory("all");
    setSelectedRating("all");
  };

  const hasActiveFilters = searchQuery || selectedCity !== "all" || selectedCategory !== "all" || selectedRating !== "all";

  const toggleCompare = (dealer: DealerWithStats) => {
    setCompareDealers(prev => {
      const exists = prev.find(d => d.id === dealer.id);
      if (exists) {
        return prev.filter(d => d.id !== dealer.id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, dealer];
    });
  };

  const isInCompare = (dealerId: string) => {
    return compareDealers.some(d => d.id === dealerId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10">
            Our Partners
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted <span className="text-gradient-gold">Dealers</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse our network of verified car dealers across India. Save your favorites to get notified when they add new cars.
          </p>
        </div>

        {/* Dealer Recommendations */}
        <div className="max-w-4xl mx-auto mb-8">
          <DealerRecommendations limit={3} />

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by dealer name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
            
            {/* City Filter */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Car Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <SelectValue placeholder="Min Rating" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
          
          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredDealers.length} of {dealers.length} dealers
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredDealers.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No dealers found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : "No dealers are currently registered"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDealers.map((dealer) => (
              <Card key={dealer.id} className={`h-full transition-all hover:shadow-lg hover:shadow-primary/10 ${isInCompare(dealer.id) ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 aspect-[4/3] rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {dealer.profile_image_url ? (
                          <img 
                            src={dealer.profile_image_url} 
                            alt={dealer.dealership_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <Link to={`/dealer/${dealer.id}`}>
                          <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                            {dealer.dealership_name}
                          </CardTitle>
                        </Link>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {dealer.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <DealerRatingBadge dealerId={dealer.id} showCount />
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {carCounts[dealer.id] || 0}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dealer.address && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {dealer.address}
                    </p>
                  )}
                  {dealer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Phone className="w-4 h-4" />
                      {dealer.phone}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/dealer/${dealer.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Inventory
                      </Button>
                    </Link>
                    <Button
                      variant={isFavorite(dealer.id) ? "default" : "outline"}
                      size="icon"
                      onClick={() => toggleFavorite(dealer.id)}
                      title={isFavorite(dealer.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(dealer.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant={isInCompare(dealer.id) ? "default" : "outline"}
                      size="icon"
                      onClick={() => toggleCompare(dealer)}
                      disabled={!isInCompare(dealer.id) && compareDealers.length >= 4}
                      title={isInCompare(dealer.id) ? "Remove from compare" : "Add to compare"}
                    >
                      <Scale className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
      
      {/* Compare Bar */}
      <DealerCompareBar
        dealers={compareDealers}
        onRemove={(id) => setCompareDealers(prev => prev.filter(d => d.id !== id))}
        onClear={() => setCompareDealers([])}
      />
    </div>
  );
};

export default Dealers;
