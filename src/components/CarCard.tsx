import { Car } from "@/data/cars";
import { Fuel, Gauge, Zap } from "lucide-react";

interface CarCardProps {
  car: Car;
  index: number;
}

const CarCard = ({ car, index }: CarCardProps) => {
  return (
    <div
      className="group gradient-card rounded-2xl overflow-hidden border border-border/50 shadow-card hover:border-primary/30 transition-all duration-500 hover:-translate-y-2"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full gradient-gold text-primary-foreground">
            {car.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-card/80 backdrop-blur-sm text-foreground border border-border/50">
            {car.year}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
            {car.brand}
          </p>
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {car.model}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {car.description}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
            <Zap className="w-4 h-4 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Power</span>
            <span className="text-sm font-semibold text-foreground">{car.horsepower}hp</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
            <Gauge className="w-4 h-4 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">0-60</span>
            <span className="text-sm font-semibold text-foreground">{car.acceleration.replace(" (0-60)", "")}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
            <Fuel className="w-4 h-4 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Fuel</span>
            <span className="text-sm font-semibold text-foreground">{car.fuelType}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Starting at</p>
            <p className="text-2xl font-bold text-gradient-gold">
              ${car.price.toLocaleString()}
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
