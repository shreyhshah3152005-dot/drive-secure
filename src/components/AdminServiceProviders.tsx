import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, CheckCircle, XCircle, Plus, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  city: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminServiceProviders = () => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addBusinessName, setAddBusinessName] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProviders((data as ServiceProvider[]) || []);
    } catch (e) {
      console.error("Error fetching providers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleActive = async (provider: ServiceProvider) => {
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({ is_active: !provider.is_active })
        .eq("id", provider.id);
      if (error) throw error;
      toast.success(provider.is_active ? "Service provider deactivated" : "Service provider approved!");
      fetchProviders();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Service Providers
            </CardTitle>
            <CardDescription>Manage service provider accounts and approvals</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No service providers registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.business_name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {p.city}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {p.phone}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(p.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {p.is_active ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                            <XCircle className="w-3 h-3 mr-1" />Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={p.is_active ? "destructive" : "default"}
                          onClick={() => handleToggleActive(p)}
                        >
                          {p.is_active ? "Deactivate" : "Approve"}
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
    </div>
  );
};

export default AdminServiceProviders;
