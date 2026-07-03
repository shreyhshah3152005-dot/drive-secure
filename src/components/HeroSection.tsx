import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Award, Headphones, Sparkles, Car, ShoppingBag } from "lucide-react";
import heroBmw from "@/assets/hero-bmw-m5.jpg";
import heroVideo from "@/assets/hero-drift.mp4.asset.json";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Cinematic live wallpaper — drifting Toyota footage */}
      <div className="absolute inset-0 hero-video-scene">
        {/* Poster fallback (shown until video is ready) */}
        <div
          className="absolute inset-0 bg-center bg-cover hero-video-poster"
          style={{ backgroundImage: `url(${heroBmw})` }}
          aria-hidden="true"
        />

        {/* Looping background video */}
        <video
          className="hero-video absolute inset-0 h-full w-full object-cover"
          src={heroVideo.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={heroBmw}
          aria-hidden="true"
        />

        {/* Cinematic tint — deep charcoal wash to keep text readable in both themes */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,10,12,0.72) 0%, rgba(15,15,18,0.55) 45%, rgba(20,20,24,0.35) 75%, rgba(10,10,12,0.60) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Warm rim light + subtle red brand flare */}
        <div className="hero-warm-light absolute" aria-hidden="true" />
        <div className="hero-lens-flare absolute" aria-hidden="true" />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center md:text-left md:ml-0">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/50 text-primary bg-black/50 backdrop-blur-md shadow-sm">
              <Sparkles className="w-4 h-4" />
              Premium Automotive Marketplace
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]"
            style={{ animationDelay: "100ms" }}
          >
            Your Dream Car{" "}
            <span className="text-gradient-primary">Awaits</span>
          </h1>

          <p
            className="text-xl text-white/90 mb-10 max-w-2xl md:mx-0 mx-auto animate-slide-up font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
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
            className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-lg md:mx-0 mx-auto animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            {[
              { Icon: Shield, label: "Certified Pre-Owned" },
              { Icon: Award, label: "Premium Quality" },
              { Icon: Headphones, label: "24/7 Support" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 shadow-lg"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm text-white/90 text-center font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
