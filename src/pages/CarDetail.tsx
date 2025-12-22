import { useParams, useNavigate } from "react-router-dom";
import { cars } from "@/data/cars";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarImageGallery from "@/components/CarImageGallery";
import CarSpecifications from "@/components/CarSpecifications";
import CarInquiryForm from "@/components/CarInquiryForm";
import EMICalculator from "@/components/EMICalculator";
import TestDriveForm from "@/components/TestDriveForm";
import { ArrowLeft, MapPin, Phone, Star, Shield, Zap, Gauge, Fuel, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatPrice = (price: number): string => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
};

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const car = cars.find((c) => c.id === id);

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Car not found</h1>
          <Button onClick={() => navigate("/")} variant="hero">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Back Button */}
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Listings
          </Button>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <CarImageGallery car={car} />

            {/* Car Info */}
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full gradient-gold text-primary-foreground">
                  {car.category}
                </span>
                <p className="text-primary font-semibold uppercase tracking-wider mt-4">
                  {car.brand}
                </p>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mt-1">
                  {car.model}
                </h1>
                <p className="text-muted-foreground mt-2">{car.year} Model</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gradient-gold">
                  {formatPrice(car.price)}
                </span>
                <span className="text-muted-foreground">onwards</span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {car.description}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="gradient-card p-4 rounded-xl border border-border/50 text-center">
                  <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Power</p>
                  <p className="font-bold text-foreground">{car.horsepower} hp</p>
                </div>
                <div className="gradient-card p-4 rounded-xl border border-border/50 text-center">
                  <Gauge className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">0-100 kmph</p>
                  <p className="font-bold text-foreground">{car.acceleration.split('s')[0]}s</p>
                </div>
                <div className="gradient-card p-4 rounded-xl border border-border/50 text-center">
                  <Fuel className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Fuel</p>
                  <p className="font-bold text-foreground">{car.fuelType}</p>
                </div>
                <div className="gradient-card p-4 rounded-xl border border-border/50 text-center">
                  <Settings className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Transmission</p>
                  <p className="font-bold text-foreground text-xs">{car.transmission.split(' ')[0]}</p>
                </div>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Key Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 text-sm rounded-full bg-secondary/50 text-foreground border border-border/50"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Safety Badge */}
              <div className="flex items-center gap-3 p-4 gradient-card rounded-xl border border-primary/30">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Safety First</p>
                  <p className="text-sm text-muted-foreground">
                    All our vehicles come with verified safety certifications
                  </p>
                </div>
              </div>

              {/* Test Drive Button */}
              <TestDriveForm car={car} />
            </div>
          </div>
        </section>

        {/* EMI Calculator Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <EMICalculator carPrice={car.price} />
          </div>
        </section>

        {/* Full Specifications */}
        <CarSpecifications car={car} />

        {/* Dealers Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Available Dealers
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {car.dealers.map((dealer, idx) => (
              <div
                key={idx}
                className="gradient-card p-5 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <h3 className="font-semibold text-foreground mb-2">{dealer.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  {dealer.city}
                </p>
                <p className="text-sm text-primary flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {dealer.phone}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Inquiry Form */}
        <CarInquiryForm car={car} />
      </main>

      <Footer />
    </div>
  );
};

export default CarDetail;
