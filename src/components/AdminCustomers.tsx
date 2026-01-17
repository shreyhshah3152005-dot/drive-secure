import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Search, Calendar, Car, GitCompare, Clock, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
}

interface TestDriveInquiry {
  id: string;
  car_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
}

interface ComparisonHistory {
  id: string;
  car_ids: string[];
  car_names: string[];
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerTestDrives, setCustomerTestDrives] = useState<TestDriveInquiry[]>([]);
  const [customerComparisons, setCustomerComparisons] = useState<ComparisonHistory[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, phone, city, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoadingDetails(true);

    try {
      // Fetch test drive inquiries for this customer
      const { data: testDrives, error: testDriveError } = await supabase
        .from("test_drive_inquiries")
        .select("id, car_name, preferred_date, preferred_time, status, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false });

      if (testDriveError) throw testDriveError;
      setCustomerTestDrives(testDrives || []);

      // Fetch comparison history for this customer
      const { data: comparisons, error: comparisonError } = await supabase
        .from("comparison_history")
        .select("id, car_ids, car_names, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false });

      if (comparisonError) throw comparisonError;
      setCustomerComparisons(comparisons || []);
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchQuery) ||
      customer.city?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Customer Management
          </CardTitle>
          <CardDescription>
            View customer profiles and their activity history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No customers matching your search" : "No customers registered yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name || "Not provided"}
                    </TableCell>
                    <TableCell>{customer.email || "N/A"}</TableCell>
                    <TableCell>{customer.phone || "N/A"}</TableCell>
                    <TableCell>{customer.city || "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchCustomerDetails(customer)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Customer Details
            </DialogTitle>
            <DialogDescription>
              View complete profile and activity history
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Profile Info */}
              <Card className="bg-secondary/30 border-border/50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium truncate">{selectedCustomer.name || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm break-all">{selectedCustomer.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedCustomer.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">City</p>
                        <p className="font-medium">{selectedCustomer.city || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isLoadingDetails ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">Loading activity...</p>
                </div>
              ) : (
                <Tabs defaultValue="test-drives">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="test-drives" className="gap-2">
                      <Car className="w-4 h-4" />
                      Test Drives ({customerTestDrives.length})
                    </TabsTrigger>
                    <TabsTrigger value="comparisons" className="gap-2">
                      <GitCompare className="w-4 h-4" />
                      Comparisons ({customerComparisons.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="test-drives" className="mt-4">
                    {customerTestDrives.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No test drive requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {customerTestDrives.map((td) => (
                          <div
                            key={td.id}
                            className="p-4 rounded-lg bg-secondary/30 border border-border/50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{td.car_name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(td.preferred_date), "MMM dd, yyyy")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {td.preferred_time}
                                  </span>
                                </div>
                              </div>
                              <Badge className={getStatusColor(td.status)}>
                                {td.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comparisons" className="mt-4">
                    {customerComparisons.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <GitCompare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No comparison history</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {customerComparisons.map((comp) => (
                          <div
                            key={comp.id}
                            className="p-4 rounded-lg bg-secondary/30 border border-border/50"
                          >
                            <p className="font-medium">{comp.car_names.join(" vs ")}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(comp.created_at), "MMM dd, yyyy 'at' HH:mm")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCustomers;
