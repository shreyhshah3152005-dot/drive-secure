import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompareProvider } from "@/contexts/CompareContext";
import CompareBar from "@/components/CompareBar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DealerAuth from "./pages/DealerAuth";
import AdminAuth from "./pages/AdminAuth";
import Cars from "./pages/Cars";
import CarDetail from "./pages/CarDetail";
import Compare from "./pages/Compare";
import CompareDealerCars from "./pages/CompareDealerCars";
import CompareDealersDetail from "./pages/CompareDealersDetail";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import DealerPanel from "./pages/DealerPanel";
import Dealers from "./pages/Dealers";
import DealerDetail from "./pages/DealerDetail";
import DealerCarDetail from "./pages/DealerCarDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompareProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dealer-auth" element={<DealerAuth />} />
              <Route path="/admin-auth" element={<AdminAuth />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/car/:id" element={<CarDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/compare-dealers" element={<CompareDealerCars />} />
              <Route path="/compare-dealers-detail" element={<CompareDealersDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/dealer" element={<DealerPanel />} />
              <Route path="/dealers" element={<Dealers />} />
              <Route path="/dealer/:id" element={<DealerDetail />} />
              <Route path="/dealer-car/:id" element={<DealerCarDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CompareBar />
          </CompareProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
