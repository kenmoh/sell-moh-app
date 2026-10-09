/** Day-filling for the product charts.
 *
 * The API only returns days something happened; a chart needs every day in
 * the window, so each helper takes the range and the sparse points and
 * returns one point per calendar day in order.
 */

import type { ProductSalesPoint } from "@/types/reports";
import type { StockSeriesPoint } from "@/types/product";

const MAX_DAYS = 400;

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const shortLabel = (iso: string) => iso.slice(5).replace("-", "/");

const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Every calendar day from `fromDate` to `toDate`, inclusive, ISO-dated. */
export function eachDay(fromDate: string, toDate: string): string[] {
  const days: string[] = [];
  const cursor = parseDay(fromDate);
  const end = parseDay(toDate);
  while (cursor <= end && days.length < MAX_DAYS) {
    days.push(isoDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export interface SalesChartPoint {
  date: string;
  label: string;
  units: number;
  revenue: number;
}

export function fillSalesSeries(
  fromDate: string,
  toDate: string,
  items: ProductSalesPoint[],
): SalesChartPoint[] {
  const byDate = new Map(items.map((item) => [item.period.slice(0, 10), item]));
  return eachDay(fromDate, toDate).map((date) => {
    const hit = byDate.get(date);
    return {
      date,
      label: shortLabel(date),
      units: hit?.units_sold ?? 0,
      revenue: hit?.revenue ?? 0,
    };
  });
}

export interface StockChartPoint {
  date: string;
  label: string;
  balance: number;
}

export function fillStockSeries(
  fromDate: string,
  toDate: string,
  items: StockSeriesPoint[],
): StockChartPoint[] {
  const days = eachDay(fromDate, toDate);
  if (!items.length) {
    return days.map((date) => ({ date, label: shortLabel(date), balance: 0 }));
  }

  const byDate = new Map(items.map((item) => [item.date, item]));
  // Days before the first movement show the balance it started from, not 0.
  let carry = items[0].balance_before ?? items[0].balance;
  return days.map((date) => {
    const hit = byDate.get(date);
    if (hit) carry = hit.balance;
    return { date, label: shortLabel(date), balance: carry };
  });
}
