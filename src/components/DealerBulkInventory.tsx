import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package, ShoppingCart, Power, IndianRupee, CheckSquare, XSquare } from "lucide-react";

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  fuel_type: string;
  is_active: boolean;
  image_url: string | null;
}

interface DealerBulkInventoryProps {
  cars: DealerCar[];
  onRefresh: () => void;
}

const DealerBulkInventory = ({ cars, onRefresh }: DealerBulkInventoryProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [priceMode, setPriceMode] = useState<"fixed" | "percent">("percent");

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === cars.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cars.map(c => c.id)));
    }
  };

  const bulkAction = async (action: "activate" | "deactivate" | "sold") => {
    if (selected.size === 0) {
      toast.error("Please select at least one car");
      return;
    }

    setProcessing(true);
    try {
      const isActive = action === "activate";
      const ids = Array.from(selected);

      for (const id of ids) {
        const { error } = await supabase
          .from("dealer_cars")
          .update({ is_active: isActive })
          .eq("id", id);
        if (error) throw error;
      }

      const label = action === "sold" ? "marked as sold" : action === "activate" ? "activated" : "deactivated";
      toast.success(`${ids.length} car(s) ${label} successfully!`);
      setSelected(new Set());
      onRefresh();
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Failed to perform bulk action");
    } finally {
      setProcessing(false);
    }
  };

  const bulkUpdatePrice = async () => {
    if (selected.size === 0 || !priceAdjustment) return;

    setProcessing(true);
    try {
      const ids = Array.from(selected);
      const adj = parseFloat(priceAdjustment);

      for (const id of ids) {
        const car = cars.find(c => c.id === id);
        if (!car) continue;

        let newPrice: number;
        if (priceMode === "percent") {
          newPrice = car.price * (1 + adj / 100);
        } else {
          newPrice = adj;
        }
        newPrice = Math.round(newPrice * 100) / 100;

        const { error } = await supabase
          .from("dealer_cars")
          .update({ price: newPrice })
          .eq("id", id);
        if (error) throw error;
      }

      toast.success(`Price updated for ${ids.length} car(s)!`);
      setSelected(new Set());
      setPriceDialogOpen(false);
      setPriceAdjustment("");
      onRefresh();
    } catch (error) {
      console.error("Price update error:", error);
      toast.error("Failed to update prices");
    } finally {
      setProcessing(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Bulk Inventory Management
        </CardTitle>
        <CardDescription>Select multiple cars to perform bulk actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Bar */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} selected
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkAction("activate")}
              disabled={processing}
              className="gap-1"
            >
              <Power className="w-3 h-3" />
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkAction("deactivate")}
              disabled={processing}
              className="gap-1"
            >
              <Power className="w-3 h-3" />
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkAction("sold")}
              disabled={processing}
              className="gap-1 text-orange-600"
            >
              <ShoppingCart className="w-3 h-3" />
              Mark Sold
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPriceDialogOpen(true)}
              disabled={processing}
              className="gap-1"
            >
              <IndianRupee className="w-3 h-3" />
              Update Price
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              className="gap-1 ml-auto"
            >
              <XSquare className="w-3 h-3" />
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        {cars.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No cars in inventory</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === cars.length && cars.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price (₹L)</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map(car => (
                  <TableRow
                    key={car.id}
                    className={selected.has(car.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(car.id)}
                        onCheckedChange={() => toggleSelect(car.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {car.image_url && (
                          <img src={car.image_url} alt="" className="w-10 h-8 object-cover rounded" />
                        )}
                        {car.name}
                      </div>
                    </TableCell>
                    <TableCell>{car.brand}</TableCell>
                    <TableCell>₹{car.price.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{car.category}</TableCell>
                    <TableCell className="capitalize">{car.fuel_type}</TableCell>
                    <TableCell>
                      <Badge variant={car.is_active ? "default" : "secondary"}>
                        {car.is_active ? "Active" : "Sold/Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Price Update Dialog */}
        <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Price for {selectedCount} Car(s)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Button
                  variant={priceMode === "percent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceMode("percent")}
                >
                  % Adjustment
                </Button>
                <Button
                  variant={priceMode === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceMode("fixed")}
                >
                  Fixed Price
                </Button>
              </div>
              <div className="space-y-2">
                <Label>
                  {priceMode === "percent"
                    ? "Price Change % (use negative for decrease)"
                    : "New Price (₹ Lakhs)"}
                </Label>
                <Input
                  type="number"
                  placeholder={priceMode === "percent" ? "e.g. -5 or 10" : "e.g. 12.5"}
                  value={priceAdjustment}
                  onChange={e => setPriceAdjustment(e.target.value)}
                />
                {priceMode === "percent" && priceAdjustment && (
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(priceAdjustment) > 0 ? "Increase" : "Decrease"} by {Math.abs(parseFloat(priceAdjustment))}%
                  </p>
                )}
              </div>
              <Button onClick={bulkUpdatePrice} disabled={processing || !priceAdjustment} className="w-full">
                {processing ? "Updating..." : "Apply Price Change"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DealerBulkInventory;
