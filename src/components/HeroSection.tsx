import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Award, Headphones, Sparkles, Car, ShoppingBag } from "lucide-react";
import heroBmw from "@/assets/hero-bmw-m5.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Cinematic BMW M5 live wallpaper — nardo grey daylight */}
      <div className="absolute inset-0 hero-bmw-scene">
        {/* Car — subtle suspension bob + slow parallax */}
        <div
          className="hero-bmw-image absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${heroBmw})` }}
          aria-hidden="true"
        />

        {/* Speed streaks flying past — creates driving-past sensation */}
        <div className="hero-speed-streaks absolute inset-0" aria-hidden="true" />
        <div className="hero-speed-streaks hero-speed-streaks--slow absolute inset-0" aria-hidden="true" />

        {/* Road blur strip at bottom for motion cue */}
        <div className="hero-road-blur absolute inset-x-0 bottom-0 h-40" aria-hidden="true" />

        {/* Nardo grey wash + soft daylight — replaces dark night mood */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(166,166,166,0.55) 0%, rgba(184,185,187,0.35) 45%, rgba(210,211,213,0.20) 75%, rgba(166,166,166,0.35) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Warm rim light + subtle red flare */}
        <div className="hero-warm-light absolute" aria-hidden="true" />
        <div className="hero-lens-flare absolute" aria-hidden="true" />

        {/* Gentle vignette (lighter than before) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(60,60,65,0.35) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center md:text-left md:ml-0">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/50 text-primary bg-nardo/70 backdrop-blur-md shadow-sm">
              <Sparkles className="w-4 h-4" />
              Premium Automotive Marketplace
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up text-foreground drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]"
            style={{ animationDelay: "100ms" }}
          >
            Your Dream Car{" "}
            <span className="text-gradient-primary">Awaits</span>
          </h1>

          <p
            className="text-xl text-foreground/85 mb-10 max-w-2xl md:mx-0 mx-auto animate-slide-up font-medium"
            style={{ animationDelay: "200ms" }}
          >
            Discover India's trusted collection of the finest automobiles. From reliable family cars to luxury SUVs, find your perfect ride today with us.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 md:justify-start justify-center animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <Button variant="hero" size="xl" onClick={() => navigate("/cars")} className="shadow-primary">
              <Car className="w-5 h-5 mr-2" />
              New Cars
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl" onClick={() => navigate("/used-cars")}>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Second Hand Cars
            </Button>
          </div>

          {/* Trust badges */}
          <div
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg md:mx-0 mx-auto animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-nardo/70 backdrop-blur-md border border-white/40 shadow-sm">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm text-foreground/80 text-center font-medium">Certified Pre-Owned</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-nardo/70 backdrop-blur-md border border-white/40 shadow-sm">
              <Award className="w-6 h-6 text-primary" />
              <span className="text-sm text-foreground/80 text-center font-medium">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-nardo/70 backdrop-blur-md border border-white/40 shadow-sm">
              <Headphones className="w-6 h-6 text-primary" />
              <span className="text-sm text-foreground/80 text-center font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
