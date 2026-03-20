import { useState, useEffect, useCallback } from "react";

interface RecentCar {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  type: "new" | "used";
  viewedAt: number;
}

const STORAGE_KEY = "carbazaar_recently_viewed";
const MAX_ITEMS = 5;

export const useRecentlyViewedCars = () => {
  const [recentCars, setRecentCars] = useState<RecentCar[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecentCars(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const addCar = useCallback((car: Omit<RecentCar, "viewedAt">) => {
    setRecentCars((prev) => {
      const filtered = prev.filter((c) => c.id !== car.id);
      const updated = [{ ...car, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentCars, addCar };
};
