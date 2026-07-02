import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Award, Headphones, Sparkles, Car, ShoppingBag } from "lucide-react";
import heroBmw from "@/assets/hero-bmw-m5.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Cinematic BMW M5 live wallpaper background */}
      <div className="absolute inset-0 hero-bmw-scene">
        <div
          className="hero-bmw-image absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${heroBmw})` }}
          aria-hidden="true"
        />
        {/* Fog drift */}
        <div className="hero-fog absolute inset-0" aria-hidden="true" />
        {/* Distant moving city lights */}
        <div className="hero-city-lights absolute inset-x-0 top-[30%] h-24 opacity-60" aria-hidden="true" />
        {/* Rain */}
        <div className="hero-rain absolute inset-0" aria-hidden="true" />
        {/* Floating dust particles */}
        <div className="hero-dust absolute inset-0" aria-hidden="true" />
        {/* Headlight pulse glow */}
        <div className="hero-headlight-glow absolute" aria-hidden="true" />
        {/* Lens flare */}
        <div className="hero-lens-flare absolute" aria-hidden="true" />
        {/* Vignette + readability overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0.35) 100%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center md:text-left md:ml-0">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/40 text-primary bg-black/40 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Premium Automotive Marketplace
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up text-white"
            style={{ animationDelay: "100ms" }}
          >
            Your Dream Car{" "}
            <span className="text-gradient-primary">Awaits</span>
          </h1>

          <p
            className="text-xl text-white/85 mb-10 max-w-2xl md:mx-0 mx-auto animate-slide-up"
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
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm text-white/80 text-center">Certified Pre-Owned</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
              <Award className="w-6 h-6 text-primary" />
              <span className="text-sm text-white/80 text-center">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
              <Headphones className="w-6 h-6 text-primary" />
              <span className="text-sm text-white/80 text-center">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
