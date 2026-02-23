import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedDealers from "@/components/FeaturedDealers";
import Footer from "@/components/Footer";
import AICarRecommendations from "@/components/AICarRecommendations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ShoppingBag, Trophy, Calculator, ChevronRight, GitCompare } from "lucide-react";

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
            <Card className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 h-full">
              <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Second Hand Cars</h3>
                  <p className="text-sm text-muted-foreground">Quality pre-owned cars from verified dealers near you</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Link to="/dealers">
                    <Button variant="outline" size="sm" className="gap-1">Browse <ChevronRight className="w-4 h-4" /></Button>
                  </Link>
                  <Link to="/compare-dealer-cars">
                    <Button variant="outline" size="sm" className="gap-1 border-primary/30 hover:bg-primary/10">
                      <GitCompare className="w-4 h-4" /> Compare Prices
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AICarRecommendations />
      </div>
      <FeaturedDealers />
      <Footer />
    </div>
  );
};

export default Index;