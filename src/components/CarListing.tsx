import { useState } from "react";
import { cars } from "@/data/cars";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";

const categories = ["All", "Sports", "Supercar", "SUV", "Electric", "Off-Road", "Gran Turismo", "Grand Tourer"];

const CarListing = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredCars = activeCategory === "All" 
    ? cars 
    : cars.filter(car => car.category === activeCategory);

  return (
    <section className="py-24 bg-background" id="collection">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10">
            Our Collection
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Featured <span className="text-gradient-gold">Vehicles</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our handpicked selection of premium automobiles, each representing 
            the pinnacle of automotive engineering and design.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Car grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCars.map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </div>

        {filteredCars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No vehicles found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CarListing;
