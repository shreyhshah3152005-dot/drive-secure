import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Wrench, Trash2, IndianRupee } from "lucide-react";

interface ServiceRecord {
  id: string;
  car_id: string;
  service_date: string;
  service_type: string;
  description: string | null;
  mileage_at_service: number | null;
  cost: number | null;
  created_at: string;
}

interface ServiceHistoryManagerProps {
  dealerId: string;
  cars: { id: string; name: string; brand: string }[];
}

const SERVICE_TYPES = [
  "Regular Service",
  "Oil Change",
  "Brake Service",
  "Tyre Replacement",
  "Battery Replacement",
  "AC Service",
  "Body Repair",
  "Engine Repair",
  "Transmission Service",
  "Electrical Repair",
  "Other",
];

const ServiceHistoryManager = ({ dealerId, cars }: ServiceHistoryManagerProps) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [carId, setCarId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("service_history")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("service_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching service history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [dealerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("service_history").insert({
        car_id: carId,
        dealer_id: dealerId,
        service_date: serviceDate,
        service_type: serviceType,
        description: description || null,
        mileage_at_service: mileage ? parseInt(mileage) : null,
        cost: cost ? parseFloat(cost) : null,
      });
      if (error) throw error;
      toast.success("Service record added!");
      setDialogOpen(false);
      setCarId(""); setServiceDate(""); setServiceType(""); setDescription(""); setMileage(""); setCost("");
      fetchRecords();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add service record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("service_history").delete().eq("id", id);
      if (error) throw error;
      toast.success("Record deleted");
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const getCarName = (cid: string) => {
    const car = cars.find(c => c.id === cid);
    return car ? `${car.brand} ${car.name}` : "Unknown";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Service History
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Car *</Label>
                <Select value={carId} onValueChange={setCarId} required>
                  <SelectTrigger><SelectValue placeholder="Select car" /></SelectTrigger>
                  <SelectContent>
                    {cars.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.brand} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Date *</Label>
                  <Input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Service Type *</Label>
                  <Select value={serviceType} onValueChange={setServiceType} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mileage (km)</Label>
                  <Input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="e.g. 25000" />
                </div>
                <div className="space-y-2">
                  <Label>Cost (₹)</Label>
                  <Input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 5000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details about the service..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !carId || !serviceDate || !serviceType}>
                {submitting ? "Adding..." : "Add Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No service records yet. Add records to build trust with buyers.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{getCarName(r.car_id)}</TableCell>
                    <TableCell>{new Date(r.service_date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell><Badge variant="secondary">{r.service_type}</Badge></TableCell>
                    <TableCell>{r.mileage_at_service ? `${r.mileage_at_service.toLocaleString()} km` : "—"}</TableCell>
                    <TableCell>{r.cost ? `₹${r.cost.toLocaleString("en-IN")}` : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceHistoryManager;
