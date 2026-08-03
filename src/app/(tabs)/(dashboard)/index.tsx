import AddExpenseSheet from "@/components/add-expense-sheet";
import { Colors } from "@/constants/theme";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const stats = [
  {
    label: "Items Sold",
    value: "94 units",
    sub: "across 18 orders",
    icon: "shopping-bag" as const,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  {
    label: "Cash Collected",
    value: "₦38,500",
    sub: "14 transactions",
    icon: "wallet" as const,
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.1)",
  },
  {
    label: "Card Payments",
    value: "₦8,750",
    sub: "4 transactions",
    icon: "credit-card" as const,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  {
    label: "Voided",
    value: "₦850",
    sub: "1 order",
    icon: "x-circle" as const,
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
  },
];

const topProducts = [
  { rank: 1, name: "Coca-Cola 50cl", category: "Beverages", units: 28, price: "₦12,600" },
  { rank: 2, name: "Indomie Chicken", category: "Food", units: 22, price: "₦7,700" },
  { rank: 3, name: "Peak Milk", category: "Dairy", units: 15, price: "₦40,500" },
];

const categoryMeta: Record<string, { icon: string; color: string; bg: string }> = {
  utility: { icon: "zap", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  rent: { icon: "home", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  supplies: { icon: "package", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  salaries: { icon: "users", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  maintenance: { icon: "wrench", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  misc: { icon: "more-horizontal", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

const categoryLabels: Record<string, string> = {
  utility: "Utility Bills",
  rent: "Rent",
  supplies: "Supplies",
  salaries: "Salaries",
  maintenance: "Maintenance",
  misc: "Miscellaneous",
};

interface Expense {
  id: string;
  category: string;
  amount: string;
  note: string;
  time: string;
}

const initialExpenses: Expense[] = [
  { id: "1", category: "utility", amount: "₦12,500", note: "Electricity bill — December", time: "2:30 PM" },
  { id: "2", category: "supplies", amount: "₦3,200", note: "Printer paper & toner", time: "11:15 AM" },
  { id: "3", category: "maintenance", amount: "₦5,000", note: "AC servicing", time: "Yesterday" },
];

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const formatDate = (d: Date) => {
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return "Today";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalExpenses = expenses.reduce((sum, e) => {
    const val = parseInt(e.amount.replace(/[₦,]/g, ""), 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleAddExpense = (expense: { category: string; amount: string; note: string }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: expense.category,
      amount: `₦${Number(expense.amount).toLocaleString()}`,
      note: expense.note,
      time: "Just now",
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View>
            <Text style={[styles.appLabel, { color: colors.textSecondary }]}>
              StoreFlow POS
            </Text>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Dashboard
            </Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: "#3b82f6" }]}>
            <Text style={styles.avatarText}>AO</Text>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelectorRow}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={[
              styles.datePill,
              { backgroundColor: colors.card, borderColor: colors.backgroundElement },
            ]}
          >
            <Lucide name="calendar" size={16} color={colors.text} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(date)}
            </Text>
            <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
              onDismiss={() => setShowPicker(false)}
            />
          )}
        </View>

        {/* Revenue Card */}
        <View style={[styles.revenueCard]}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueLabelRow}>
              <Lucide name="calendar" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.revenueLabel}>Total Revenue</Text>
            </View>
            <Text style={styles.revenueDate}>Dec 14, 2024</Text>
          </View>
          <Text style={styles.revenueAmount}>₦47,250</Text>
          <View style={styles.revenueFooter}>
            <View style={styles.revenueStat}>
              <Lucide name="receipt" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.revenueStatText}>Orders: 18</Text>
            </View>
            <View style={styles.revenueStat}>
              <Lucide name="trending-up" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.revenueStatText}>Avg: ₦2,625</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.statIconBadge, { backgroundColor: stat.bg }]}>
                <Lucide name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>
                {stat.sub}
              </Text>
            </View>
          ))}
        </View>

        {/* Expenses Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            EXPENSES TODAY
          </Text>
          <Pressable
            style={styles.addExpenseLink}
            onPress={() => setAddExpenseVisible(true)}
          >
            <Lucide name="plus" size={14} color="#3b82f6" />
            <Text style={styles.addExpenseLinkText}>Add</Text>
          </Pressable>
        </View>

        {/* Expense Summary */}
        <View style={[styles.expenseSummary, { backgroundColor: colors.card }]}>
          <View style={styles.expenseSummaryLeft}>
            <View style={[styles.expenseSummaryIcon, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
              <Lucide name="trending-down" size={18} color="#ef4444" />
            </View>
            <View>
              <Text style={[styles.expenseSummaryLabel, { color: colors.textSecondary }]}>
                Total Expenses
              </Text>
              <Text style={styles.expenseSummaryAmount}>
                ₦{totalExpenses.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.expenseSummaryRight}>
            <Text style={[styles.expenseCount, { color: colors.textSecondary }]}>
              {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
            </Text>
          </View>
        </View>

        {/* Expense List */}
        <View style={[styles.expenseCard, { backgroundColor: colors.card }]}>
          {expenses.map((expense, i) => {
            const meta = categoryMeta[expense.category] || categoryMeta.misc;
            return (
              <View
                key={expense.id}
                style={[
                  styles.expenseRow,
                  i < expenses.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.backgroundElement,
                  },
                ]}
              >
                <View style={[styles.expenseIcon, { backgroundColor: meta.bg }]}>
                  <Lucide name={meta.icon as any} size={16} color={meta.color} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: colors.text }]}>
                    {categoryLabels[expense.category] || expense.category}
                  </Text>
                  {expense.note ? (
                    <Text
                      style={[styles.expenseNote, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {expense.note}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>{expense.amount}</Text>
                  <Text style={[styles.expenseTime, { color: colors.textSecondary }]}>
                    {expense.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Top Products */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          TOP PRODUCTS
        </Text>
        <View style={[styles.productsCard, { backgroundColor: colors.card }]}>
          {topProducts.map((product, index) => (
            <View
              key={product.rank}
              style={[
                styles.productRow,
                index < topProducts.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.backgroundElement,
                },
              ]}
            >
              <View style={[styles.rankBadge, { backgroundColor: "#3b82f6" }]}>
                <Text style={styles.rankText}>{product.rank}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>
                  {product.name}
                </Text>
                <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
                  {product.category}
                </Text>
              </View>
              <View style={styles.productRight}>
                <View style={[styles.unitsPill, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.unitsText, { color: colors.textSecondary }]}>
                    {product.units} units
                  </Text>
                </View>
                <Text style={[styles.productPrice, { color: colors.text }]}>
                  {product.price}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Expense FAB */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setAddExpenseVisible(true)}
      >
        <Lucide name="plus" size={22} color="#fff" />
      </Pressable>

      <AddExpenseSheet
        visible={addExpenseVisible}
        onVisibleChange={setAddExpenseVisible}
        onAdd={handleAddExpense}
      />
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  appLabel: { fontSize: 13, fontWeight: "500" },
  pageTitle: { fontSize: 28, fontWeight: "800", marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  dateSelectorRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
  },
  dateText: { fontSize: 13, fontWeight: "600" },
  revenueCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    padding: 20,
    marginBottom: 16,
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  revenueLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500" },
  revenueDate: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  revenueAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 12,
  },
  revenueFooter: { flexDirection: "row", gap: 20 },
  revenueStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  revenueStatText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, fontWeight: "500" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statSub: { fontSize: 11, fontWeight: "400" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  addExpenseLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addExpenseLinkText: { color: "#3b82f6", fontSize: 13, fontWeight: "600" },
  expenseSummary: {
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseSummaryLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  expenseSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseSummaryLabel: { fontSize: 12, fontWeight: "500" },
  expenseSummaryAmount: { fontSize: 18, fontWeight: "800", color: "#ef4444" },
  expenseSummaryRight: {},
  expenseCount: { fontSize: 12, fontWeight: "500" },
  expenseCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseInfo: { flex: 1, gap: 2 },
  expenseCategory: { fontSize: 14, fontWeight: "600" },
  expenseNote: { fontSize: 12 },
  expenseRight: { alignItems: "flex-end", gap: 2 },
  expenseAmount: { fontSize: 14, fontWeight: "700", color: "#ef4444" },
  expenseTime: { fontSize: 11, fontWeight: "500" },
  productsCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 4,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 14, fontWeight: "600" },
  productCategory: { fontSize: 12 },
  productRight: { alignItems: "flex-end", gap: 4 },
  unitsPill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unitsText: { fontSize: 11, fontWeight: "500" },
  productPrice: { fontSize: 14, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
