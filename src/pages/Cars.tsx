import Navbar from "@/components/Navbar";
import CarListing from "@/components/CarListing";
import Footer from "@/components/Footer";

const Cars = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Our Collection</h1>
          <p className="text-muted-foreground mb-8">Explore our curated selection of premium automobiles</p>
        </div>
        <CarListing />
      </main>
      <Footer />
    </div>
  );
};

export default Cars;