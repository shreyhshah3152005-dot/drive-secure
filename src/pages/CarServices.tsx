import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Shield, Crown, Star, Droplets, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ServiceBookingDialog from "@/components/ServiceBookingDialog";

interface ServicePackage {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: number;
  duration: string;
  services: number;
  washes: number;
  features: string[];
  popular?: boolean;
  color: string;
}

const packages: ServicePackage[] = [
  {
    id: "basic",
    name: "Basic Care",
    icon: <Droplets className="w-8 h-8" />,
    price: 999,
    duration: "6 Months",
    services: 1,
    washes: 2,
    features: [
      "1 Full Car Service",
      "2 Exterior Washes",
      "Tire Pressure Check",
      "Fluid Top-up",
      "Basic Interior Dusting",
    ],
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "standard",
    name: "Standard Shield",
    icon: <Shield className="w-8 h-8" />,
    price: 2000,
    duration: "1 Year",
    services: 2,
    washes: 3,
    features: [
      "2 Full Car Services",
      "3 Premium Washes (Interior + Exterior)",
      "Engine Oil Change",
      "Brake Inspection",
      "AC Filter Cleaning",
      "Battery Health Check",
    ],
    popular: true,
    color: "from-primary/20 to-emerald-500/20",
  },
  {
    id: "premium",
    name: "Premium Pro",
    icon: <Crown className="w-8 h-8" />,
    price: 3500,
    duration: "1 Year",
    services: 3,
    washes: 6,
    features: [
      "3 Full Car Services",
      "6 Premium Washes",
      "Complete Engine Tune-up",
      "Wheel Alignment & Balancing",
      "AC Gas Refill",
      "Ceramic Coating (1 session)",
      "Priority Scheduling",
    ],
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "ultimate",
    name: "Ultimate Luxe",
    icon: <Sparkles className="w-8 h-8" />,
    price: 5999,
    duration: "1 Year",
    services: 4,
    washes: 12,
    features: [
      "4 Full Car Services",
      "12 Premium Washes (Monthly)",
      "Complete Engine Overhaul Check",
      "Underbody Anti-Rust Coating",
      "Full Interior Deep Cleaning",
      "Ceramic Coating (2 sessions)",
      "Roadside Assistance (1 Year)",
      "Free Pickup & Drop",
      "Dedicated Service Manager",
    ],
    color: "from-purple-500/20 to-pink-500/20",
  },
];

const CarServices = () => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleSubscribe = (pkg: ServicePackage) => {
    if (!user) {
      toast.error("Please sign in to subscribe to a package");
      return;
    }
    setSelectedPackage(pkg.id);
    toast.success(`You've selected the ${pkg.name} package! Our team will contact you shortly.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            <Wrench className="w-4 h-4 mr-2" />
            Car Care Packages
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your Car <span className="text-gradient-primary">Serviced & Washed</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our curated car care packages. Professional servicing, premium washes, and complete maintenance — all at unbeatable prices.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 ${
                pkg.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
              } ${selectedPackage === pkg.id ? "ring-2 ring-primary" : ""}`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" /> Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center mx-auto mb-3 text-primary`}>
                  {pkg.icon}
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{pkg.duration}</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">₹{pkg.price.toLocaleString("en-IN")}</span>
                  <span className="text-muted-foreground text-sm">/{pkg.duration.toLowerCase()}</span>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{pkg.services}</div>
                    <div className="text-xs text-muted-foreground">Services</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{pkg.washes}</div>
                    <div className="text-xs text-muted-foreground">Washes</div>
                  </div>
                </div>

                <ul className="space-y-2 text-left mb-6">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <ServiceBookingDialog
                  packageId={pkg.id}
                  packageName={pkg.name}
                  packagePrice={pkg.price}
                  packageDurationMonths={pkg.duration === "6 Months" ? 6 : 12}
                  totalServices={pkg.services}
                  totalWashes={pkg.washes}
                  trigger={
                    <Button
                      variant={pkg.popular ? "hero" : "outline"}
                      className="w-full"
                    >
                      Book Now
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Section */}
        <div className="bg-card border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Why Choose <span className="text-gradient-primary">CARBAZAAR</span> Services?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Certified Mechanics</h3>
              <p className="text-sm text-muted-foreground">All our technicians are trained and certified professionals</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Genuine Parts</h3>
              <p className="text-sm text-muted-foreground">We use only OEM-approved genuine spare parts</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Satisfaction Guaranteed</h3>
              <p className="text-sm text-muted-foreground">100% satisfaction guarantee or your money back</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarServices;
