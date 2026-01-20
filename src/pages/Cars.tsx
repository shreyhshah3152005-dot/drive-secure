import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import CarCard from "@/components/CarCard";
import CarFilters from "@/components/CarFilters";
import Footer from "@/components/Footer";
import SavedSearches from "@/components/SavedSearches";
import TradeInCalculator from "@/components/TradeInCalculator";
import LoanPreapproval from "@/components/LoanPreapproval";
import { cars } from "@/data/cars";

const Cars = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedFuelType, setSelectedFuelType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  // Get unique brands and fuel types for filter options
  const brands = useMemo(() => [...new Set(cars.map((car) => car.brand))].sort(), []);
  const fuelTypes = useMemo(() => [...new Set(cars.map((car) => car.fuelType))].sort(), []);

  // Filter cars based on all criteria
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        car.name.toLowerCase().includes(searchLower) ||
        car.brand.toLowerCase().includes(searchLower) ||
        car.model.toLowerCase().includes(searchLower);

      // Brand filter
      const matchesBrand = selectedBrand === "all" || car.brand === selectedBrand;

      // Fuel type filter
      const matchesFuel = selectedFuelType === "all" || car.fuelType === selectedFuelType;

      // Price range filter
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = car.price >= min && car.price <= max;
      }

      return matchesSearch && matchesBrand && matchesFuel && matchesPrice;
    });
  }, [searchQuery, selectedBrand, selectedFuelType, priceRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setSelectedFuelType("all");
    setPriceRange("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Our Collection</h1>
              <p className="text-muted-foreground">Explore our curated selection of premium automobiles</p>
            </div>
            <div className="flex gap-2">
              <TradeInCalculator />
              <LoanPreapproval />
            </div>
          </div>

          {/* Saved Searches Section */}
          <div className="mb-8">
            <SavedSearches />
          </div>

          <CarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            selectedFuelType={selectedFuelType}
            onFuelTypeChange={setSelectedFuelType}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            brands={brands}
            fuelTypes={fuelTypes}
            onClearFilters={clearFilters}
          />

          {/* Results count */}
          <p className="text-muted-foreground mt-6 mb-4">
            {filteredCars.length} {filteredCars.length === 1 ? "car" : "cars"} found
          </p>

          {/* Car grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car, index) => (
              <CarCard key={car.id} car={car} index={index} />
            ))}
          </div>

          {filteredCars.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No vehicles match your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cars;