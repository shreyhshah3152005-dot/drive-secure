import { Car } from "@/data/cars";
import { 
  Gauge, 
  Fuel, 
  Settings, 
  Zap, 
  Calendar, 
  Car as CarIcon,
  Timer
} from "lucide-react";

interface CarSpecificationsProps {
  car: Car;
}

const CarSpecifications = ({ car }: CarSpecificationsProps) => {
  const specifications = [
    {
      category: "Performance",
      icon: Zap,
      specs: [
        { label: "Horsepower", value: `${car.horsepower} hp` },
        { label: "Acceleration (0-100 kmph)", value: car.acceleration },
        { label: "Top Speed", value: car.topSpeed },
      ],
    },
    {
      category: "Engine & Transmission",
      icon: Settings,
      specs: [
        { label: "Fuel Type", value: car.fuelType },
        { label: "Transmission", value: car.transmission },
        { label: "Mileage", value: car.mileage > 0 ? `${car.mileage} kmpl` : "N/A (Electric)" },
      ],
    },
    {
      category: "General",
      icon: CarIcon,
      specs: [
        { label: "Brand", value: car.brand },
        { label: "Model", value: car.model },
        { label: "Year", value: car.year.toString() },
        { label: "Category", value: car.category },
      ],
    },
  ];

  return (
    <section className="bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
          <Gauge className="w-6 h-6 text-primary" />
          Full Specifications
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specifications.map((section, idx) => (
            <div
              key={idx}
              className="gradient-card p-6 rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {section.category}
                </h3>
              </div>

              <div className="space-y-3">
                {section.specs.map((spec, specIdx) => (
                  <div
                    key={specIdx}
                    className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {spec.label}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            All Features
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {car.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 gradient-card rounded-lg border border-border/50"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CarSpecifications;
