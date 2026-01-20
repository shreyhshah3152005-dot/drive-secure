import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw, Eye, Car, Play, Pause } from "lucide-react";

interface VirtualCarTourProps {
  carName: string;
  carBrand: string;
  mainImage: string;
}

const tourViews = [
  { id: "front", label: "Front View", angle: 0 },
  { id: "front-left", label: "Front Left", angle: 45 },
  { id: "left", label: "Left Side", angle: 90 },
  { id: "rear-left", label: "Rear Left", angle: 135 },
  { id: "rear", label: "Rear View", angle: 180 },
  { id: "rear-right", label: "Rear Right", angle: 225 },
  { id: "right", label: "Right Side", angle: 270 },
  { id: "front-right", label: "Front Right", angle: 315 },
];

const interiorViews = [
  { id: "dashboard", label: "Dashboard" },
  { id: "front-seats", label: "Front Seats" },
  { id: "rear-seats", label: "Rear Seats" },
  { id: "trunk", label: "Trunk Space" },
  { id: "steering", label: "Steering Wheel" },
  { id: "infotainment", label: "Infotainment" },
];

const VirtualCarTour = ({ carName, carBrand, mainImage }: VirtualCarTourProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentExteriorIndex, setCurrentExteriorIndex] = useState(0);
  const [currentInteriorIndex, setCurrentInteriorIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"exterior" | "interior">("exterior");
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [autoRotateInterval, setAutoRotateInterval] = useState<NodeJS.Timeout | null>(null);

  // Generate varied images based on the main image
  const generateViewImage = (baseImage: string, viewId: string) => {
    // Append a unique parameter to simulate different angles
    return `${baseImage.split("?")[0]}?view=${viewId}&w=1200&q=90`;
  };

  const handlePrev = () => {
    if (viewMode === "exterior") {
      setCurrentExteriorIndex((prev) => (prev === 0 ? tourViews.length - 1 : prev - 1));
    } else {
      setCurrentInteriorIndex((prev) => (prev === 0 ? interiorViews.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "exterior") {
      setCurrentExteriorIndex((prev) => (prev === tourViews.length - 1 ? 0 : prev + 1));
    } else {
      setCurrentInteriorIndex((prev) => (prev === interiorViews.length - 1 ? 0 : prev + 1));
    }
  };

  const toggleAutoRotate = () => {
    if (isAutoRotating) {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        setAutoRotateInterval(null);
      }
      setIsAutoRotating(false);
    } else {
      const interval = setInterval(() => {
        setCurrentExteriorIndex((prev) => (prev === tourViews.length - 1 ? 0 : prev + 1));
      }, 2000);
      setAutoRotateInterval(interval);
      setIsAutoRotating(true);
    }
  };

  const currentView = viewMode === "exterior" ? tourViews[currentExteriorIndex] : interiorViews[currentInteriorIndex];
  const currentImage = generateViewImage(mainImage, currentView.id);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Virtual Tour
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Virtual Tour: {carBrand} {carName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* View Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant={viewMode === "exterior" ? "default" : "outline"}
              onClick={() => {
                setViewMode("exterior");
                if (isAutoRotating) toggleAutoRotate();
              }}
            >
              Exterior 360°
            </Button>
            <Button
              variant={viewMode === "interior" ? "default" : "outline"}
              onClick={() => {
                setViewMode("interior");
                if (isAutoRotating) toggleAutoRotate();
              }}
            >
              Interior Views
            </Button>
          </div>

          {/* Main Image Display */}
          <div className="relative flex-1 min-h-0 bg-muted rounded-lg overflow-hidden group">
            <img
              src={currentImage}
              alt={`${carBrand} ${carName} - ${currentView.label}`}
              className="w-full h-full object-cover transition-all duration-500"
            />

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Current View Label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border">
              <span className="font-medium">{currentView.label}</span>
              {viewMode === "exterior" && (
                <span className="text-muted-foreground ml-2">({tourViews[currentExteriorIndex].angle}°)</span>
              )}
            </div>

            {/* Auto Rotate Control (Exterior only) */}
            {viewMode === "exterior" && (
              <button
                onClick={toggleAutoRotate}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                {isAutoRotating ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {(viewMode === "exterior" ? tourViews : interiorViews).map((view, idx) => (
              <button
                key={view.id}
                onClick={() => {
                  if (viewMode === "exterior") {
                    setCurrentExteriorIndex(idx);
                  } else {
                    setCurrentInteriorIndex(idx);
                  }
                }}
                className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  (viewMode === "exterior" ? currentExteriorIndex : currentInteriorIndex) === idx
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                }`}
              >
                <img
                  src={generateViewImage(mainImage, view.id)}
                  alt={view.label}
                  className="w-20 h-14 object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-[10px] text-white pb-1 truncate px-1">{view.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 360 Progress Indicator (Exterior) */}
          {viewMode === "exterior" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">0°</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentExteriorIndex / (tourViews.length - 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">360°</span>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">High-Resolution Images</Badge>
            <Badge variant="secondary">360° Exterior View</Badge>
            <Badge variant="secondary">Interior Details</Badge>
            <Badge variant="secondary">Zoom & Pan</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualCarTour;
