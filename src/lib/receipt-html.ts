import type { ReceiptData } from "@/types/payments";

function formatNgn(amount: number): string {
  return amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    const hr = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${mon}/${yr} ${hr}:${min}`;
  } catch {
    return iso;
  }
}

export function buildReceiptHtml(r: ReceiptData): string {
  const initials = r.business_name
    ? r.business_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SP";

  const logoHtml = r.logo_url
    ? `<img src="${r.logo_url}" alt="Logo" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" />`
    : `<div class="logo">${initials}</div>`;

  const itemRows = r.items
    .map(
      (item) => `
      <div class="item-row">
        <span class="item-name">${item.qty} x ${item.product_name}</span>
        <span class="item-price">${formatNgn(item.unit_price)}</span>
        <span class="item-total">${formatNgn(item.line_total)}</span>
      </div>`,
    )
    .join("");

  const hasTax = r.tax > 0;
  const hasDiscount = r.discount > 0;

  const methodLabel =
    r.payment_method === "cash"
      ? "Cash"
      : r.payment_method === "card"
        ? "Card"
        : r.payment_method === "transfer"
          ? "Transfer"
          : r.payment_method === "split"
            ? "Split"
            : r.payment_method;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt ${r.receipt_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    padding: 24px 12px;
    background: #EDEBE3;
    display: flex;
    justify-content: center;
    font-family: 'Courier New', Courier, monospace;
  }
  .receipt {
    width: 300px;
    background: #FFFFFF;
    padding: 24px 18px 20px;
    color: #1A1A1A;
    position: relative;
  }
  .receipt::before,
  .receipt::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 10px;
    background: repeating-linear-gradient(-45deg, transparent, transparent 4px, #FFFFFF 4px, #FFFFFF 8px), #EDEBE3;
  }
  .receipt::before { top: -6px; }
  .receipt::after  { bottom: -6px; transform: scaleY(-1); }

  .logo {
    width: 44px;
    height: 44px;
    border: 2.5px solid #1A1A1A;
    border-radius: 50%;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
  }
  .logo-img {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    margin: 0 auto 10px;
  }
  .center { text-align: center; }
  h1 {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin: 0 0 6px;
  }
  .addr {
    font-size: 11px;
    line-height: 1.5;
    margin: 0;
  }
  .dashed {
    border: none;
    border-top: 1px dashed #1A1A1A;
    margin: 12px 0;
  }
  .solid {
    border: none;
    border-top: 1.5px solid #1A1A1A;
    margin: 12px 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .meta-row { font-size: 11px; }
  .item-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 8px;
  }
  .item-name { flex: 1; }
  .item-price { width: 65px; text-align: right; }
  .item-total { width: 70px; text-align: right; }
  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 700;
    margin: 10px 0;
  }
  .footer p { margin: 4px 0; font-size: 11px; }
  .thanks { font-weight: 700; font-size: 12px; }

  @media print {
    body { background: #FFFFFF; padding: 0; }
    .receipt { box-shadow: none; width: 100%; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      ${logoHtml}
      <h1>${r.business_name || "SALES RECEIPT"}</h1>
      ${r.store_name ? `<p class="addr">${r.store_name}</p>` : ""}
      ${r.store_address ? `<p class="addr">${r.store_address}</p>` : ""}
      ${r.business_phone ? `<p class="addr">Tel: ${r.business_phone}</p>` : ""}
    </div>

    <hr class="dashed">

    <div class="row meta-row">
      <span>${r.receipt_number}</span>
      <span>${formatDate(r.created_at)}</span>
    </div>
    ${r.customer_name ? `<div class="row meta-row"><span>Customer</span><span>${r.customer_name}</span></div>` : ""}

    <hr class="dashed">

    ${itemRows}

    <hr class="dashed">

    <div class="row"><span>Subtotal</span><span>${formatNgn(r.subtotal)}</span></div>
    ${hasDiscount ? `<div class="row"><span>Discount</span><span>-${formatNgn(r.discount)}</span></div>` : ""}
    ${hasTax ? `<div class="row"><span>Tax (VAT)</span><span>${formatNgn(r.tax)}</span></div>` : ""}

    <hr class="solid">

    <div class="total-row"><span>TOTAL</span><span>${formatNgn(r.total)}</span></div>

    <hr class="dashed">

    <div class="row"><span>Amount Paid</span><span>${formatNgn(r.amount_paid)}</span></div>
    <div class="row"><span>Method</span><span>${methodLabel}</span></div>

    <hr class="dashed">

    <div class="center footer">
      <p>${r.business_name || "SalesOS"}</p>
      <p class="thanks">Thank you, come again!</p>
    </div>
  </div>
</body>
</html>`;
}
