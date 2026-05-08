import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Printer, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { printInvoiceDocument, InvoicePart } from "@/lib/printInvoice";

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
  const [parts, setParts] = useState<InvoicePart[]>([{ name: "", qty: 1, price: 0 }]);
  const [labor, setLabor] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [serviceDescription, setServiceDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const partsTotal = parts.reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
    const laborNum = Number(labor) || 0;
    const taxPct = Math.max(0, Math.min(100, Number(taxPercent) || 0));
    const subtotal = partsTotal + laborNum;
    const taxAmount = +(subtotal * taxPct / 100).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);
    return { partsTotal: +partsTotal.toFixed(2), laborNum, taxPct, subtotal: +subtotal.toFixed(2), taxAmount, total };
  }, [parts, labor, taxPercent]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!serviceDescription.trim() && !booking?.package_name) errors.push("Service description is required");
    parts.forEach((p, i) => {
      if (p.name.trim()) {
        if (!Number.isFinite(Number(p.qty)) || Number(p.qty) <= 0) errors.push(`Part ${i + 1}: qty must be > 0`);
        if (!Number.isFinite(Number(p.price)) || Number(p.price) < 0) errors.push(`Part ${i + 1}: price must be ≥ 0`);
      } else if (Number(p.qty) > 0 && Number(p.price) > 0) {
        errors.push(`Part ${i + 1}: name is required`);
      }
    });
    if (Number(labor) < 0) errors.push("Labor charge cannot be negative");
    if (totals.total <= 0) errors.push("Invoice total must be greater than 0");
    return errors;
  }, [parts, labor, serviceDescription, booking, totals.total]);

  if (!booking) return null;

  const updatePart = (i: number, key: keyof InvoicePart, val: string | number) => {
    const next = [...parts];
    next[i] = { ...next[i], [key]: key === "name" ? String(val) : Number(val) };
    setParts(next);
  };

  const handleSave = async (thenPrint = false) => {
    if (validation.length > 0) {
      toast.error(validation[0]);
      return;
    }
    setSaving(true);
    try {
      const cleanParts = parts.filter((p) => p.name.trim()).map(p => ({ name: p.name.trim(), qty: Number(p.qty), price: Number(p.price) }));
      const desc = serviceDescription.trim() || booking.package_name;
      const { data, error } = await (supabase as any)
        .from("service_invoices")
        .insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          service_description: desc,
          parts: cleanParts,
          labor_charge: totals.laborNum,
          parts_total: totals.partsTotal,
          subtotal: totals.subtotal,
          tax_percent: totals.taxPct,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Invoice saved");
      onSaved?.();
      if (thenPrint) {
        printInvoiceDocument({
          invoice_number: data.invoice_number,
          service_date: data.service_date,
          service_description: desc,
          parts: cleanParts,
          labor_charge: totals.laborNum,
          parts_total: totals.partsTotal,
          subtotal: totals.subtotal,
          tax_percent: totals.taxPct,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          notes,
          provider: { name: providerName, city: providerCity, phone: providerPhone },
          vehicle: {
            brand: booking.car_brand, model: booking.car_model, year: booking.car_year,
            registration: booking.car_registration, package: booking.package_name,
          },
        });
      }
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
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
            <Label>Service description *</Label>
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
            <div className="flex justify-between"><span>Parts</span><span>₹{totals.partsTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Labor</span><span>₹{totals.laborNum.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax ({totals.taxPct}%)</span><span>₹{totals.taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-primary border-t border-border pt-1 mt-1"><span>Total</span><span>₹{totals.total.toFixed(2)}</span></div>
          </div>

          {validation.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <ul className="space-y-0.5">{validation.map((e, i) => <li key={i}>• {e}</li>)}</ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving || validation.length > 0}>
            <Save className="w-4 h-4 mr-1" />Save
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving || validation.length > 0}>
            <Printer className="w-4 h-4 mr-1" />Save & Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceInvoiceDialog;
