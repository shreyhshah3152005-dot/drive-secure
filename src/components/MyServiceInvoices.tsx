import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, Receipt, FileSpreadsheet, CheckCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { printInvoiceDocument, InvoicePart } from "@/lib/printInvoice";
import { downloadInvoicesCSV, downloadInvoicesPDF } from "@/lib/exportInvoices";

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
  payment_status: string | null;
  paid_at: string | null;
  payment_method: string | null;
}

interface BookingMeta {
  id: string;
  package_name: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_registration: string;
}

const MyServiceInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [bookings, setBookings] = useState<Record<string, BookingMeta>>({});
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    if (!user) return;
    const { data: inv } = await (supabase as any)
      .from("service_invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("service_date", { ascending: false });
    const list = (inv as InvoiceRow[]) || [];
    setInvoices(list);
    const ids = Array.from(new Set(list.map(i => i.booking_id)));
    if (ids.length) {
      const { data: bs } = await supabase
        .from("service_bookings")
        .select("id, package_name, car_brand, car_model, car_year, car_registration")
        .in("id", ids);
      const map: Record<string, BookingMeta> = {};
      (bs as BookingMeta[] || []).forEach(b => { map[b.id] = b; });
      setBookings(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`my-service-invoices-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "service_invoices", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    const refresh = () => load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => invoices.filter((i) => {
    if (fromDate && i.service_date < fromDate) return false;
    if (toDate && i.service_date > toDate) return false;
    if (statusFilter !== "all" && (i.payment_status || "unpaid") !== statusFilter) return false;
    return true;
  }), [invoices, fromDate, toDate, statusFilter]);

  const buildPrintable = (inv: InvoiceRow) => {
    const b = bookings[inv.booking_id];
    return {
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
      payment_status: inv.payment_status,
      paid_at: inv.paid_at,
      payment_method: inv.payment_method,
      vehicle: b ? {
        brand: b.car_brand, model: b.car_model, year: b.car_year,
        registration: b.car_registration, package: b.package_name,
      } : undefined,
      vehicle_label: b ? `${b.car_brand} ${b.car_model} (${b.car_registration})` : "",
    };
  };

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("Nothing to export"); return; }
    downloadInvoicesCSV(filtered.map(buildPrintable));
    toast.success(`Exported ${filtered.length} invoices`);
  };
  const exportPDF = () => {
    if (filtered.length === 0) { toast.error("Nothing to export"); return; }
    downloadInvoicesPDF(filtered.map(buildPrintable));
  };

  if (loading || invoices.length === 0) return null;

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Receipt className="w-5 h-5 text-primary" />
          My Service Invoices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}><FileSpreadsheet className="w-4 h-4 mr-1" />Export CSV</Button>
          <Button size="sm" variant="outline" onClick={exportPDF}><FileText className="w-4 h-4 mr-1" />Export PDF</Button>
          <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} of {invoices.length} bills</span>
        </div>
        {filtered.map((inv) => {
          const b = bookings[inv.booking_id];
          const isPaid = (inv.payment_status || "unpaid") === "paid";
          return (
            <div key={inv.id} className="p-3 rounded-lg border border-border/30 bg-secondary/20 flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono">{inv.invoice_number}</span>
                  <Badge variant="outline" className={isPaid ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-red-500/10 text-red-600 border-red-500/30"}>
                    {isPaid ? <CheckCircle className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                    {isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {format(new Date(inv.service_date), "dd MMM yyyy")} · {inv.service_description || "—"}
                  {b ? ` · ${b.car_brand} ${b.car_model} (${b.car_registration})` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-primary">₹{Number(inv.total_amount).toFixed(2)}</span>
                <Button size="sm" variant="outline" onClick={() => printInvoiceDocument(buildPrintable(inv))}>
                  <Printer className="w-3 h-3 mr-1" />Print
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MyServiceInvoices;
