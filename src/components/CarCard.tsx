import { Car } from "@/data/cars";
import { Fuel, Gauge, Zap, MapPin, GitCompare, Check, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompare } from "@/contexts/CompareContext";
import { useFavorites } from "@/hooks/useFavorites";

interface CarCardProps {
  car: Car;
  index: number;
}

const formatPrice = (price: number): string => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
};

const CarCard = ({ car, index }: CarCardProps) => {
  const [showDealers, setShowDealers] = useState(false);
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare, selectedCars, maxCars } = useCompare();
  const { isFavorite, toggleFavorite } = useFavorites();

  const inCompare = isInCompare(car.id);
  const inFavorites = isFavorite(car.id);

  const handleCardClick = () => {
    navigate(`/car/${car.id}`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(car.id);
    } else {
      addToCompare(car);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(car.id);
  };

  return (
    <div
      className="group gradient-card rounded-2xl overflow-hidden border border-border/50 shadow-card hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleCardClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-semibold rounded-full gradient-gold text-primary-foreground">
            {car.category}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-full backdrop-blur-sm border transition-all duration-300 ${
              inFavorites
                ? "bg-red-500 text-white border-red-500"
                : "bg-card/80 text-foreground border-border/50 hover:border-red-400 hover:text-red-400"
            }`}
            title={inFavorites ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${inFavorites ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={handleCompareClick}
            disabled={!inCompare && selectedCars.length >= maxCars}
            className={`p-1.5 rounded-full backdrop-blur-sm border transition-all duration-300 ${
              inCompare
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/80 text-foreground border-border/50 hover:border-primary hover:text-primary"
            } ${!inCompare && selectedCars.length >= maxCars ? "opacity-50 cursor-not-allowed" : ""}`}
            title={inCompare ? "Remove from compare" : "Add to compare"}
          >
            {inCompare ? <Check className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
          </button>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-card/80 backdrop-blur-sm text-foreground border border-border/50">
            {car.year}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">
            {car.brand}
          </p>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {car.model}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-1.5 rounded-lg bg-secondary/50">
            <Zap className="w-3 h-3 text-primary mb-0.5" />
            <span className="text-[10px] text-muted-foreground">Power</span>
            <span className="text-xs font-semibold text-foreground">{car.horsepower}hp</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-lg bg-secondary/50">
            <Gauge className="w-3 h-3 text-primary mb-0.5" />
            <span className="text-[10px] text-muted-foreground">0-100</span>
            <span className="text-xs font-semibold text-foreground">{car.acceleration.split('s')[0]}s</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-lg bg-secondary/50">
            <Fuel className="w-3 h-3 text-primary mb-0.5" />
            <span className="text-[10px] text-muted-foreground">Type</span>
            <span className="text-xs font-semibold text-foreground">{car.fuelType}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <p className="text-[10px] text-muted-foreground">Starting at</p>
            <p className="text-xl font-bold text-gradient-gold">
              {formatPrice(car.price)}
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDealers(!showDealers);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <MapPin className="w-3 h-3" />
            Dealers ({car.dealers.length})
          </button>
        </div>

        {showDealers && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-fade-in">
            <p className="text-xs font-semibold text-foreground">Available Dealers:</p>
            {car.dealers.map((dealer, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-secondary/50 text-xs">
                <p className="font-medium text-foreground">{dealer.name}</p>
                <p className="text-muted-foreground">{dealer.city} • {dealer.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarCard;
