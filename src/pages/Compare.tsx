import { useNavigate } from "react-router-dom";
import { useCompare } from "@/contexts/CompareContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare, X, Zap, Gauge, Fuel, Settings, Calendar, Star } from "lucide-react";

const formatPrice = (price: number): string => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString("en-IN")}`;
};

const Compare = () => {
  const navigate = useNavigate();
  const { selectedCars, removeFromCompare, clearCompare } = useCompare();

  if (selectedCars.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 flex items-center justify-center min-h-[70vh]">
          <div className="text-center px-4">
            <GitCompare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Select Cars to Compare
            </h1>
            <p className="text-muted-foreground mb-6">
              Please select at least 2 cars from the listings to compare
            </p>
            <Button onClick={() => navigate("/")} variant="hero">
              Browse Cars
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const specRows = [
    { label: "Price", icon: Star, getValue: (car: typeof selectedCars[0]) => formatPrice(car.price) },
    { label: "Year", icon: Calendar, getValue: (car: typeof selectedCars[0]) => car.year.toString() },
    { label: "Horsepower", icon: Zap, getValue: (car: typeof selectedCars[0]) => `${car.horsepower} hp` },
    { label: "Acceleration", icon: Gauge, getValue: (car: typeof selectedCars[0]) => car.acceleration },
    { label: "Top Speed", icon: Gauge, getValue: (car: typeof selectedCars[0]) => car.topSpeed },
    { label: "Fuel Type", icon: Fuel, getValue: (car: typeof selectedCars[0]) => car.fuelType },
    { label: "Transmission", icon: Settings, getValue: (car: typeof selectedCars[0]) => car.transmission },
    { label: "Category", icon: Star, getValue: (car: typeof selectedCars[0]) => car.category },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-primary" />
                  Compare Cars
                </h1>
                <p className="text-sm text-muted-foreground">
                  Comparing {selectedCars.length} vehicles
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={clearCompare}>
              Clear All
            </Button>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Car Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedCars.length}, 1fr)` }}>
                <div className="p-4" />
                {selectedCars.map((car) => (
                  <div
                    key={car.id}
                    className="gradient-card rounded-xl border border-border/50 p-4 relative"
                  >
                    <button
                      onClick={() => removeFromCompare(car.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-secondary hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <span className="px-2 py-1 text-xs font-semibold rounded-full gradient-gold text-primary-foreground">
                      {car.category}
                    </span>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mt-3">
                      {car.brand}
                    </p>
                    <h3 className="text-lg font-bold text-foreground">
                      {car.model}
                    </h3>
                    <p className="text-xl font-bold text-gradient-gold mt-2">
                      {formatPrice(car.price)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => navigate(`/car/${car.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>

              {/* Specification Rows */}
              <div className="mt-6 space-y-2">
                {specRows.map((spec, idx) => (
                  <div
                    key={idx}
                    className="grid gap-4 items-center"
                    style={{ gridTemplateColumns: `200px repeat(${selectedCars.length}, 1fr)` }}
                  >
                    <div className="flex items-center gap-2 p-4 bg-secondary/30 rounded-l-lg">
                      <spec.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {spec.label}
                      </span>
                    </div>
                    {selectedCars.map((car, carIdx) => (
                      <div
                        key={car.id}
                        className={`p-4 bg-secondary/30 text-center ${
                          carIdx === selectedCars.length - 1 ? "rounded-r-lg" : ""
                        }`}
                      >
                        <span className="text-sm text-foreground font-medium">
                          {spec.getValue(car)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Features Comparison */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Features</h2>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `200px repeat(${selectedCars.length}, 1fr)` }}
                >
                  <div className="p-4 bg-secondary/30 rounded-l-lg">
                    <span className="text-sm font-medium text-foreground">
                      Key Features
                    </span>
                  </div>
                  {selectedCars.map((car, carIdx) => (
                    <div
                      key={car.id}
                      className={`p-4 bg-secondary/30 ${
                        carIdx === selectedCars.length - 1 ? "rounded-r-lg" : ""
                      }`}
                    >
                      <div className="space-y-2">
                        {car.features.map((feature, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dealers Comparison */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Available Dealers
                </h2>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `200px repeat(${selectedCars.length}, 1fr)` }}
                >
                  <div className="p-4 bg-secondary/30 rounded-l-lg">
                    <span className="text-sm font-medium text-foreground">
                      Dealer Locations
                    </span>
                  </div>
                  {selectedCars.map((car, carIdx) => (
                    <div
                      key={car.id}
                      className={`p-4 bg-secondary/30 ${
                        carIdx === selectedCars.length - 1 ? "rounded-r-lg" : ""
                      }`}
                    >
                      <div className="space-y-2">
                        {car.dealers.map((dealer, dIdx) => (
                          <div key={dIdx} className="text-sm text-muted-foreground">
                            {dealer.city}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
