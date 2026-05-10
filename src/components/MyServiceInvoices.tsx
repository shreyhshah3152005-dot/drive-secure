import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Receipt } from "lucide-react";
import { format } from "date-fns";
import { printInvoiceDocument, InvoicePart } from "@/lib/printInvoice";

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
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const reprint = (inv: InvoiceRow) => {
    const b = bookings[inv.booking_id];
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
      vehicle: b ? {
        brand: b.car_brand, model: b.car_model, year: b.car_year,
        registration: b.car_registration, package: b.package_name,
      } : undefined,
    });
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
      <CardContent className="space-y-2">
        {invoices.map((inv) => {
          const b = bookings[inv.booking_id];
          return (
            <div key={inv.id} className="p-3 rounded-lg border border-border/30 bg-secondary/20 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono">{inv.invoice_number}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {format(new Date(inv.service_date), "dd MMM yyyy")} · {inv.service_description || "—"}
                  {b ? ` · ${b.car_brand} ${b.car_model} (${b.car_registration})` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-primary">₹{Number(inv.total_amount).toFixed(2)}</span>
                <Button size="sm" variant="outline" onClick={() => reprint(inv)}>
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
