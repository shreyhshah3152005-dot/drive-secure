import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Plus, Trash2, Search, Mail } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  brand: string | null;
  min_price: number | null;
  max_price: number | null;
  fuel_type: string | null;
  category: string | null;
  email_notifications: boolean;
  created_at: string;
}

const brands = ["Tata", "Mahindra", "Maruti Suzuki", "Hyundai", "Honda", "Toyota", "Kia", "MG", "Volkswagen", "Skoda", "BMW", "Mercedes-Benz", "Audi"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
const categories = ["SUV", "Sedan", "Hatchback", "Crossover", "MPV", "Electric", "Off-Road", "Luxury"];
const priceRanges = [
  { label: "Under ₹10 Lakh", min: 0, max: 1000000 },
  { label: "₹10-20 Lakh", min: 1000000, max: 2000000 },
  { label: "₹20-30 Lakh", min: 2000000, max: 3000000 },
  { label: "₹30-50 Lakh", min: 3000000, max: 5000000 },
  { label: "₹50 Lakh+", min: 5000000, max: null },
];

const SavedSearches = () => {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newSearch, setNewSearch] = useState({
    name: "",
    brand: "",
    priceRange: "",
    fuel_type: "",
    category: "",
    email_notifications: true,
  });

  useEffect(() => {
    if (user) fetchSearches();
  }, [user]);

  const fetchSearches = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!user || !newSearch.name) {
      toast.error("Please enter a name for this search");
      return;
    }

    setIsSaving(true);
    try {
      let minPrice = null;
      let maxPrice = null;

      if (newSearch.priceRange) {
        const range = priceRanges.find((r) => r.label === newSearch.priceRange);
        if (range) {
          minPrice = range.min;
          maxPrice = range.max;
        }
      }

      const { error } = await supabase.from("saved_searches").insert({
        user_id: user.id,
        name: newSearch.name,
        brand: newSearch.brand || null,
        min_price: minPrice,
        max_price: maxPrice,
        fuel_type: newSearch.fuel_type || null,
        category: newSearch.category || null,
        email_notifications: newSearch.email_notifications,
      });

      if (error) throw error;

      toast.success("Search saved! You'll be notified when matching cars are listed.");
      setDialogOpen(false);
      setNewSearch({
        name: "",
        brand: "",
        priceRange: "",
        fuel_type: "",
        category: "",
        email_notifications: true,
      });
      fetchSearches();
    } catch (error) {
      console.error("Error saving search:", error);
      toast.error("Failed to save search");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_searches").delete().eq("id", id);
      if (error) throw error;
      toast.success("Search deleted");
      fetchSearches();
    } catch (error) {
      console.error("Error deleting search:", error);
      toast.error("Failed to delete search");
    }
  };

  const handleToggleNotifications = async (search: SavedSearch) => {
    try {
      const { error } = await supabase
        .from("saved_searches")
        .update({ email_notifications: !search.email_notifications })
        .eq("id", search.id);

      if (error) throw error;
      toast.success(search.email_notifications ? "Notifications disabled" : "Notifications enabled");
      fetchSearches();
    } catch (error) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notifications");
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "";
    return `₹${(price / 100000).toFixed(1)}L`;
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Saved Searches
          </CardTitle>
          <CardDescription>Get notified when new cars match your criteria</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Search Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Search Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Alert Name *</Label>
                <Input
                  placeholder="e.g., Electric SUV under 20L"
                  value={newSearch.name}
                  onChange={(e) => setNewSearch({ ...newSearch, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Brand</Label>
                <Select value={newSearch.brand} onValueChange={(v) => setNewSearch({ ...newSearch, brand: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any brand</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Price Range</Label>
                <Select value={newSearch.priceRange} onValueChange={(v) => setNewSearch({ ...newSearch, priceRange: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any price</SelectItem>
                    {priceRanges.map((r) => (
                      <SelectItem key={r.label} value={r.label}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fuel Type</Label>
                <Select value={newSearch.fuel_type} onValueChange={(v) => setNewSearch({ ...newSearch, fuel_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any fuel type</SelectItem>
                    {fuelTypes.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={newSearch.category} onValueChange={(v) => setNewSearch({ ...newSearch, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label>Email Notifications</Label>
                </div>
                <Switch
                  checked={newSearch.email_notifications}
                  onCheckedChange={(v) => setNewSearch({ ...newSearch, email_notifications: v })}
                />
              </div>

              <Button className="w-full" onClick={handleSaveSearch} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Search Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved searches yet</p>
            <p className="text-sm">Create an alert to get notified about new cars</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{search.name}</h4>
                    {search.email_notifications && (
                      <Badge variant="secondary" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {search.brand && <Badge variant="outline">{search.brand}</Badge>}
                    {search.fuel_type && <Badge variant="outline">{search.fuel_type}</Badge>}
                    {search.category && <Badge variant="outline">{search.category}</Badge>}
                    {(search.min_price || search.max_price) && (
                      <Badge variant="outline">
                        {formatPrice(search.min_price)} - {search.max_price ? formatPrice(search.max_price) : "Any"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={search.email_notifications}
                    onCheckedChange={() => handleToggleNotifications(search)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSearch(search.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedSearches;
