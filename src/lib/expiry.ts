/** Expiry helpers. Dates are date-only strings ("YYYY-MM-DD"). */

/** True when the expiry day has fully passed (end of day, local time). */
export function isProductExpired(expiryDate?: string | null): boolean {
  if (!expiryDate) return false;
  const [year, month, day] = expiryDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return false;
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  return endOfDay.getTime() < Date.now();
}

export function formatExpiryDate(expiryDate?: string | null): string {
  if (!expiryDate) return "";
  const [year, month, day] = expiryDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return expiryDate;
  return new Date(year, month - 1, day).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
