import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedDealers from "@/components/FeaturedDealers";
import Footer from "@/components/Footer";
import AICarRecommendations from "@/components/AICarRecommendations";

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
      <div className="container mx-auto px-4 py-8">
        <AICarRecommendations />
      </div>
      <FeaturedDealers />
      <Footer />
    </div>
  );
};

export default Index;