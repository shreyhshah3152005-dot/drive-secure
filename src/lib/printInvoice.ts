import { format } from "date-fns";

export interface InvoicePart {
  name: string;
  qty: number;
  price: number;
}

export interface PrintableInvoice {
  invoice_number: string;
  service_date?: string | Date;
  service_description?: string | null;
  parts: InvoicePart[];
  labor_charge: number;
  parts_total: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  notes?: string | null;
  provider?: { name: string; city?: string | null; phone?: string | null };
  vehicle?: { brand: string; model: string; year: number; registration: string; package?: string };
}

export const printInvoiceDocument = (inv: PrintableInvoice) => {
  const dateStr = format(inv.service_date ? new Date(inv.service_date) : new Date(), "dd MMM yyyy");
  const html = `
<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
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
      <h1>Invoice #${inv.invoice_number}</h1>
      <p>Date: ${dateStr}</p>
    </div>
  </div>
  <div class="grid">
    <div class="box">
      <h3>Service Provider</h3>
      <p><strong>${inv.provider?.name || "Service Provider"}</strong></p>
      ${inv.provider?.city ? `<p>${inv.provider.city}</p>` : ""}
      ${inv.provider?.phone ? `<p>${inv.provider.phone}</p>` : ""}
    </div>
    <div class="box">
      <h3>Vehicle</h3>
      ${inv.vehicle ? `
        <p><strong>${inv.vehicle.brand} ${inv.vehicle.model} (${inv.vehicle.year})</strong></p>
        <p>Reg: ${inv.vehicle.registration}</p>
        ${inv.vehicle.package ? `<p>Package: ${inv.vehicle.package}</p>` : ""}
      ` : "<p>—</p>"}
    </div>
  </div>

  <h3 style="font-size:14px;text-transform:uppercase;color:#888;letter-spacing:1px;">Service Performed</h3>
  <p style="margin:0 0 20px;font-size:14px;">${inv.service_description || "—"}</p>

  <table>
    <thead><tr><th>Part / Item</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Total</th></tr></thead>
    <tbody>
      ${inv.parts.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No parts replaced</td></tr>' : inv.parts.map(p => `
        <tr><td>${p.name}</td><td class="r">${p.qty}</td><td class="r">₹${Number(p.price).toFixed(2)}</td><td class="r">₹${(Number(p.qty)*Number(p.price)).toFixed(2)}</td></tr>
      `).join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Parts Total</td><td class="r">₹${Number(inv.parts_total).toFixed(2)}</td></tr>
    <tr><td>Labor Charge</td><td class="r">₹${Number(inv.labor_charge).toFixed(2)}</td></tr>
    <tr><td>Subtotal</td><td class="r">₹${Number(inv.subtotal).toFixed(2)}</td></tr>
    <tr><td>Tax (${inv.tax_percent}%)</td><td class="r">₹${Number(inv.tax_amount).toFixed(2)}</td></tr>
    <tr class="total"><td>Total Amount</td><td class="r">₹${Number(inv.total_amount).toFixed(2)}</td></tr>
  </table>

  ${inv.notes ? `<div class="notes"><strong>Notes:</strong> ${inv.notes}</div>` : ""}

  <div class="footer">Thank you for choosing CARBAZAAR Service · This is a computer-generated invoice</div>
  <script>window.onload=()=>{window.print();}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
};
