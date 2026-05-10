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

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const printInvoiceDocument = (inv: PrintableInvoice) => {
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
  const html = `
<!DOCTYPE html><html><head><title>Invoice ${safeInvoiceNo}</title>
<style>
  *{box-sizing:border-box;font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;}
  body{margin:0;padding:34px;color:#171717;background:#f7f3ea;}
  .sheet{max-width:860px;margin:0 auto;background:#fff;border:1px solid #e7dcc8;box-shadow:0 24px 70px rgba(28,22,12,.12);}
  .topbar{height:10px;background:linear-gradient(90deg,#b8860b,#191715);}
  .wrap{padding:34px;}
  .header{display:flex;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:1px solid #e7dcc8;}
  .brand{font-size:30px;font-weight:800;color:#b8860b;letter-spacing:1.2px;line-height:1;}
  .brand span{color:#191715;}
  .subtitle{margin:9px 0 0;font-size:12px;color:#6b6252;text-transform:uppercase;letter-spacing:1.4px;}
  .invoice-chip{display:inline-block;margin-bottom:8px;padding:7px 12px;border-radius:999px;background:#191715;color:#fff;font-size:12px;font-weight:700;letter-spacing:.7px;}
  .meta{text-align:right;font-size:13px;color:#5f5749;}
  h1{font-size:24px;margin:0 0 6px;color:#191715;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0;}
  .box{border:1px solid #e7dcc8;background:#fffaf0;padding:16px;border-radius:8px;min-height:116px;}
  .box h3,.section-title{margin:0 0 10px;font-size:11px;text-transform:uppercase;color:#8c7a57;letter-spacing:1.2px;}
  .box p{margin:4px 0;font-size:14px;color:#28231c;}
  .service-box{margin-bottom:22px;padding:16px;border-radius:8px;background:#191715;color:#fff;}
  .service-box .section-title{color:#d8b15b;}
  .service-box p{margin:0;font-size:14px;line-height:1.55;}
  table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:20px;border:1px solid #e7dcc8;border-radius:8px;overflow:hidden;}
  th{background:#191715;color:#fff;padding:12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.7px;}
  td{padding:12px;border-bottom:1px solid #eee4d3;font-size:13px;color:#27231d;}
  tr:last-child td{border-bottom:none;}
  td.r,th.r{text-align:right;}
  .totals-wrap{display:flex;justify-content:flex-end;}
  .totals{width:330px;border:none;border-radius:0;}
  .totals tr td{border:none;padding:7px 10px;background:#fff;}
  .totals .total td{font-size:18px;font-weight:800;border-top:2px solid #191715;color:#b8860b;padding-top:12px;}
  .notes{margin-top:24px;padding:15px;background:#fffaf0;border-left:4px solid #b8860b;font-size:13px;line-height:1.5;}
  .signature{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:42px;font-size:12px;color:#756b5d;}
  .line{border-top:1px solid #bdb29f;padding-top:8px;text-align:center;}
  .footer{margin-top:28px;text-align:center;font-size:11px;color:#817766;border-top:1px solid #e7dcc8;padding-top:16px;}
  @page{size:A4;margin:12mm;}
  @media print{body{padding:0;background:#fff;}.sheet{box-shadow:none;border:none;}.wrap{padding:24px;}}
</style></head><body>
<div class="sheet"><div class="topbar"></div><div class="wrap">
  <div class="header">
    <div>
      <div class="brand">CAR<span>BAZAAR</span></div>
      <p class="subtitle">Authorised Service Invoice</p>
    </div>
    <div class="meta">
      <span class="invoice-chip">PAID SERVICE BILL</span>
      <h1>Invoice #${safeInvoiceNo}</h1>
      <p>Date: ${dateStr}</p>
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
        ${inv.parts.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No parts replaced</td></tr>' : inv.parts.map(p => `
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
  <script>window.onload=()=>{window.print();}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
};
