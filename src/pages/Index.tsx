import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedDealers from "@/components/FeaturedDealers";
import Footer from "@/components/Footer";
import AICarRecommendations from "@/components/AICarRecommendations";
import RecentlyViewedCars from "@/components/RecentlyViewedCars";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ShoppingBag, Trophy, Calculator, ChevronRight, Wrench } from "lucide-react";
import wallpaperRed from "@/assets/wallpaper-red-car.jpg";
import wallpaperBlack from "@/assets/wallpaper-black-suv.jpg";
import wallpaperWhite from "@/assets/wallpaper-white-supercar.jpg";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Live Car Wallpapers */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Live <span className="text-gradient-primary">Showcase</span></h2>
            <p className="text-muted-foreground">Cinematic looks at the machines turning heads right now</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { src: wallpaperRed, title: "Midnight Rush", tag: "Sports" },
              { src: wallpaperBlack, title: "Obsidian Prestige", tag: "Luxury SUV" },
              { src: wallpaperWhite, title: "Storm Chaser", tag: "Supercar" },
            ].map((w) => (
              <div
                key={w.title}
                className="group relative overflow-hidden rounded-2xl border border-border shadow-card aspect-[4/3]"
              >
                <img
                  src={w.src}
                  alt={`${w.title} car wallpaper`}
                  width={1920}
                  height={1088}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block text-[11px] uppercase tracking-widest text-primary font-semibold mb-1">
                    {w.tag}
                  </span>
                  <h3 className="text-xl font-bold text-white">{w.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Browse by <span className="text-gradient-primary">Category</span></h2>
            <p className="text-muted-foreground">Choose between brand new cars or quality pre-owned vehicles</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link to="/cars">
              <Card className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
                <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Car className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">New Cars</h3>
                    <p className="text-sm text-muted-foreground">Explore the latest models from top Indian & global brands</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 mt-2">Browse <ChevronRight className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            </Link>
            <Link to="/used-cars">
              <Card className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
                <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Second Hand Cars</h3>
                    <p className="text-sm text-muted-foreground">Quality pre-owned cars from verified dealers near you</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 mt-2">Browse <ChevronRight className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/dealer-leaderboard">
              <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                <Trophy className="w-4 h-4" /> Dealer Leaderboard
              </Button>
            </Link>
            <Link to="/finance-calculator">
              <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                <Calculator className="w-4 h-4" /> EMI Calculator
              </Button>
            </Link>
            <Link to="/car-services">
              <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                <Wrench className="w-4 h-4" /> Car Service & Wash
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <RecentlyViewedCars />

      <div className="container mx-auto px-4 py-8">
        <AICarRecommendations />
      </div>
      <FeaturedDealers />
      <Footer />
    </div>
  );
};

export default Index;