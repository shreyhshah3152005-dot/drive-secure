import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerRole } from "@/hooks/useDealerRole";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarImageUpload from "@/components/CarImageUpload";
import DealerProfileImageUpload from "@/components/DealerProfileImageUpload";
import DealerAnalytics from "@/components/DealerAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Car, Plus, Package, Calendar, CheckCircle, XCircle, Clock, Star, Edit, Power, Settings, BarChart3, ArrowUp, MessageCircle } from "lucide-react";
import DealerLiveChat from "@/components/DealerLiveChat";
import SubscriptionUpgradeRequest from "@/components/SubscriptionUpgradeRequest";

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  fuel_type: string;
  transmission: string;
  seating_capacity: number;
  mileage: string | null;
  engine: string | null;
  power: string | null;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface TestDriveInquiry {
  id: string;
  car_name: string;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  dealer_review: string | null;
  created_at: string;
}

const subscriptionLimits: Record<string, number> = {
  free: 2,
  basic: 5,
  standard: 15,
  premium: 999999,
};

const subscriptionPrices: Record<string, string> = {
  free: "Free",
  basic: "₹999/month",
  standard: "₹1,999/month",
  premium: "₹3,999/month",
};

const DealerPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDealer, dealerInfo, isLoading: dealerLoading } = useDealerRole();
  const navigate = useNavigate();

  const [cars, setCars] = useState<DealerCar[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveInquiry[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [isLoadingTestDrives, setIsLoadingTestDrives] = useState(true);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [addCarDialogOpen, setAddCarDialogOpen] = useState(false);
  const [editCarDialogOpen, setEditCarDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDriveInquiry | null>(null);
  const [selectedCar, setSelectedCar] = useState<DealerCar | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [isUpdatingCar, setIsUpdatingCar] = useState(false);
  const [dealerProfileImage, setDealerProfileImage] = useState<string | null>(null);

  const handleProfileImageChange = async (url: string | null) => {
    if (!dealerInfo?.id) return;
    
    try {
      const { error } = await supabase
        .from("dealers")
        .update({ profile_image_url: url })
        .eq("id", dealerInfo.id);

      if (error) throw error;
      
      setDealerProfileImage(url);
      toast.success("Profile image updated successfully!");
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast.error("Failed to update profile image");
    }
  };

  const [newCar, setNewCar] = useState({
    name: "",
    brand: "",
    price: "",
    category: "sedan",
    fuel_type: "petrol",
    transmission: "manual",
    seating_capacity: "5",
    mileage: "",
    engine: "",
    power: "",
    image_url: "",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!dealerLoading && !isDealer && user) {
      navigate("/dashboard");
      toast.error("You don't have dealer access");
    }
  }, [dealerLoading, isDealer, user, navigate]);

  useEffect(() => {
    if (dealerInfo?.id) {
      fetchCars();
      fetchTestDrives();
    }
  }, [dealerInfo?.id]);

  const fetchCars = async () => {
    if (!dealerInfo?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("dealer_cars")
        .select("*")
        .eq("dealer_id", dealerInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast.error("Failed to load cars");
    } finally {
      setIsLoadingCars(false);
    }
  };

  const fetchTestDrives = async () => {
    if (!dealerInfo?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("test_drive_inquiries")
        .select("*")
        .eq("dealer_id", dealerInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestDrives(data || []);
    } catch (error) {
      console.error("Error fetching test drives:", error);
      toast.error("Failed to load test drives");
    } finally {
      setIsLoadingTestDrives(false);
    }
  };

  const handleAddCar = async () => {
    if (!dealerInfo?.id) return;

    const carLimit = subscriptionLimits[dealerInfo.subscription_plan] || 0;
    const activeCars = cars.filter(c => c.is_active).length;

    if (activeCars >= carLimit) {
      toast.error(`You've reached your car limit (${carLimit}). Upgrade your subscription to add more cars.`);
      return;
    }

    if (!newCar.name || !newCar.brand || !newCar.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsAddingCar(true);
    try {
      const { error } = await supabase.from("dealer_cars").insert({
        dealer_id: dealerInfo.id,
        name: newCar.name,
        brand: newCar.brand,
        price: parseFloat(newCar.price),
        category: newCar.category,
        fuel_type: newCar.fuel_type,
        transmission: newCar.transmission,
        seating_capacity: parseInt(newCar.seating_capacity),
        mileage: newCar.mileage || null,
        engine: newCar.engine || null,
        power: newCar.power || null,
        image_url: newCar.image_url || null,
        description: newCar.description || null,
      });

      if (error) throw error;

      toast.success("Car added successfully!");
      setAddCarDialogOpen(false);
      setNewCar({
        name: "",
        brand: "",
        price: "",
        category: "sedan",
        fuel_type: "petrol",
        transmission: "manual",
        seating_capacity: "5",
        mileage: "",
        engine: "",
        power: "",
        image_url: "",
        description: "",
      });
      fetchCars();
    } catch (error) {
      console.error("Error adding car:", error);
      toast.error("Failed to add car");
    } finally {
      setIsAddingCar(false);
    }
  };

  const handleEditCar = (car: DealerCar) => {
    setSelectedCar(car);
    setNewCar({
      name: car.name,
      brand: car.brand,
      price: car.price.toString(),
      category: car.category,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      seating_capacity: car.seating_capacity.toString(),
      mileage: car.mileage || "",
      engine: car.engine || "",
      power: car.power || "",
      image_url: car.image_url || "",
      description: car.description || "",
    });
    setEditCarDialogOpen(true);
  };

  const handleUpdateCar = async () => {
    if (!selectedCar) return;

    if (!newCar.name || !newCar.brand || !newCar.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUpdatingCar(true);
    try {
      const { error } = await supabase
        .from("dealer_cars")
        .update({
          name: newCar.name,
          brand: newCar.brand,
          price: parseFloat(newCar.price),
          category: newCar.category,
          fuel_type: newCar.fuel_type,
          transmission: newCar.transmission,
          seating_capacity: parseInt(newCar.seating_capacity),
          mileage: newCar.mileage || null,
          engine: newCar.engine || null,
          power: newCar.power || null,
          image_url: newCar.image_url || null,
          description: newCar.description || null,
        })
        .eq("id", selectedCar.id);

      if (error) throw error;

      toast.success("Car updated successfully!");
      setEditCarDialogOpen(false);
      setSelectedCar(null);
      setNewCar({
        name: "",
        brand: "",
        price: "",
        category: "sedan",
        fuel_type: "petrol",
        transmission: "manual",
        seating_capacity: "5",
        mileage: "",
        engine: "",
        power: "",
        image_url: "",
        description: "",
      });
      fetchCars();
    } catch (error) {
      console.error("Error updating car:", error);
      toast.error("Failed to update car");
    } finally {
      setIsUpdatingCar(false);
    }
  };

  const handleToggleCarStatus = async (car: DealerCar) => {
    const carLimit = subscriptionLimits[dealerInfo?.subscription_plan || "basic"];
    const activeCars = cars.filter(c => c.is_active).length;

    // If trying to activate a car and already at limit
    if (!car.is_active && activeCars >= carLimit) {
      toast.error(`You've reached your car limit (${carLimit}). Upgrade your subscription to add more cars.`);
      return;
    }

    try {
      const { error } = await supabase
        .from("dealer_cars")
        .update({ is_active: !car.is_active })
        .eq("id", car.id);

      if (error) throw error;

      toast.success(`Car ${car.is_active ? "deactivated" : "activated"} successfully!`);
      fetchCars();
    } catch (error) {
      console.error("Error toggling car status:", error);
      toast.error("Failed to update car status");
    }
  };

  const handleCompleteTestDrive = async () => {
    if (!selectedTestDrive || !dealerInfo) return;

    try {
      const { error } = await supabase
        .from("test_drive_inquiries")
        .update({
          status: "completed",
          dealer_review: reviewText || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", selectedTestDrive.id);

      if (error) throw error;

      // Send notification email to customer
      try {
        await supabase.functions.invoke("send-customer-notification", {
          body: {
            type: "status_change",
            email: selectedTestDrive.email,
            name: selectedTestDrive.name,
            carName: selectedTestDrive.car_name,
            dealerName: dealerInfo.dealership_name,
            preferredDate: selectedTestDrive.preferred_date,
            preferredTime: selectedTestDrive.preferred_time,
            newStatus: "completed",
          },
        });
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the main request if email fails
      }

      toast.success("Test drive marked as completed!");
      setReviewDialogOpen(false);
      setSelectedTestDrive(null);
      setReviewText("");
      fetchTestDrives();
    } catch (error) {
      console.error("Error updating test drive:", error);
      toast.error("Failed to update test drive");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || dealerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isDealer) {
    return null;
  }

  const carLimit = subscriptionLimits[dealerInfo?.subscription_plan || "basic"];
  const activeCars = cars.filter(c => c.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {dealerInfo?.dealership_name || "Dealer"} Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your cars and test drive requests
            </p>
          </div>
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Package className="w-4 h-4 mr-2" />
            {dealerInfo?.subscription_plan?.charAt(0).toUpperCase() + dealerInfo?.subscription_plan?.slice(1)} Plan - {subscriptionPrices[dealerInfo?.subscription_plan || "basic"]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cars Listed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCars} / {carLimit === 999999 ? "∞" : carLimit}</div>
              <p className="text-xs text-muted-foreground">Active car listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Test Drives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testDrives.filter(t => t.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Test Drives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testDrives.filter(t => t.status === "completed").length}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="cars" className="gap-2">
              <Car className="w-4 h-4" />
              My Cars
            </TabsTrigger>
            <TabsTrigger value="testdrives" className="gap-2">
              <Calendar className="w-4 h-4" />
              Test Drives
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <Package className="w-4 h-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <DealerAnalytics cars={cars} testDrives={testDrives} />
          </TabsContent>

          <TabsContent value="messages">
            <DealerLiveChat />
          </TabsContent>

          <TabsContent value="cars">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Cars</CardTitle>
                  <CardDescription>Manage your car inventory</CardDescription>
                </div>
                <Dialog open={addCarDialogOpen} onOpenChange={setAddCarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={activeCars >= carLimit}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Car
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Car</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Car Name *</Label>
                        <Input
                          id="name"
                          value={newCar.name}
                          onChange={(e) => setNewCar({ ...newCar, name: e.target.value })}
                          placeholder="e.g., Tata Nexon"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand *</Label>
                        <Input
                          id="brand"
                          value={newCar.brand}
                          onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                          placeholder="e.g., Tata"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹ Lakhs) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newCar.price}
                          onChange={(e) => setNewCar({ ...newCar, price: e.target.value })}
                          placeholder="e.g., 12.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newCar.category} onValueChange={(v) => setNewCar({ ...newCar, category: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedan">Sedan</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="hatchback">Hatchback</SelectItem>
                            <SelectItem value="mpv">MPV</SelectItem>
                            <SelectItem value="crossover">Crossover</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuel_type">Fuel Type</Label>
                        <Select value={newCar.fuel_type} onValueChange={(v) => setNewCar({ ...newCar, fuel_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="petrol">Petrol</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="cng">CNG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transmission">Transmission</Label>
                        <Select value={newCar.transmission} onValueChange={(v) => setNewCar({ ...newCar, transmission: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="automatic">Automatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seating">Seating Capacity</Label>
                        <Select value={newCar.seating_capacity} onValueChange={(v) => setNewCar({ ...newCar, seating_capacity: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Seater</SelectItem>
                            <SelectItem value="4">4 Seater</SelectItem>
                            <SelectItem value="5">5 Seater</SelectItem>
                            <SelectItem value="6">6 Seater</SelectItem>
                            <SelectItem value="7">7 Seater</SelectItem>
                            <SelectItem value="8">8 Seater</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mileage">Mileage</Label>
                        <Input
                          id="mileage"
                          value={newCar.mileage}
                          onChange={(e) => setNewCar({ ...newCar, mileage: e.target.value })}
                          placeholder="e.g., 18.5 km/l"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="engine">Engine</Label>
                        <Input
                          id="engine"
                          value={newCar.engine}
                          onChange={(e) => setNewCar({ ...newCar, engine: e.target.value })}
                          placeholder="e.g., 1.5L Turbo Petrol"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="power">Power</Label>
                        <Input
                          id="power"
                          value={newCar.power}
                          onChange={(e) => setNewCar({ ...newCar, power: e.target.value })}
                          placeholder="e.g., 118 bhp"
                        />
                      </div>
                      <div className="col-span-2">
                        <CarImageUpload
                          imageUrl={newCar.image_url}
                          onImageChange={(url) => setNewCar({ ...newCar, image_url: url })}
                          dealerId={dealerInfo?.id || ""}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newCar.description}
                          onChange={(e) => setNewCar({ ...newCar, description: e.target.value })}
                          placeholder="Car description..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddCarDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCar} disabled={isAddingCar}>
                        {isAddingCar ? "Adding..." : "Add Car"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingCars ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : cars.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No cars added yet. Add your first car to get started!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Car</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cars.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell className="font-medium">{car.name}</TableCell>
                          <TableCell>{car.brand}</TableCell>
                          <TableCell>₹{car.price.toLocaleString()} L</TableCell>
                          <TableCell className="capitalize">{car.category}</TableCell>
                          <TableCell>
                            <Badge variant={car.is_active ? "default" : "secondary"}>
                              {car.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCar(car)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={car.is_active ? "destructive" : "default"}
                                onClick={() => handleToggleCarStatus(car)}
                              >
                                <Power className="w-3 h-3 mr-1" />
                                {car.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testdrives">
            <Card>
              <CardHeader>
                <CardTitle>Test Drive Requests</CardTitle>
                <CardDescription>Manage test drive requests for your cars</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTestDrives ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : testDrives.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No test drive requests yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Car</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testDrives.map((drive) => (
                        <TableRow key={drive.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{drive.name}</p>
                              <p className="text-sm text-muted-foreground">{drive.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{drive.car_name}</TableCell>
                          <TableCell>
                            <div>
                              <p>{new Date(drive.preferred_date).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">{drive.preferred_time}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(drive.status)}</TableCell>
                          <TableCell>
                            {drive.dealer_review ? (
                              <span className="text-sm">{drive.dealer_review.slice(0, 50)}...</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No review</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {drive.status !== "completed" && drive.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTestDrive(drive);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="space-y-8">
              {/* Current Plan & Upgrade Request */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>
                    You're on the <strong className="capitalize">{dealerInfo?.subscription_plan}</strong> plan - {subscriptionPrices[dealerInfo?.subscription_plan || "basic"]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Active car listings: <strong>{cars.filter(c => c.is_active).length}</strong> / {dealerInfo?.subscription_plan === "premium" ? "Unlimited" : subscriptionLimits[dealerInfo?.subscription_plan || "basic"]}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{dealerInfo?.subscription_plan}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Upgrade Request Component */}
              {dealerInfo?.id && (
                <SubscriptionUpgradeRequest 
                  currentPlan={dealerInfo.subscription_plan || "basic"} 
                  dealerId={dealerInfo.id} 
                />
              )}

              {/* All Plans Comparison */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {["free", "basic", "standard", "premium"].map((plan) => (
                    <Card
                      key={plan}
                      className={dealerInfo?.subscription_plan === plan ? "border-primary ring-2 ring-primary" : ""}
                    >
                      <CardHeader>
                        <CardTitle className="capitalize">{plan}</CardTitle>
                        <CardDescription>{subscriptionPrices[plan]}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {plan === "premium" ? "Unlimited" : subscriptionLimits[plan]} Car Listings
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Test Drive Management
                          </li>
                          {plan !== "free" && plan !== "basic" && (
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Priority Support
                            </li>
                          )}
                          {plan === "premium" && (
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Featured Placement
                            </li>
                          )}
                        </ul>
                        {dealerInfo?.subscription_plan === plan && (
                          <Badge className="mt-4 w-full justify-center">Current Plan</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Dealership Settings</CardTitle>
                <CardDescription>Update your dealership profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DealerProfileImageUpload
                  imageUrl={dealerProfileImage}
                  onImageChange={handleProfileImageChange}
                />
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Your dealership name: <strong>{dealerInfo?.dealership_name}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Location: <strong>{dealerInfo?.city}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Test Drive Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Test Drive</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Mark this test drive as completed and optionally add a review from the customer.
              </p>
              <div className="space-y-2">
                <Label htmlFor="review">Customer Review (Optional)</Label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Enter customer feedback..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCompleteTestDrive}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Car Dialog */}
        <Dialog open={editCarDialogOpen} onOpenChange={(open) => {
          setEditCarDialogOpen(open);
          if (!open) {
            setSelectedCar(null);
            setNewCar({
              name: "",
              brand: "",
              price: "",
              category: "sedan",
              fuel_type: "petrol",
              transmission: "manual",
              seating_capacity: "5",
              mileage: "",
              engine: "",
              power: "",
              image_url: "",
              description: "",
            });
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Car</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Car Name *</Label>
                <Input
                  id="edit-name"
                  value={newCar.name}
                  onChange={(e) => setNewCar({ ...newCar, name: e.target.value })}
                  placeholder="e.g., Tata Nexon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-brand">Brand *</Label>
                <Input
                  id="edit-brand"
                  value={newCar.brand}
                  onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                  placeholder="e.g., Tata"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹ Lakhs) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={newCar.price}
                  onChange={(e) => setNewCar({ ...newCar, price: e.target.value })}
                  placeholder="e.g., 12.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={newCar.category} onValueChange={(v) => setNewCar({ ...newCar, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="hatchback">Hatchback</SelectItem>
                    <SelectItem value="mpv">MPV</SelectItem>
                    <SelectItem value="crossover">Crossover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fuel_type">Fuel Type</Label>
                <Select value={newCar.fuel_type} onValueChange={(v) => setNewCar({ ...newCar, fuel_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-transmission">Transmission</Label>
                <Select value={newCar.transmission} onValueChange={(v) => setNewCar({ ...newCar, transmission: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-seating_capacity">Seating Capacity</Label>
                <Select value={newCar.seating_capacity} onValueChange={(v) => setNewCar({ ...newCar, seating_capacity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Seater</SelectItem>
                    <SelectItem value="4">4 Seater</SelectItem>
                    <SelectItem value="5">5 Seater</SelectItem>
                    <SelectItem value="6">6 Seater</SelectItem>
                    <SelectItem value="7">7 Seater</SelectItem>
                    <SelectItem value="8">8 Seater</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mileage">Mileage (km/l)</Label>
                <Input
                  id="edit-mileage"
                  value={newCar.mileage}
                  onChange={(e) => setNewCar({ ...newCar, mileage: e.target.value })}
                  placeholder="e.g., 18.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-engine">Engine</Label>
                <Input
                  id="edit-engine"
                  value={newCar.engine}
                  onChange={(e) => setNewCar({ ...newCar, engine: e.target.value })}
                  placeholder="e.g., 1.5L Turbo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-power">Power</Label>
                <Input
                  id="edit-power"
                  value={newCar.power}
                  onChange={(e) => setNewCar({ ...newCar, power: e.target.value })}
                  placeholder="e.g., 150 bhp"
                />
              </div>
              <div className="col-span-2">
                <CarImageUpload
                  imageUrl={newCar.image_url}
                  onImageChange={(url) => setNewCar({ ...newCar, image_url: url })}
                  dealerId={dealerInfo?.id || ""}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newCar.description}
                  onChange={(e) => setNewCar({ ...newCar, description: e.target.value })}
                  placeholder="Car description..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditCarDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCar} disabled={isUpdatingCar}>
                {isUpdatingCar ? "Updating..." : "Update Car"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default DealerPanel;
