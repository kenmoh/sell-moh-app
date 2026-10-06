// Icons for the accounting screen's native header menu.
import AccountBalance from "@expo/material-symbols/account_balance.xml";
import Balance from "@expo/material-symbols/balance.xml";
import Book from "@expo/material-symbols/book.xml";
import CompareArrows from "@expo/material-symbols/compare_arrows.xml";
import Description from "@expo/material-symbols/description.xml";
import Payments from "@expo/material-symbols/payments.xml";
import TrendingUp from "@expo/material-symbols/trending_up.xml";

const isIOS = process.env.EXPO_OS === "ios";

const MENU_ICONS = {
  "chart-of-accounts": { sf: "book", material: Book },
  journals: { sf: "doc.text", material: Description },
  "trial-balance": { sf: "equal.circle", material: Balance },
  "profit-loss": { sf: "chart.line.uptrend.xyaxis", material: TrendingUp },
  "balance-sheet": { sf: "building.columns", material: AccountBalance },
  "cash-flow": { sf: "arrow.left.arrow.right", material: Payments },
  "compare-stores": { sf: "arrow.left.arrow.right.square", material: CompareArrows },
} as const;

export type AccountingMenuKey = keyof typeof MENU_ICONS;

export function getAccountingMenuIcon(id: string) {
  const entry = MENU_ICONS[id as AccountingMenuKey];
  return isIOS ? entry.sf : entry.material;
}