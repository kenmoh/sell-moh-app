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
    icon: "package" as const,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  {
    label: "Cash Collected",
    value: "₦38,500",
    sub: "14 transactions",
    icon: "banknote" as const,
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  {
    label: "Card Payments",
    value: "₦8,750",
    sub: "4 transactions",
    icon: "credit-card" as const,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  {
    label: "Refunds",
    value: "₦850",
    sub: "1 order",
    icon: "rotate-ccw" as const,
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
  },
];

const topProducts = [
  {
    rank: 1,
    name: "Coca-Cola 50cl",
    category: "Beverages",
    units: 28,
    price: "₦12,600",
  },
  {
    rank: 2,
    name: "Indomie Chicken",
    category: "Food",
    units: 22,
    price: "₦7,700",
  },
  {
    rank: 3,
    name: "Peak Milk",
    category: "Dairy",
    units: 15,
    price: "₦40,500",
  },
];

const categoryMeta: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  utility: { icon: "zap", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  rent: { icon: "home", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  supplies: {
    icon: "package",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  salaries: { icon: "users", color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)" },
  maintenance: {
    icon: "wrench",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
  },
  misc: {
    icon: "more-horizontal",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.12)",
  },
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
  {
    id: "1",
    category: "utility",
    amount: "₦12,500",
    note: "Electricity bill — December",
    time: "2:30 PM",
  },
  {
    id: "2",
    category: "supplies",
    amount: "₦3,200",
    note: "Printer paper & toner",
    time: "11:15 AM",
  },
  {
    id: "3",
    category: "maintenance",
    amount: "₦5,000",
    note: "AC servicing",
    time: "Yesterday",
  },
];

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const formatDate = (d: Date) => {
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (isToday) return `Today, ${dateFormatted}`;
    return dateFormatted;
  };

  const totalExpenses = expenses.reduce((sum, e) => {
    const val = parseInt(e.amount.replace(/[₦,]/g, ""), 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleAddExpense = (expense: {
    category: string;
    amount: string;
    note: string;
  }) => {
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
        {/* ─── Header ─── */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={[styles.appLabel, { color: colors.textSecondary }]}>
              StoreFlow POS
            </Text>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Dashboard
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: "#2563eb" }]}>
              <Text style={styles.avatarText}>AO</Text>
            </View>
          </View>
        </View>

        {/* ─── Date Selector Pill ─── */}
        <View style={styles.dateSelectorRow}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={({ pressed }) => [
              styles.datePill,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#262930" : "#eef0f4",
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Lucide name="calendar" size={16} color={colors.text} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(date)}
            </Text>
            <Lucide
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
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

        {/* ─── Main Revenue Card ─── */}
        <View style={styles.revenueCard}>
          {/* Subtle background glow effect */}
          <View style={styles.revenueGlow} />

          <View style={styles.revenueHeader}>
            <View style={styles.revenueLabelRow}>
              <View style={styles.revenueIconBadge}>
                <Lucide name="briefcase" size={14} color="#ffffff" />
              </View>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
            </View>
            <View style={styles.revenueDateBadge}>
              <Text style={styles.revenueDate}>Dec 14, 2024</Text>
            </View>
          </View>

          <Text style={styles.revenueAmount}>₦47,250</Text>

          <View style={styles.revenueDivider} />

          <View style={styles.revenueFooter}>
            <View style={styles.revenueStatItem}>
              <View style={styles.revenueStatIconBg}>
                <Lucide name="shopping-bag" size={13} color="#ffffff" />
              </View>
              <Text style={styles.revenueStatLabel}>Orders:</Text>
              <Text style={styles.revenueStatValue}>18</Text>
            </View>
            <View style={styles.revenueStatDot} />
            <View style={styles.revenueStatItem}>
              <View style={styles.revenueStatIconBg}>
                <Lucide name="trending-up" size={13} color="#ffffff" />
              </View>
              <Text style={styles.revenueStatLabel}>Avg:</Text>
              <Text style={styles.revenueStatValue}>₦2,625</Text>
            </View>
          </View>
        </View>

        {/* ─── Key Metrics Grid ─── */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#262930" : "#eef0f4",
                },
              ]}
            >
              <View style={styles.statCardHeader}>
                <View
                  style={[styles.statIconBadge, { backgroundColor: stat.bg }]}
                >
                  <Lucide name={stat.icon} size={18} color={stat.color} />
                </View>
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

        {/* ─── Expenses Section ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            EXPENSES TODAY
          </Text>
        </View>

        {/* Expense Summary Overview Card */}
        <View
          style={[
            styles.expenseSummary,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
          ]}
        >
          <View style={styles.expenseSummaryLeft}>
            <View
              style={[
                styles.expenseSummaryIcon,
                { backgroundColor: "rgba(239, 68, 68, 0.12)" },
              ]}
            >
              <Lucide name="trending-down" size={18} color="#ef4444" />
            </View>
            <View>
              <Text
                style={[
                  styles.expenseSummaryLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Total Expenses
              </Text>
              <Text style={styles.expenseSummaryAmount}>
                ₦{totalExpenses.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.expenseSummaryRight}>
            <View
              style={[
                styles.expenseCountPill,
                {
                  backgroundColor: isDark
                    ? colors.backgroundElement
                    : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.expenseCountText,
                  { color: colors.textSecondary },
                ]}
              >
                {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
              </Text>
            </View>
          </View>
        </View>

        {/* Expense Detailed List Card */}
        <View
          style={[
            styles.listContainerCard,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
          ]}
        >
          {expenses.map((expense, i) => {
            const meta = categoryMeta[expense.category] || categoryMeta.misc;
            return (
              <View key={expense.id}>
                {i > 0 && (
                  <View
                    style={[
                      styles.cardDivider,
                      { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                    ]}
                  />
                )}
                <View style={styles.expenseRow}>
                  <View
                    style={[styles.expenseIcon, { backgroundColor: meta.bg }]}
                  >
                    <Lucide
                      name={meta.icon as any}
                      size={16}
                      color={meta.color}
                    />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text
                      style={[styles.expenseCategory, { color: colors.text }]}
                    >
                      {categoryLabels[expense.category] || expense.category}
                    </Text>
                    {expense.note ? (
                      <Text
                        style={[
                          styles.expenseNote,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {expense.note}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>{expense.amount}</Text>
                    <Text
                      style={[
                        styles.expenseTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {expense.time}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Top Products Section ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            TOP PRODUCTS
          </Text>
        </View>
        <View
          style={[
            styles.listContainerCard,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
          ]}
        >
          {topProducts.map((product, index) => (
            <View key={product.rank}>
              {index > 0 && (
                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                  ]}
                />
              )}
              <View style={styles.productRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{product.rank}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {product.name}
                  </Text>
                  <Text
                    style={[
                      styles.productCategory,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {product.category}
                  </Text>
                </View>
                <View style={styles.productRight}>
                  <View
                    style={[
                      styles.unitsPill,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundElement
                          : "#f3f4f6",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitsText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {product.units} units
                    </Text>
                  </View>
                  <Text style={[styles.productPrice, { color: colors.text }]}>
                    {product.price}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ─── Floating Action Button ─── */}
      {/* <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
        onPress={() => setAddExpenseVisible(true)}
      >
        <Lucide name="plus" size={24} color="#ffffff" />
      </Pressable>

      <AddExpenseSheet
        visible={addExpenseVisible}
        onVisibleChange={setAddExpenseVisible}
        onAdd={handleAddExpense}
      /> */}
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  /* ─── Header ─── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  appLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* ─── Date Selector ─── */
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* ─── Main Revenue Card ─── */
  revenueCard: {
    marginHorizontal: 12.5,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  revenueGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revenueIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  revenueDateBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  revenueDate: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  revenueAmount: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 14,
    letterSpacing: -1,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginBottom: 14,
  },
  revenueFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  revenueStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  revenueStatIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueStatLabel: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    fontWeight: "500",
  },
  revenueStatValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  revenueStatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  /* ─── Metrics Grid ─── */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12.5,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardHeader: {
    marginBottom: 6,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  statSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },

  /* ─── Section Header ─── */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  addExpenseLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addExpensePlusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addExpenseLinkText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ─── Expense Cards ─── */
  expenseSummary: {
    marginHorizontal: 12.5,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  expenseSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseSummaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  expenseSummaryAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ef4444",
    letterSpacing: -0.3,
  },
  expenseSummaryRight: {},
  expenseCountPill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expenseCountText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ─── List Container Card ─── */
  listContainerCard: {
    marginHorizontal: 12.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },

  /* ─── Expense Row ─── */
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  expenseNote: {
    fontSize: 12,
    fontWeight: "400",
  },
  expenseRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  expenseTime: {
    fontSize: 11,
    fontWeight: "500",
  },

  /* ─── Product Row ─── */
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  productCategory: {
    fontSize: 12,
    fontWeight: "400",
  },
  productRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  unitsPill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unitsText: {
    fontSize: 11,
    fontWeight: "600",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* ─── FAB ─── */
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
