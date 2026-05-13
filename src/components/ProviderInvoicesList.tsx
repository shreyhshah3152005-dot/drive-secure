import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Printer, Download, FileSpreadsheet, FileText, CheckCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { printInvoiceDocument, InvoicePart } from "@/lib/printInvoice";
import { downloadInvoicesCSV, downloadInvoicesPDF } from "@/lib/exportInvoices";

interface InvoiceRow {
  id: string;
  booking_id: string;
  user_id: string;
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
  car_brand: string;
  car_model: string;
  car_year: number;
  car_registration: string;
  package_name: string;
}

interface Props {
  providerName: string;
  providerCity?: string;
  providerPhone?: string | null;
}

const ProviderInvoicesList = ({ providerName, providerCity, providerPhone }: Props) => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [bookings, setBookings] = useState<Record<string, BookingMeta>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data: inv } = await (supabase as any)
      .from("service_invoices").select("*")
      .order("service_date", { ascending: false });
    const list = (inv as InvoiceRow[]) || [];
    setInvoices(list);
    const ids = Array.from(new Set(list.map((i) => i.booking_id)));
    if (ids.length) {
      const { data: bs } = await supabase
        .from("service_bookings")
        .select("id, car_brand, car_model, car_year, car_registration, package_name")
        .in("id", ids);
      const map: Record<string, BookingMeta> = {};
      (bs as BookingMeta[] || []).forEach((b) => { map[b.id] = b; });
      setBookings(map);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("provider-invoices")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_invoices" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => invoices.filter((i) => {
    if (fromDate && i.service_date < fromDate) return false;
    if (toDate && i.service_date > toDate) return false;
    if (statusFilter !== "all" && (i.payment_status || "unpaid") !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const b = bookings[i.booking_id];
      const hay = `${i.invoice_number} ${i.service_description || ""} ${b ? `${b.car_brand} ${b.car_model} ${b.car_registration}` : ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [invoices, fromDate, toDate, statusFilter, search, bookings]);

  const togglePaid = async (inv: InvoiceRow) => {
    const isPaid = (inv.payment_status || "unpaid") === "paid";
    const next = isPaid ? "unpaid" : "paid";
    const { error } = await (supabase as any).from("service_invoices")
      .update({ payment_status: next, paid_at: isPaid ? null : new Date().toISOString() })
      .eq("id", inv.id);
    if (error) { toast.error("Failed to update payment status"); return; }
    toast.success(`Marked ${next.toUpperCase()}`);
    load();
  };

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
      provider: { name: providerName, city: providerCity, phone: providerPhone },
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
    toast.success(`Exported ${filtered.length} invoices to CSV`);
  };
  const exportPDF = () => {
    if (filtered.length === 0) { toast.error("Nothing to export"); return; }
    downloadInvoicesPDF(filtered.map(buildPrintable));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Saved Invoices</CardTitle>
        <p className="text-xs text-muted-foreground">Filter by date and payment status, then export to CSV/PDF or mark paid.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <Input placeholder="Search invoice / vehicle" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:col-span-2" />
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
          <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} of {invoices.length} invoices</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">No invoices match these filters.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((inv) => {
              const b = bookings[inv.booking_id];
              const isPaid = (inv.payment_status || "unpaid") === "paid";
              return (
                <div key={inv.id} className="p-3 rounded-lg border border-border/40 flex flex-wrap justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-sm">{inv.invoice_number}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {format(new Date(inv.service_date), "dd MMM yyyy")} · {b ? `${b.car_brand} ${b.car_model} (${b.car_registration})` : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={isPaid ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-red-500/10 text-red-600 border-red-500/30"}>
                      {isPaid ? <CheckCircle className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                      {isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                    <span className="font-bold text-primary">₹{Number(inv.total_amount).toFixed(2)}</span>
                    <Button size="sm" variant={isPaid ? "outline" : "default"} onClick={() => togglePaid(inv)}>
                      {isPaid ? "Mark Unpaid" : "Mark Paid"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => printInvoiceDocument(buildPrintable(inv))}>
                      <Printer className="w-3 h-3 mr-1" />Print
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderInvoicesList;
