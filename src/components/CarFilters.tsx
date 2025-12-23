import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface CarFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  selectedFuelType: string;
  onFuelTypeChange: (value: string) => void;
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
  brands: string[];
  fuelTypes: string[];
  onClearFilters: () => void;
}

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-1500000", label: "Under ₹15 Lakh" },
  { value: "1500000-2500000", label: "₹15 - ₹25 Lakh" },
  { value: "2500000-5000000", label: "₹25 - ₹50 Lakh" },
  { value: "5000000-10000000", label: "₹50 Lakh - ₹1 Cr" },
  { value: "10000000-999999999", label: "Above ₹1 Cr" },
];

const CarFilters = ({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedFuelType,
  onFuelTypeChange,
  priceRange,
  onPriceRangeChange,
  brands,
  fuelTypes,
  onClearFilters,
}: CarFiltersProps) => {
  const hasActiveFilters = searchQuery || selectedBrand !== "all" || selectedFuelType !== "all" || priceRange !== "all";

  return (
    <div className="space-y-4 p-4 rounded-xl gradient-card border border-border/50">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cars by name, brand, or model..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>

        {/* Brand Filter */}
        <Select value={selectedBrand} onValueChange={onBrandChange}>
          <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-border">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fuel Type Filter */}
        <Select value={selectedFuelType} onValueChange={onFuelTypeChange}>
          <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-border">
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuel Types</SelectItem>
            {fuelTypes.map((fuel) => (
              <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range Filter */}
        <Select value={priceRange} onValueChange={onPriceRangeChange}>
          <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-border">
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default CarFilters;