/** Expiry helpers. Dates are date-only strings ("YYYY-MM-DD"). */

function parseExpiryDay(expiryDate?: string | null): Date | null {
  if (!expiryDate) return null;
  const [year, month, day] = expiryDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Whole days until the printed expiry day. 0 means it expires today;
 * negative values mean the day has passed.
 */
export function daysUntilExpiry(
  expiryDate?: string | null,
  now = new Date(),
): number | null {
  const expiryDay = parseExpiryDay(expiryDate);
  if (!expiryDay) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (expiryDay.getTime() - startOfToday(now).getTime()) / msPerDay,
  );
}

/** True when the expiry day has fully passed (end of day, local time). */
export function isProductExpired(expiryDate?: string | null): boolean {
  const daysLeft = daysUntilExpiry(expiryDate);
  return daysLeft !== null && daysLeft < 0;
}

/**
 * True when the product is inside its own warning window. A product with no
 * warning window never counts as near expiry; expired is handled separately.
 */
export function isProductExpiringSoon(
  expiryDate?: string | null,
  warningDays?: number | null,
): boolean {
  if (warningDays == null) return false;
  const daysLeft = daysUntilExpiry(expiryDate);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= warningDays;
}

export function formatExpiryDate(expiryDate?: string | null): string {
  const expiryDay = parseExpiryDay(expiryDate);
  if (!expiryDay) return expiryDate ?? "";
  return expiryDay.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
