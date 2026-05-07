import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Props {
  registration: string | null;
  onClose: () => void;
}

interface BookingRow {
  id: string;
  package_name: string;
  booking_date: string;
  status: string;
  services_used: number;
  total_services: number;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  service_date: string;
  service_description: string | null;
  total_amount: number;
  parts: Array<{ name: string; qty: number; price: number }>;
}

const VehicleHistoryDialog = ({ registration, onClose }: Props) => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!registration) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: b } = await supabase
          .from("service_bookings")
          .select("id, package_name, booking_date, status, services_used, total_services")
          .eq("car_registration", registration)
          .order("booking_date", { ascending: false });
        setBookings((b as BookingRow[]) || []);

        const ids = (b || []).map((x) => x.id);
        if (ids.length > 0) {
          const { data: inv } = await (supabase as any)
            .from("service_invoices")
            .select("id, invoice_number, service_date, service_description, total_amount, parts")
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

  return (
    <Dialog open={!!registration} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Vehicle History — <span className="font-mono text-sm">{registration}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Past Bookings ({bookings.length})</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past bookings.</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
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

            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Past Invoices ({invoices.length})</h3>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices generated yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-3 rounded-lg border border-border/50 text-sm">
                      <div className="flex justify-between mb-1">
                        <p className="font-mono font-medium">{inv.invoice_number}</p>
                        <p className="font-bold text-primary">₹{Number(inv.total_amount).toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(inv.service_date), "dd MMM yyyy")} · {inv.service_description || "—"}</p>
                      {inv.parts && inv.parts.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Parts: {inv.parts.map((p) => p.name).join(", ")}
                        </p>
                      )}
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
