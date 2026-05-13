import { format } from "date-fns";
import { buildInvoiceHtml, PrintableInvoice } from "@/lib/printInvoice";

export interface ExportableInvoice extends PrintableInvoice {
  vehicle_label?: string;
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadInvoicesCSV = (rows: ExportableInvoice[], filename = `invoices-${Date.now()}.csv`) => {
  const headers = [
    "Invoice #", "Date", "Vehicle", "Description", "Parts Total",
    "Labor", "Subtotal", "GST %", "GST Amount", "Total", "Payment Status", "Paid At",
  ];
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    lines.push([
      r.invoice_number,
      r.service_date ? format(new Date(r.service_date), "yyyy-MM-dd") : "",
      r.vehicle_label || (r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.registration})` : ""),
      r.service_description || "",
      r.parts_total, r.labor_charge, r.subtotal, r.tax_percent, r.tax_amount, r.total_amount,
      r.payment_status || "unpaid",
      r.paid_at ? format(new Date(r.paid_at), "yyyy-MM-dd HH:mm") : "",
    ].map(csvCell).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const downloadInvoicesPDF = (rows: ExportableInvoice[]) => {
  // Combine all invoice HTMLs in a single print window with page-breaks.
  const combined = rows.map((r, i) =>
    buildInvoiceHtml(r).replace("<body>", `<body>${i > 0 ? '<div style="page-break-before:always"></div>' : ""}`)
  ).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(combined + `<script>window.onload=()=>{window.print();}</script>`);
  w.document.close();
};
