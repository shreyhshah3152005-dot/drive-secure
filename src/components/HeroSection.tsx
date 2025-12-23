import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Award, Headphones } from "lucide-react";
import GeneralTestDriveForm from "@/components/GeneralTestDriveForm";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 gradient-dark" />
      
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-semibold tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10">
              Premium Automotive Excellence
            </span>
          </div>

          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            Drive the{" "}
            <span className="text-gradient-gold">Extraordinary</span>
          </h1>

          <p 
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            Discover our curated collection of the world's finest automobiles. 
            From timeless classics to cutting-edge supercars, find your perfect machine.
          </p>

          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <Button variant="hero" size="xl" onClick={() => navigate("/cars")}>
              Explore Collection
              <ChevronRight className="w-5 h-5" />
            </Button>
            <GeneralTestDriveForm 
              trigger={
                <Button variant="glass" size="xl">
                  Book Test Drive
                </Button>
              }
            />
          </div>

          {/* Trust badges */}
          <div 
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Certified Pre-Owned</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Headphones className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
