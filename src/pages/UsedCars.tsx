import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search, X, Car, Fuel, Settings2, Users } from "lucide-react";

interface UsedCar {
  id: string;
  name: string;
  brand: string;
  category: string;
  fuel_type: string;
  transmission: string;
  price: number;
  image_url: string | null;
  seating_capacity: number;
  mileage: string | null;
  dealer_id: string;
  dealers?: { dealership_name: string; city: string } | null;
}

const formatPrice = (price: number) => {
  if (price >= 100) return `₹${(price / 100).toFixed(2)} Cr`;
  return `₹${price.toFixed(2)} L`;
};

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-5", label: "Under ₹5 Lakh" },
  { value: "5-10", label: "₹5 - ₹10 Lakh" },
  { value: "10-20", label: "₹10 - ₹20 Lakh" },
  { value: "20-50", label: "₹20 - ₹50 Lakh" },
  { value: "50-999", label: "Above ₹50 Lakh" },
];

const UsedCars = () => {
  const [cars, setCars] = useState<UsedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedFuelType, setSelectedFuelType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  useEffect(() => {
    const fetchCars = async () => {
      const { data, error } = await supabase
        .from("dealer_cars")
        .select("id, name, brand, category, fuel_type, transmission, price, image_url, seating_capacity, mileage, dealer_id, dealers(dealership_name, city)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) setCars(data as unknown as UsedCar[]);
      setLoading(false);
    };
    fetchCars();
  }, []);

  const brands = useMemo(() => [...new Set(cars.map(c => c.brand))].sort(), [cars]);
  const fuelTypes = useMemo(() => [...new Set(cars.map(c => c.fuel_type))].sort(), [cars]);

  const filtered = useMemo(() => {
    return cars.filter(car => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || car.name.toLowerCase().includes(q) || car.brand.toLowerCase().includes(q);
      const matchesBrand = selectedBrand === "all" || car.brand === selectedBrand;
      const matchesFuel = selectedFuelType === "all" || car.fuel_type === selectedFuelType;
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = car.price >= min && car.price <= max;
      }
      return matchesSearch && matchesBrand && matchesFuel && matchesPrice;
    });
  }, [cars, searchQuery, selectedBrand, selectedFuelType, priceRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setSelectedFuelType("all");
    setPriceRange("all");
  };

  const hasFilters = searchQuery || selectedBrand !== "all" || selectedFuelType !== "all" || priceRange !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-foreground mb-2">Second Hand Cars</h1>
            <p className="text-muted-foreground">Quality pre-owned cars from verified dealers</p>
          </div>

          {/* Filters */}
          <div className="space-y-4 p-4 rounded-xl bg-card border border-border/50 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Fuel Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  {fuelTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Price" /></SelectTrigger>
                <SelectContent>
                  {priceRanges.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mb-4">
            {filtered.length} {filtered.length === 1 ? "car" : "cars"} found
          </p>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((car) => (
                <Link key={car.id} to={`/dealer-car/${car.id}`}>
                  <Card className="group hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer h-full">
                    <div className="aspect-[4/3] relative bg-muted overflow-hidden rounded-t-lg">
                      {car.image_url ? (
                        <img src={car.image_url} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 text-xs">{car.category}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{car.brand}</p>
                      <h3 className="font-semibold text-foreground mb-2 truncate">{car.name}</h3>
                      <p className="text-lg font-bold text-primary mb-3">{formatPrice(car.price)}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{car.fuel_type}</span>
                        <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" />{car.transmission}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{car.seating_capacity}</span>
                      </div>
                      {car.dealers && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {car.dealers.dealership_name} • {car.dealers.city}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Car className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">No cars match your filters.</p>
              <button onClick={clearFilters} className="mt-4 text-primary hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UsedCars;
