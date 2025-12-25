import { useState, useEffect } from "react";
import { dealers, Dealer } from "@/data/dealers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DealersSection = () => {
  const { user } = useAuth();
  const [userCity, setUserCity] = useState<string | null>(null);
  const [sortedDealers, setSortedDealers] = useState<Dealer[]>(dealers);

  useEffect(() => {
    const fetchUserCity = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("city")
        .eq("user_id", user.id)
        .single();
      
      if (data?.city) {
        setUserCity(data.city);
      }
    };

    fetchUserCity();
  }, [user]);

  useEffect(() => {
    if (userCity) {
      const normalizedUserCity = userCity.toLowerCase().trim();
      
      const sorted = [...dealers].sort((a, b) => {
        const aMatches = a.city.toLowerCase().includes(normalizedUserCity) || 
                         normalizedUserCity.includes(a.city.toLowerCase());
        const bMatches = b.city.toLowerCase().includes(normalizedUserCity) || 
                         normalizedUserCity.includes(b.city.toLowerCase());
        
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return b.rating - a.rating;
      });
      
      setSortedDealers(sorted);
    } else {
      setSortedDealers([...dealers].sort((a, b) => b.rating - a.rating));
    }
  }, [userCity]);

  const matchingDealers = userCity 
    ? sortedDealers.filter(d => 
        d.city.toLowerCase().includes(userCity.toLowerCase()) ||
        userCity.toLowerCase().includes(d.city.toLowerCase())
      )
    : [];

  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-gradient-primary">Trusted Dealers</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with our network of premium car dealers across India
          </p>
          {userCity && matchingDealers.length > 0 && (
            <Badge variant="outline" className="mt-4 border-primary text-primary">
              <MapPin className="w-3 h-3 mr-1" />
              Showing dealers near {userCity} first
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDealers.slice(0, 6).map((dealer, index) => {
            const isNearUser = userCity && (
              dealer.city.toLowerCase().includes(userCity.toLowerCase()) ||
              userCity.toLowerCase().includes(dealer.city.toLowerCase())
            );
            
            return (
              <Card 
                key={dealer.id} 
                className={`group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 ${
                  isNearUser ? 'ring-2 ring-primary/30' : ''
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dealer.image}
                    alt={dealer.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {isNearUser && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      Near You
                    </Badge>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-sm font-medium">{dealer.rating}</span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold mb-2">{dealer.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    {dealer.address}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dealer.specialization.map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <a 
                      href={`tel:${dealer.phone}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                    <a 
                      href={`mailto:${dealer.email}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DealersSection;