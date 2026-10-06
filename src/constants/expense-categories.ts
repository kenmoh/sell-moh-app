/**
 * Expense categories, mirroring EXPENSE_CATEGORY_ACCOUNT_MAP in
 * app/accounting/seed.py and the CASE inside fn_create_expense /
 * fn_create_accounts_payable.
 *
 * Both endpoints resolve the account code server-side from this list, so a
 * client cannot point a bill or an expense at an arbitrary account. Keep the
 * ids in step with the backend map when adding one.
 */
export const EXPENSE_CATEGORIES = [
  { id: "rent", label: "Rent", icon: "home" },
  { id: "utilities", label: "Utilities", icon: "zap" },
  { id: "salaries", label: "Salaries", icon: "users" },
  { id: "supplies", label: "Supplies", icon: "package" },
  { id: "transport", label: "Transport", icon: "truck" },
  { id: "marketing", label: "Marketing", icon: "megaphone" },
  { id: "bank_charges", label: "Bank charges", icon: "landmark" },
  { id: "phone_internet", label: "Phone & internet", icon: "wifi" },
  { id: "maintenance", label: "Maintenance", icon: "wrench" },
  { id: "insurance", label: "Insurance", icon: "shield" },
  { id: "taxes", label: "Taxes", icon: "receipt" },
  { id: "other", label: "Other", icon: "ellipsis" },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]["id"];

export const DEFAULT_EXPENSE_CATEGORY: ExpenseCategoryId = "other";