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
  payment_status?: string | null;
  paid_at?: string | Date | null;
  payment_method?: string | null;
  provider?: { name: string; city?: string | null; phone?: string | null };
  vehicle?: { brand: string; model: string; year: number; registration: string; package?: string };
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const money = (value: number) =>
  `\u20B9${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildInvoiceHtml = (inv: PrintableInvoice) => {
  const dateStr = format(inv.service_date ? new Date(inv.service_date) : new Date(), "dd MMM yyyy");
  const safeInvoiceNo = escapeHtml(inv.invoice_number);
  const safeProvider = inv.provider ? {
    name: escapeHtml(inv.provider.name),
    city: escapeHtml(inv.provider.city),
    phone: escapeHtml(inv.provider.phone),
  } : null;
  const safeVehicle = inv.vehicle ? {
    brand: escapeHtml(inv.vehicle.brand),
    model: escapeHtml(inv.vehicle.model),
    year: escapeHtml(inv.vehicle.year),
    registration: escapeHtml(inv.vehicle.registration),
    package: escapeHtml(inv.vehicle.package),
  } : null;
  const isPaid = (inv.payment_status || "unpaid").toLowerCase() === "paid";
  const statusLabel = isPaid ? "PAID" : "UNPAID";
  const statusBg = isPaid ? "#111111" : "#e11d1d";
  return `
