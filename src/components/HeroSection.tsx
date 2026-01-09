import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Award, Headphones, Sparkles, Store, GitCompare } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 gradient-dark" />
      
      {/* Background effects - Modern teal glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[700px] h-[700px] bg-primary/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/12 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-2xl animate-pulse-glow" />
      </div>

      {/* Modern grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at center, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Premium Automotive Marketplace
            </span>
          </div>

          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            Your Dream Car{" "}
            <span className="text-gradient-primary">Awaits</span>
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
            <Button variant="hero" size="xl" onClick={() => navigate("/cars")} className="shadow-primary">
              Explore Collection
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl" onClick={() => navigate("/dealers")}>
              <Store className="w-5 h-5 mr-2" />
              Browse Dealers
            </Button>
          </div>

          <div 
            className="flex justify-center mt-4 animate-slide-up"
            style={{ animationDelay: "350ms" }}
          >
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate("/compare-dealers")}
              className="border-primary/30 hover:bg-primary/10"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Dealer Prices
            </Button>
          </div>

          {/* Trust badges - Modern style */}
          <div 
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground text-center">Certified Pre-Owned</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
              <Award className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground text-center">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
              <Headphones className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground text-center">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;