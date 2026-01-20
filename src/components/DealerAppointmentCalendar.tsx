import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDealerRole } from "@/hooks/useDealerRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, addDays, isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, Settings, X, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

interface BlockedSlot {
  id: string;
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface TestDriveAppointment {
  id: string;
  car_name: string;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
}

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const DealerAppointmentCalendar = () => {
  const { dealerInfo } = useDealerRole();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [appointments, setAppointments] = useState<TestDriveAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "18:00",
    slot_duration: "30",
  });
  const [newBlock, setNewBlock] = useState({
    blocked_date: new Date(),
    reason: "",
  });

  useEffect(() => {
    if (dealerInfo?.id) {
      fetchData();
    }
  }, [dealerInfo?.id]);

  const fetchData = async () => {
    if (!dealerInfo?.id) return;

    try {
      const [availRes, blockRes, apptRes] = await Promise.all([
        supabase.from("dealer_availability").select("*").eq("dealer_id", dealerInfo.id),
        supabase.from("dealer_blocked_slots").select("*").eq("dealer_id", dealerInfo.id),
        supabase.from("test_drive_inquiries").select("*").eq("dealer_id", dealerInfo.id).order("preferred_date", { ascending: true }),
      ]);

      if (availRes.error) throw availRes.error;
      if (blockRes.error) throw blockRes.error;
      if (apptRes.error) throw apptRes.error;

      setAvailability(availRes.data || []);
      setBlockedSlots(blockRes.data || []);
      setAppointments(apptRes.data || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    if (!dealerInfo?.id) return;

    try {
      const { error } = await supabase.from("dealer_availability").insert({
        dealer_id: dealerInfo.id,
        day_of_week: parseInt(newAvailability.day_of_week),
        start_time: newAvailability.start_time,
        end_time: newAvailability.end_time,
        slot_duration: parseInt(newAvailability.slot_duration),
      });

      if (error) throw error;

      toast.success("Availability added");
      setAvailabilityDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding availability:", error);
      toast.error("Failed to add availability");
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase.from("dealer_availability").delete().eq("id", id);
      if (error) throw error;
      toast.success("Availability removed");
      fetchData();
    } catch (error) {
      console.error("Error deleting availability:", error);
      toast.error("Failed to remove availability");
    }
  };

  const handleToggleAvailability = async (avail: Availability) => {
    try {
      const { error } = await supabase
        .from("dealer_availability")
        .update({ is_active: !avail.is_active })
        .eq("id", avail.id);

      if (error) throw error;
      toast.success(avail.is_active ? "Slot disabled" : "Slot enabled");
      fetchData();
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update availability");
    }
  };

  const handleBlockDate = async () => {
    if (!dealerInfo?.id) return;

    try {
      const { error } = await supabase.from("dealer_blocked_slots").insert({
        dealer_id: dealerInfo.id,
        blocked_date: format(newBlock.blocked_date, "yyyy-MM-dd"),
        reason: newBlock.reason || null,
      });

      if (error) throw error;

      toast.success("Date blocked");
      setBlockDialogOpen(false);
      setNewBlock({ blocked_date: new Date(), reason: "" });
      fetchData();
    } catch (error) {
      console.error("Error blocking date:", error);
      toast.error("Failed to block date");
    }
  };

  const handleUnblockDate = async (id: string) => {
    try {
      const { error } = await supabase.from("dealer_blocked_slots").delete().eq("id", id);
      if (error) throw error;
      toast.success("Date unblocked");
      fetchData();
    } catch (error) {
      console.error("Error unblocking date:", error);
      toast.error("Failed to unblock date");
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("test_drive_inquiries")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Appointment ${status}`);
      fetchData();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    }
  };

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  });

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.preferred_date), date));
  };

  const isDateBlocked = (date: Date) => {
    return blockedSlots.some((slot) => isSameDay(parseISO(slot.blocked_date), date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Week View
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Availability Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>Manage your test drive appointments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[180px] text-center">
                  {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
                </span>
                <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const isBlocked = isDateBlocked(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[200px] border rounded-lg p-2 ${
                        isBlocked ? "bg-red-50 dark:bg-red-950/20" : ""
                      } ${isToday ? "border-primary" : ""}`}
                    >
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                        <p className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                          {format(day, "d")}
                        </p>
                        {isBlocked && (
                          <Badge variant="destructive" className="text-xs">Blocked</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1.5 rounded border ${getStatusColor(apt.status)} cursor-pointer hover:opacity-80`}
                            onClick={() => setSelectedDate(day)}
                          >
                            <p className="font-medium truncate">{apt.preferred_time}</p>
                            <p className="truncate">{apt.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected date appointments */}
              {selectedDate && getAppointmentsForDate(selectedDate).length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="font-semibold mb-4">
                    Appointments for {format(selectedDate, "MMMM d, yyyy")}
                  </h3>
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDate).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{apt.preferred_time}</span>
                            <Badge variant="outline" className={getStatusColor(apt.status)}>
                              {apt.status}
                            </Badge>
                          </div>
                          <p className="mt-1">{apt.name} - {apt.car_name}</p>
                          <p className="text-sm text-muted-foreground">{apt.phone} | {apt.email}</p>
                        </div>
                        {apt.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, "confirmed")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, "cancelled")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Availability */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Weekly Availability</CardTitle>
                  <CardDescription>Set your regular working hours</CardDescription>
                </div>
                <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Availability</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Day of Week</Label>
                        <Select
                          value={newAvailability.day_of_week}
                          onValueChange={(v) => setNewAvailability({ ...newAvailability, day_of_week: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((d) => (
                              <SelectItem key={d.value} value={d.value.toString()}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Select
                            value={newAvailability.start_time}
                            onValueChange={(v) => setNewAvailability({ ...newAvailability, start_time: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Select
                            value={newAvailability.end_time}
                            onValueChange={(v) => setNewAvailability({ ...newAvailability, end_time: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Slot Duration (minutes)</Label>
                        <Select
                          value={newAvailability.slot_duration}
                          onValueChange={(v) => setNewAvailability({ ...newAvailability, slot_duration: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full" onClick={handleAddAvailability}>
                        Add Availability
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {availability.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {availability.map((avail) => (
                      <div
                        key={avail.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={avail.is_active}
                            onCheckedChange={() => handleToggleAvailability(avail)}
                          />
                          <div>
                            <p className="font-medium">
                              {daysOfWeek.find((d) => d.value === avail.day_of_week)?.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {avail.start_time} - {avail.end_time} ({avail.slot_duration} min slots)
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAvailability(avail.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blocked Dates */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Blocked Dates</CardTitle>
                  <CardDescription>Mark dates when you're unavailable</CardDescription>
                </div>
                <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Plus className="h-4 w-4 mr-1" />
                      Block Date
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block a Date</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Select Date</Label>
                        <Calendar
                          mode="single"
                          selected={newBlock.blocked_date}
                          onSelect={(d) => d && setNewBlock({ ...newBlock, blocked_date: d })}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <Label>Reason (optional)</Label>
                        <Input
                          placeholder="e.g., Holiday, Personal leave"
                          value={newBlock.reason}
                          onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                        />
                      </div>
                      <Button className="w-full" variant="destructive" onClick={handleBlockDate}>
                        Block This Date
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {blockedSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No blocked dates</p>
                ) : (
                  <div className="space-y-2">
                    {blockedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {format(parseISO(slot.blocked_date), "EEEE, MMMM d, yyyy")}
                          </p>
                          {slot.reason && (
                            <p className="text-sm text-muted-foreground">{slot.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblockDate(slot.id)}
                        >
                          Unblock
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealerAppointmentCalendar;
