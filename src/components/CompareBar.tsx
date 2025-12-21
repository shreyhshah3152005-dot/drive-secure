import { useCompare } from "@/contexts/CompareContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, GitCompare, Trash2 } from "lucide-react";

const CompareBar = () => {
  const { selectedCars, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (selectedCars.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl animate-slide-up">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Compare ({selectedCars.length}/4)
            </span>
          </div>

          <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-1">
            {selectedCars.map((car) => (
              <div
                key={car.id}
                className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border/50 shrink-0"
              >
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-foreground line-clamp-1">
                    {car.brand}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {car.model}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCompare(car.id)}
                  className="p-1 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate("/compare")}
              disabled={selectedCars.length < 2}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