<!DOCTYPE html><html><head><title>Invoice ${safeInvoiceNo}</title>
<style>
  *{box-sizing:border-box;font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;}
  body{margin:0;padding:34px;color:#111111;background:#f5f5f5;}
  .sheet{max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;box-shadow:0 24px 70px rgba(0,0,0,.18);}
  .topbar{height:10px;background:linear-gradient(90deg,#e11d1d 0%,#111111 100%);}
  .wrap{padding:34px;}
  .header{display:flex;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:1px solid #e5e5e5;}
  .brand{font-size:30px;font-weight:800;color:#e11d1d;letter-spacing:1.2px;line-height:1;}
  .brand span{color:#111111;}
  .subtitle{margin:9px 0 0;font-size:12px;color:#555555;text-transform:uppercase;letter-spacing:1.4px;}
  .invoice-chip{display:inline-block;margin-bottom:8px;padding:7px 12px;border-radius:999px;background:${statusBg};color:#ffffff;font-size:12px;font-weight:700;letter-spacing:.7px;}
  .meta{text-align:right;font-size:13px;color:#555555;}
  h1{font-size:24px;margin:0 0 6px;color:#111111;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0;}
  .box{border:1px solid #e5e5e5;background:#fafafa;padding:16px;border-radius:8px;min-height:116px;}
  .box h3,.section-title{margin:0 0 10px;font-size:11px;text-transform:uppercase;color:#e11d1d;letter-spacing:1.2px;}
  .box p{margin:4px 0;font-size:14px;color:#111111;}
  table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:20px;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;}
  th{background:#111111;color:#ffffff;padding:12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.7px;}
  td{padding:12px;border-bottom:1px solid #efefef;font-size:13px;color:#111111;}
  tr:last-child td{border-bottom:none;}
  td.r,th.r{text-align:right;}
  .totals-wrap{display:flex;justify-content:flex-end;}
  .totals{width:340px;border:none;border-radius:0;}
  .totals tr td{border:none;padding:7px 10px;background:#ffffff;font-size:13px;}
  .totals .sub td{border-top:1px dashed #cccccc;font-weight:600;color:#111111;padding-top:10px;}
  .totals .total td{font-size:18px;font-weight:800;border-top:2px solid #e11d1d;color:#e11d1d;padding-top:12px;}
  .section-block{margin-bottom:20px;}
  .subtotal-row td{background:#fafafa !important;font-size:12px;color:#555555;}
  .notes{margin-top:24px;padding:15px;background:#fafafa;border-left:4px solid #e11d1d;font-size:13px;line-height:1.5;color:#111111;}
  .signature{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:42px;font-size:12px;color:#555555;}
  .line{border-top:1px solid #cccccc;padding-top:8px;text-align:center;}
  .footer{margin-top:28px;text-align:center;font-size:11px;color:#555555;border-top:1px solid #e5e5e5;padding-top:16px;}
  @page{size:A4;margin:12mm;}
  @media print{body{padding:0;background:#ffffff;}.sheet{box-shadow:none;border:none;}.wrap{padding:24px;}}
</style></head><body>
<div class="sheet"><div class="topbar"></div><div class="wrap">
  <div class="header">
    <div>
      <div class="brand">CAR<span>BAZAAR</span></div>
      <p class="subtitle">Authorised Service Invoice</p>
    </div>
    <div class="meta">
      <span class="invoice-chip">${statusLabel}</span>
      <h1>Invoice #${safeInvoiceNo}</h1>
      <p>Date: ${dateStr}</p>
      ${inv.payment_method ? `<p>Method: ${escapeHtml(inv.payment_method)}</p>` : ""}
    </div>
  </div>
  <div class="grid">
    <div class="box">
      <h3>Service Provider</h3>
      <p><strong>${safeProvider?.name || "Service Provider"}</strong></p>
      ${safeProvider?.city ? `<p>${safeProvider.city}</p>` : ""}
      ${safeProvider?.phone ? `<p>Phone: ${safeProvider.phone}</p>` : ""}
    </div>
    <div class="box">
      <h3>Vehicle</h3>
      ${safeVehicle ? `
        <p><strong>${safeVehicle.brand} ${safeVehicle.model} (${safeVehicle.year})</strong></p>
        <p>Registration: ${safeVehicle.registration}</p>
        ${safeVehicle.package ? `<p>Package: ${safeVehicle.package}</p>` : ""}
      ` : "<p>—</p>"}
    </div>
  </div>

  <div class="section-block">
    <h3 class="section-title">A. Service / Labor Performed</h3>
    <table>
      <thead><tr><th>Description</th><th class="r">Charge</th></tr></thead>
      <tbody>
        <tr>
          <td>${escapeHtml(inv.service_description || "—")}</td>
          <td class="r">${money(inv.labor_charge)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section-block">
    <h3 class="section-title">B. Parts / Items Replaced</h3>
    <table>
      <thead><tr><th>Part / Item</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Total</th></tr></thead>
      <tbody>
        ${inv.parts.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#7a90a8;">No parts replaced</td></tr>' : inv.parts.map(p => `
          <tr><td>${escapeHtml(p.name)}</td><td class="r">${Number(p.qty || 0)}</td><td class="r">${money(Number(p.price))}</td><td class="r">${money(Number(p.qty)*Number(p.price))}</td></tr>
        `).join("")}
        <tr class="subtotal-row"><td colspan="3" class="r"><strong>Parts Subtotal</strong></td><td class="r"><strong>${money(inv.parts_total)}</strong></td></tr>
      </tbody>
    </table>
  </div>

  <div class="totals-wrap">
  <table class="totals">
    <tr><td>A. Labor Total</td><td class="r">${money(inv.labor_charge)}</td></tr>
    <tr><td>B. Parts Total</td><td class="r">${money(inv.parts_total)}</td></tr>
    <tr class="sub"><td>Subtotal (A + B)</td><td class="r">${money(inv.subtotal)}</td></tr>
    <tr><td>GST @ ${Number(inv.tax_percent || 0)}%</td><td class="r">${money(inv.tax_amount)}</td></tr>
    <tr class="total"><td>Grand Total</td><td class="r">${money(inv.total_amount)}</td></tr>
  </table>
  </div>

  ${inv.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(inv.notes)}</div>` : ""}

  <div class="signature"><div class="line">Customer Signature</div><div class="line">Service Provider Signature</div></div>
  <div class="footer">Thank you for choosing CARBAZAAR Service · This is a computer-generated invoice</div>
  </div></div>
</body></html>`;
};

export const printInvoiceDocument = (inv: PrintableInvoice) => {
  const html = buildInvoiceHtml(inv) + `<script>window.onload=()=>{window.print();}</script>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
};
