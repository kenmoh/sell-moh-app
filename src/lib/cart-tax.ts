/**
 * What the cart owes in tax, computed the way the backend computes it.
 *
 * The server is the source of truth -- it reads each product's own taxes when
 * the sale is created -- but the customer is shown a figure before paying, so
 * the two have to agree to the naira. That means the same two rules as
 * app/taxes/calc.py:
 *
 * * a line is taxed by the taxes assigned to that product, not by every tax
 *   the tenant happens to have defined;
 * * tax is owed on what the customer actually pays, so a cart discount comes
 *   off first and is spread across lines by gross share.
 */

export interface CartTaxEntry {
  id?: string | null;
  name: string;
  rate: number;
  account_code?: string;
}

export interface CartTaxLine {
  name: string;
  rate: number;
  amount: number;
}

export interface CartTaxResult {
  /** The taxes charged, grouped the way a receipt lists them. */
  breakdown: CartTaxLine[];
  /** Sum of `breakdown`, already rounded to kobo. */
  totalTax: number;
}

export interface CartTaxableItem {
  quantity: number;
  product: { price: number; taxes?: CartTaxEntry[] | null };
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
// The share that is left over has to survive many small subtractions before
// the last line takes it, so it is carried at the backend's precision rather
// than being rounded to kobo on the way.
const round10 = (value: number) => Math.round(value * 1e10) / 1e10;

export function computeCartTax(
  items: CartTaxableItem[],
  discountAmount = 0,
): CartTaxResult {
  if (items.length === 0) return { breakdown: [], totalTax: 0 };

  const grosses = items.map((item) => item.product.price * item.quantity);
  const subtotal = grosses.reduce((sum, gross) => sum + gross, 0);
  const discount = Math.max(discountAmount, 0);

  // Spread the discount by gross share, last line taking the remainder, so
  // the rounded figures still add up to the discount the customer was given.
  let remaining = discount;
  const shares = grosses.map((gross, index) => {
    if (index === grosses.length - 1) return remaining;
    const share = subtotal > 0 ? discount * (gross / subtotal) : 0;
    const capped = Math.min(share, remaining);
    remaining = round10(remaining - capped);
    return capped;
  });

  const grouped = new Map<string, CartTaxLine & { account_code?: string }>();

  items.forEach((item, index) => {
    const base = Math.max(grosses[index] - shares[index], 0);
    const seen = new Set<string>();

    for (const tax of item.product.taxes ?? []) {
      const key = tax.id ?? tax.name;
      if (seen.has(key)) continue;
      seen.add(key);

      const rate = Number(tax.rate) || 0;
      const amount = round2((base * rate) / 100);
      const groupKey = `${tax.name}|${rate}|${tax.account_code ?? ""}`;
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.amount = round2(existing.amount + amount);
      } else {
        grouped.set(groupKey, {
          name: tax.name,
          rate,
          amount,
          account_code: tax.account_code,
        });
      }
    }
  });

  const breakdown = [...grouped.values()].filter((line) => line.amount !== 0);
  return {
    breakdown,
    totalTax: round2(breakdown.reduce((sum, line) => sum + line.amount, 0)),
  };
}
