import { createContext, useContext, useState, ReactNode } from "react";
import { Car } from "@/data/cars";

interface CompareContextType {
  selectedCars: Car[];
  addToCompare: (car: Car) => void;
  removeFromCompare: (carId: string) => void;
  clearCompare: () => void;
  isInCompare: (carId: string) => boolean;
  maxCars: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const maxCars = 4;

  const addToCompare = (car: Car) => {
    if (selectedCars.length < maxCars && !selectedCars.find((c) => c.id === car.id)) {
      setSelectedCars((prev) => [...prev, car]);
    }
  };

  const removeFromCompare = (carId: string) => {
    setSelectedCars((prev) => prev.filter((c) => c.id !== carId));
  };

  const clearCompare = () => {
    setSelectedCars([]);
  };

  const isInCompare = (carId: string) => {
    return selectedCars.some((c) => c.id === carId);
  };

  return (
    <CompareContext.Provider
      value={{
        selectedCars,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        maxCars,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};
