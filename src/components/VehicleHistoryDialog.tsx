import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, FileText, Calendar, Printer, Filter } from "lucide-react";
import { format } from "date-fns";
import { printInvoiceDocument, InvoicePart } from "@/lib/printInvoice";

interface Props {
  registration: string | null;
  providerName?: string;
  providerCity?: string;
  providerPhone?: string | null;
  onClose: () => void;
}

interface BookingRow {
  id: string;
  package_name: string;
  booking_date: string;
  status: string;
  services_used: number;
  total_services: number;
  car_brand: string;
  car_model: string;
  car_year: number;
}

interface InvoiceRow {
  id: string;
  booking_id: string;
  invoice_number: string;
  service_date: string;
  service_description: string | null;
  total_amount: number;
  parts: InvoicePart[];
  parts_total: number;
  labor_charge: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  notes: string | null;
}

const VehicleHistoryDialog = ({ registration, providerName, providerCity, providerPhone, onClose }: Props) => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [serviceType, setServiceType] = useState("all");

  useEffect(() => {
    if (!registration) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: b } = await supabase
          .from("service_bookings")
          .select("id, package_name, booking_date, status, services_used, total_services, car_brand, car_model, car_year")
          .eq("car_registration", registration)
          .order("booking_date", { ascending: false });
        setBookings((b as BookingRow[]) || []);

        const ids = (b || []).map((x) => x.id);
        if (ids.length > 0) {
          const { data: inv } = await (supabase as any)
            .from("service_invoices")
            .select("*")
            .in("booking_id", ids)
            .order("service_date", { ascending: false });
          setInvoices((inv as InvoiceRow[]) || []);
        } else {
          setInvoices([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registration]);

  const matchType = (text: string) => {
    if (serviceType === "all") return true;
    const t = text.toLowerCase();
    if (serviceType === "wash") return t.includes("wash");
    if (serviceType === "service") return !t.includes("wash");
    return true;
  };

  const inDate = (d: string) => {
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  const filteredBookings = useMemo(
    () => bookings.filter((b) => inDate(b.booking_date) && matchType(b.package_name)),
    [bookings, fromDate, toDate, serviceType]
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((i) => inDate(i.service_date) && matchType(i.service_description || "")),
    [invoices, fromDate, toDate, serviceType]
  );

  const reprint = (inv: InvoiceRow) => {
    const b = bookings.find((x) => x.id === inv.booking_id);
    printInvoiceDocument({
      invoice_number: inv.invoice_number,
      service_date: inv.service_date,
      service_description: inv.service_description,
      parts: inv.parts || [],
      labor_charge: inv.labor_charge,
      parts_total: inv.parts_total,
      subtotal: inv.subtotal,
      tax_percent: inv.tax_percent,
      tax_amount: inv.tax_amount,
      total_amount: inv.total_amount,
      notes: inv.notes,
      provider: { name: providerName || "Service Provider", city: providerCity, phone: providerPhone },
      vehicle: b ? {
        brand: b.car_brand, model: b.car_model, year: b.car_year,
        registration: registration!, package: b.package_name,
      } : undefined,
    });
  };

  const currentUsage = useMemo(() => {
    // Most recent (active) booking for this registration
    const latest = bookings[0];
    if (!latest) return null;
    return {
      services_used: latest.services_used,
      total_services: latest.total_services,
      package: latest.package_name,
    };
  }, [bookings]);

  return (
    <Dialog open={!!registration} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Vehicle History — <span className="font-mono text-sm">{registration}</span>
          </DialogTitle>
        </DialogHeader>

        {currentUsage && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm flex flex-wrap gap-4 items-center mb-2">
            <span className="font-semibold text-primary">Current usage</span>
            <span>Plan: <strong>{currentUsage.package}</strong></span>
            <span>Services: <strong>{currentUsage.services_used}/{currentUsage.total_services}</strong></span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" />Type</label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="wash">Washes</SelectItem>
                <SelectItem value="service">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Invoice Timeline ({filteredInvoices.length})</h3>
              {filteredInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices match your filters.</p>
              ) : (
                <div className="relative pl-6 space-y-3 border-l-2 border-primary/20">
                  {filteredInvoices.map((inv) => (
                    <div key={inv.id} className="relative">
                      <span className="absolute -left-[27px] top-2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="p-3 rounded-lg border border-border/50 text-sm">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div>
                            <p className="font-mono font-medium">{inv.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(inv.service_date), "dd MMM yyyy")} · {inv.service_description || "—"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-primary">₹{Number(inv.total_amount).toFixed(2)}</p>
                            <Button size="sm" variant="outline" onClick={() => reprint(inv)}>
                              <Printer className="w-3 h-3 mr-1" />Print
                            </Button>
                          </div>
                        </div>
                        {inv.parts && inv.parts.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Parts: {inv.parts.map((p) => `${p.name}×${p.qty}`).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Past Bookings ({filteredBookings.length})</h3>
              {filteredBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past bookings match your filters.</p>
              ) : (
                <div className="space-y-2">
                  {filteredBookings.map((b) => (
                    <div key={b.id} className="p-3 rounded-lg border border-border/50 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{b.package_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(b.booking_date), "dd MMM yyyy")} · Services: {b.services_used}/{b.total_services}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{b.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VehicleHistoryDialog;
