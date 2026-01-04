import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Store, Search, Car } from "lucide-react";

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  address: string | null;
}

const Dealers = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [carCounts, setCarCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("id, dealership_name, city, phone, address")
          .eq("is_active", true)
          .order("dealership_name");

        if (error) throw error;
        setDealers(data || []);

        // Fetch car counts for each dealer
        if (data && data.length > 0) {
          const counts: Record<string, number> = {};
          for (const dealer of data) {
            const { count } = await supabase
              .from("dealer_cars")
              .select("*", { count: "exact", head: true })
              .eq("dealer_id", dealer.id)
              .eq("is_active", true);
            counts[dealer.id] = count || 0;
          }
          setCarCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching dealers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, []);

  const filteredDealers = dealers.filter(
    (dealer) =>
      dealer.dealership_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Browse our network of verified car dealers across India. Each dealer is vetted to ensure quality service and genuine vehicles.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by dealer name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
              <Link key={dealer.id} to={`/dealer/${dealer.id}`}>
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {dealer.dealership_name}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {dealer.city}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {carCounts[dealer.id] || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dealer.address && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {dealer.address}
                      </p>
                    )}
                    {dealer.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {dealer.phone}
                      </div>
                    )}
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      View Inventory
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dealers;
