import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Part {
  name: string;
  qty: number;
  price: number;
}

interface BookingLite {
  id: string;
  user_id: string;
  package_name: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_registration: string;
  booking_date: string;
}

interface Props {
  booking: BookingLite | null;
  providerName: string;
  providerCity?: string;
  providerPhone?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

const ServiceInvoiceDialog = ({ booking, providerName, providerCity, providerPhone, onClose, onSaved }: Props) => {
  const [parts, setParts] = useState<Part[]>([{ name: "", qty: 1, price: 0 }]);
  const [labor, setLabor] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [serviceDescription, setServiceDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!booking) return null;

  const partsTotal = parts.reduce((sum, p) => sum + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  const subtotal = partsTotal + Number(labor || 0);
  const taxAmount = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + taxAmount;

  const updatePart = (i: number, key: keyof Part, val: string | number) => {
    const next = [...parts];
    next[i] = { ...next[i], [key]: key === "name" ? val : Number(val) };
    setParts(next);
  };

  const handleSave = async (thenPrint = false) => {
    setSaving(true);
    try {
      const cleanParts = parts.filter((p) => p.name.trim());
      const { data, error } = await supabase
        .from("service_invoices")
        .insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          service_description: serviceDescription || booking.package_name,
          parts: cleanParts,
          labor_charge: labor,
          parts_total: partsTotal,
          subtotal,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          total_amount: total,
          notes,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Invoice saved");
      onSaved?.();
      if (thenPrint) printInvoice(data.invoice_number);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = (invoiceNumber: string) => {
    const cleanParts = parts.filter((p) => p.name.trim());
    const html = `
<!DOCTYPE html><html><head><title>Invoice ${invoiceNumber}</title>
<style>
  *{box-sizing:border-box;font-family:'Helvetica Neue',Arial,sans-serif;}
  body{margin:0;padding:40px;color:#1a1a1a;background:#fff;}
  .header{display:flex;justify-content:space-between;border-bottom:3px solid #b8860b;padding-bottom:20px;margin-bottom:30px;}
  .brand{font-size:28px;font-weight:700;color:#b8860b;letter-spacing:2px;}
  .brand span{color:#1a1a1a;}
  .meta{text-align:right;font-size:13px;color:#555;}
  h1{font-size:22px;margin:0 0 6px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px;}
  .box{border:1px solid #e5e5e5;padding:15px;border-radius:6px;}
  .box h3{margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#888;letter-spacing:1px;}
  .box p{margin:4px 0;font-size:14px;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  th{background:#1a1a1a;color:#fff;padding:10px;text-align:left;font-size:12px;text-transform:uppercase;}
  td{padding:10px;border-bottom:1px solid #eee;font-size:14px;}
  td.r,th.r{text-align:right;}
  .totals{margin-left:auto;width:300px;}
  .totals tr td{border:none;padding:6px 10px;}
  .totals .total{font-size:18px;font-weight:700;border-top:2px solid #1a1a1a;color:#b8860b;}
  .notes{margin-top:30px;padding:15px;background:#fafafa;border-left:4px solid #b8860b;font-size:13px;}
  .footer{margin-top:50px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee;padding-top:20px;}
  @media print{body{padding:20px;}}
</style></head><body>
  <div class="header">
    <div>
      <div class="brand">CAR<span>BAZAAR</span></div>
      <p style="margin:8px 0 0;font-size:12px;color:#666;">Service Invoice</p>
    </div>
    <div class="meta">
      <h1>Invoice #${invoiceNumber}</h1>
      <p>Date: ${format(new Date(), "dd MMM yyyy")}</p>
    </div>
  </div>
  <div class="grid">
    <div class="box">
      <h3>Service Provider</h3>
      <p><strong>${providerName}</strong></p>
      ${providerCity ? `<p>${providerCity}</p>` : ""}
      ${providerPhone ? `<p>${providerPhone}</p>` : ""}
    </div>
    <div class="box">
      <h3>Vehicle</h3>
      <p><strong>${booking.car_brand} ${booking.car_model} (${booking.car_year})</strong></p>
      <p>Reg: ${booking.car_registration}</p>
      <p>Package: ${booking.package_name}</p>
    </div>
  </div>

  <h3 style="font-size:14px;text-transform:uppercase;color:#888;letter-spacing:1px;">Service Performed</h3>
  <p style="margin:0 0 20px;font-size:14px;">${serviceDescription || booking.package_name}</p>

  <table>
    <thead><tr><th>Part / Item</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Total</th></tr></thead>
    <tbody>
      ${cleanParts.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No parts replaced</td></tr>' : cleanParts.map(p => `
        <tr><td>${p.name}</td><td class="r">${p.qty}</td><td class="r">₹${p.price.toFixed(2)}</td><td class="r">₹${(p.qty*p.price).toFixed(2)}</td></tr>
      `).join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Parts Total</td><td class="r">₹${partsTotal.toFixed(2)}</td></tr>
    <tr><td>Labor Charge</td><td class="r">₹${Number(labor).toFixed(2)}</td></tr>
    <tr><td>Subtotal</td><td class="r">₹${subtotal.toFixed(2)}</td></tr>
    <tr><td>Tax (${taxPercent}%)</td><td class="r">₹${taxAmount.toFixed(2)}</td></tr>
    <tr class="total"><td>Total Amount</td><td class="r">₹${total.toFixed(2)}</td></tr>
  </table>

  ${notes ? `<div class="notes"><strong>Notes:</strong> ${notes}</div>` : ""}

  <div class="footer">Thank you for choosing CARBAZAAR Service · This is a computer-generated invoice</div>
  <script>window.onload=()=>{window.print();}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Service Bill</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/30 text-sm">
            <p><strong>{booking.car_brand} {booking.car_model}</strong> — {booking.car_registration}</p>
            <p className="text-muted-foreground">{booking.package_name}</p>
          </div>

          <div className="space-y-2">
            <Label>Service description</Label>
            <Textarea
              placeholder="e.g. Full body wash, oil change, brake inspection..."
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Parts replaced</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setParts([...parts, { name: "", qty: 1, price: 0 }])}>
                <Plus className="w-3 h-3 mr-1" />Add part
              </Button>
            </div>
            <div className="space-y-2">
              {parts.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-6" placeholder="Part name" value={p.name} onChange={(e) => updatePart(i, "name", e.target.value)} />
                  <Input className="col-span-2" type="number" min={1} placeholder="Qty" value={p.qty} onChange={(e) => updatePart(i, "qty", e.target.value)} />
                  <Input className="col-span-3" type="number" min={0} placeholder="Price (₹)" value={p.price} onChange={(e) => updatePart(i, "price", e.target.value)} />
                  <Button type="button" size="icon" variant="ghost" className="col-span-1" onClick={() => setParts(parts.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Labor charge (₹)</Label>
              <Input type="number" min={0} value={labor} onChange={(e) => setLabor(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Tax %</Label>
              <Input type="number" min={0} max={100} value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea placeholder="Recommendations, next service due, warranty info..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="rounded-lg bg-secondary/30 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Parts</span><span>₹{partsTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Labor</span><span>₹{Number(labor).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax ({taxPercent}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-primary border-t border-border pt-1 mt-1"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />Save
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Printer className="w-4 h-4 mr-1" />Save & Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceInvoiceDialog;
