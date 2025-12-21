import { useState } from "react";
import { Car } from "@/data/cars";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface CarImageGalleryProps {
  car: Car;
}

// Generate multiple gallery images from the main image
const generateGalleryImages = (mainImage: string, carName: string) => {
  return [
    { src: mainImage, alt: `${carName} - Main View` },
    { src: mainImage.replace("w=800", "w=801"), alt: `${carName} - Side View` },
    { src: mainImage.replace("w=800", "w=802"), alt: `${carName} - Interior` },
    { src: mainImage.replace("w=800", "w=803"), alt: `${carName} - Rear View` },
  ];
};

const CarImageGallery = ({ car }: CarImageGalleryProps) => {
  const images = generateGalleryImages(car.image, car.name);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative group rounded-2xl overflow-hidden border border-border/50">
          <img
            src={images[selectedIndex].src}
            alt={images[selectedIndex].alt}
            className="w-full h-[300px] sm:h-[400px] object-cover transition-transform duration-500"
          />
          
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <Maximize2 className="w-5 h-5 text-foreground" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
            <span className="text-sm text-foreground">
              {selectedIndex + 1} / {images.length}
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                selectedIndex === idx
                  ? "border-primary"
                  : "border-border/50 hover:border-primary/50"
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-16 sm:h-20 object-cover"
              />
              {selectedIndex === idx && (
                <div className="absolute inset-0 bg-primary/10" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-secondary border border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <img
            src={images[selectedIndex].src}
            alt={images[selectedIndex].alt}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-secondary border border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-secondary border border-border/50 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default CarImageGallery;
