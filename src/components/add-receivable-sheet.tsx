import { createReceivable, fetchReceivables } from "@/api/accounting";
import { createCustomer, fetchCustomers } from "@/api/customer";
import { getDocuments } from "@/api/document";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import { Customer } from "@/types/customer";
import { Document } from "@/types/document-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { z } from "zod";

const receivableSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerId: z.string().trim().min(1, "Pick a customer"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, "Enter an amount above 0"),
  dueDate: z.string().min(1, "Due date is required"),
});

type ReceivableField = keyof z.infer<typeof receivableSchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

const AddReceivableSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const { activeStoreId } = useActiveStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ReceivableField, string>>>({});

  const dueDateValue = dueDate ? dueDate.toISOString().split("T")[0] : "";

  // ── Existing customers (search) ────────────────────────────────────────
  const { data: customerResults, isPending: isSearching } = useQuery({
    queryKey: ["customers", "picker", customerSearch],
    queryFn: () => fetchCustomers(1, 20, customerSearch.trim() || undefined),
    enabled: visible && !customer && customerSearch.trim().length >= 2,
  });

  // ── Invoices already recorded as receivables (duplicate guard) ─────────
  const { data: receivables } = useQuery({
    queryKey: ["receivables", "all"],
    queryFn: () => fetchReceivables(),
    enabled: visible,
  });

  const recordedInvoiceNumbers = useMemo(
    () =>
      new Set(
        (receivables ?? [])
          .map((r) => r.invoice_number?.trim().toLowerCase())
          .filter(Boolean) as string[],
      ),
    [receivables],
  );

  // ── This customer's invoices ───────────────────────────────────────────
  const { data: invoiceData, isPending: isLoadingInvoices } = useQuery({
    queryKey: ["documents", "receivable-picker", customer?.id],
    queryFn: () =>
      getDocuments({
        doc_type: "invoice",
        customer_id: customer?.id,
        page_size: 50,
      }),
    enabled: visible && !!customer?.id,
  });

  const customerInvoices = useMemo(() => {
    const raw = invoiceData?.data;
    const list = Array.isArray(raw) ? (raw as Document[]) : [];
    return list
      .filter((d) => !recordedInvoiceNumbers.has(d.doc_number?.trim().toLowerCase()))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [invoiceData, recordedInvoiceNumbers]);

  const isDuplicateInvoice =
    invoiceNumber.trim().length > 0 &&
    recordedInvoiceNumbers.has(invoiceNumber.trim().toLowerCase());

  const reset = () => {
    setCustomer(null);
    setCustomerSearch("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setShowNewCustomer(false);
    setInvoiceNumber("");
    setInvoiceId(null);
    setAmount("");
    setDueDate(null);
    setShowDatePicker(false);
    setErrors({});
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      let customerId = customer?.id ?? "";
      let customerName = customer?.name ?? newCustomerName.trim();

      if (!customerId) {
        const created = await createCustomer({
          name: newCustomerName.trim(),
          type: "customer",
          phone: newCustomerPhone.trim() || undefined,
        });
        customerId = created.id;
        customerName = created.name;
      }

      return createReceivable({
        customer_id: customerId,
        customer_name: customerName,
        invoice_number: invoiceNumber.trim(),
        amount: Number(amount),
        due_date: dueDateValue,
        invoice_id: invoiceId ?? undefined,
        store_id: activeStoreId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onVisibleChange(false);
      reset();
    },
  });

  const handleSelectCustomer = (selected: Customer) => {
    setCustomer(selected);
    setCustomerSearch("");
    setShowNewCustomer(false);
    setErrors((prev) => ({ ...prev, customerId: undefined, customerName: undefined }));
  };

  const handleSelectInvoice = (invoice: Document) => {
    setInvoiceNumber(invoice.doc_number);
    setInvoiceId(invoice.id);
    setAmount(String(invoice.total ?? ""));
    if (invoice.due_date) {
      const parsed = new Date(invoice.due_date);
      if (!Number.isNaN(parsed.getTime())) setDueDate(parsed);
    }
    setErrors((prev) => ({ ...prev, invoiceNumber: undefined, amount: undefined }));
  };

  const handleCreate = () => {
    // A customer must either be picked or typed in full: we create the record
    // on submit when it does not exist yet.
    if (!customer && !newCustomerName.trim()) {
      setErrors((prev) => ({
        ...prev,
        customerName: customer ? undefined : "Pick a customer or enter a new one",
        customerId: customer ? undefined : "Pick a customer",
      }));
      return;
    }
    if (!customer && !showNewCustomer) {
      setErrors((prev) => ({ ...prev, customerId: "Pick a customer" }));
      return;
    }

    const result = receivableSchema.safeParse({
      customerName: customer?.name ?? newCustomerName,
      customerId: customer?.id ?? "",
      invoiceNumber,
      amount,
      dueDate: dueDateValue,
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<ReceivableField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as ReceivableField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (isDuplicateInvoice) {
      setErrors((prev) => ({
        ...prev,
        invoiceNumber: "Already recorded as a receivable",
      }));
      return;
    }
    setErrors({});
    submit();
  };

  const canSubmit = !isPending && !isDuplicateInvoice;

  return (
    <AppBottomSheet
      snapPoints={["80%", "95%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>New Receivable</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Pick a customer and their invoice to fill the details
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Customer ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Customer
          </Text>

          {customer ? (
            <View
              style={[
                styles.selectedRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.backgroundElement,
                },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}>
                <Lucide name="user" size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {customer.name}
                </Text>
                {(customer.phone || customer.email) && (
                  <Text style={[styles.selectedMeta, { color: colors.textSecondary }]}>
                    {customer.phone || customer.email}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => {
                  setCustomer(null);
                  setInvoiceNumber("");
                  setInvoiceId(null);
                }}
                hitSlop={8}
              >
                <Lucide name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : (
            <>
              <AppTextInput
                placeholder="Search existing customers..."
                value={customerSearch}
                onChangeText={setCustomerSearch}
                leftIcon="search"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {customerSearch.trim().length >= 2 && (
                <View
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.backgroundElement,
                    },
                  ]}
                >
                  {isSearching ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.buttonPrimary}
                      style={{ paddingVertical: 12 }}
                    />
                  ) : customerResults?.items.length ? (
                    customerResults.items.slice(0, 5).map((c) => (
                      <Pressable
                        key={c.id}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: colors.backgroundElement },
                        ]}
                        onPress={() => handleSelectCustomer(c)}
                      >
                        <Text style={[styles.dropdownName, { color: colors.text }]}>
                          {c.name}
                        </Text>
                        <Text
                          style={[styles.dropdownMeta, { color: colors.textSecondary }]}
                        >
                          {c.phone || c.email || "No contact"}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.dropdownMeta,
                        { color: colors.textSecondary, paddingVertical: 12 },
                      ]}
                    >
                      No matching customer
                    </Text>
                  )}
                </View>
              )}

              {errors.customerId && (
                <Text style={styles.errorText}>{errors.customerId}</Text>
              )}

              <Pressable
                style={styles.linkButton}
                onPress={() => setShowNewCustomer((v) => !v)}
              >
                <Text style={[styles.linkText, { color: "#3b82f6" }]}>
                  {showNewCustomer
                    ? "Search existing customers instead"
                    : "Customer not listed? Add a new one"}
                </Text>
              </Pressable>

              {showNewCustomer && (
                <View style={{ gap: 10 }}>
                  <AppTextInput
                    placeholder="Customer name"
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                    leftIcon="user"
                    autoCapitalize="words"
                  />
                  {errors.customerName && (
                    <Text style={styles.errorText}>{errors.customerName}</Text>
                  )}
                  <AppTextInput
                    placeholder="Phone (optional)"
                    value={newCustomerPhone}
                    onChangeText={setNewCustomerPhone}
                    leftIcon="phone"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Invoice ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Invoice
          </Text>

          {customer && isLoadingInvoices ? (
            <ActivityIndicator size="small" color={colors.buttonPrimary} />
          ) : null}

          {customer && customerInvoices.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.invoiceRow}
            >
              {customerInvoices.map((invoice) => (
                <Pressable
                  key={invoice.id}
                  onPress={() => handleSelectInvoice(invoice)}
                  style={[
                    styles.invoiceChip,
                    {
                      backgroundColor:
                        invoiceId === invoice.id
                          ? colors.backgroundSelected
                          : colors.card,
                      borderColor: colors.backgroundElement,
                    },
                  ]}
                >
                  <Text style={[styles.invoiceNumber, { color: colors.text }]}>
                    {invoice.doc_number}
                  </Text>
                  <Text
                    style={[styles.invoiceAmount, { color: colors.textSecondary }]}
                  >
                    {`₦${Number(invoice.total ?? 0).toLocaleString()}`}
                    {invoice.status !== "paid" ? ` · ${invoice.status}` : ""}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {customer && !isLoadingInvoices && customerInvoices.length === 0 && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              No unpaid invoices on file — enter the invoice number below.
            </Text>
          )}

          <AppTextInput
            placeholder="Invoice number"
            value={invoiceNumber}
            onChangeText={(v) => {
              setInvoiceNumber(v);
              setInvoiceId(null);
            }}
            leftIcon="file-text"
            autoCapitalize="characters"
            error={
              errors.invoiceNumber ??
              (isDuplicateInvoice ? "Already recorded as a receivable" : undefined)
            }
          />
        </View>

        {/* ── Amount & due date ───────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Amount & Due Date
          </Text>
          <AppTextInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            leftIcon="banknote"
            keyboardType="numeric"
            error={errors.amount}
          />
          <Pressable
            style={[
              styles.datePickerButton,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Lucide name="calendar" size={16} color={colors.textSecondary} />
            <Text
              style={[
                styles.datePickerText,
                { color: dueDate ? colors.text : colors.textSecondary },
              ]}
            >
              {dueDate
                ? dueDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select due date"}
            </Text>
            <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}
          {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}
        </View>
      </ScrollView>

      <Pressable
        style={[
          styles.createBtn,
          { backgroundColor: colors.buttonPrimary, opacity: canSubmit ? 1 : 0.5 },
        ]}
        disabled={!canSubmit}
        onPress={handleCreate}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create Receivable</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddReceivableSheet;

const styles = StyleSheet.create({
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  scroll: { flexGrow: 0 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: { fontSize: 12, color: "#DC2626" },
  hint: { fontSize: 12 },
  dropdown: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  dropdownName: { fontSize: 14, fontWeight: "600" },
  dropdownMeta: { fontSize: 12, marginTop: 2 },
  linkButton: { paddingVertical: 4 },
  linkText: { fontSize: 13, fontWeight: "600" },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedName: { fontSize: 14, fontWeight: "600" },
  selectedMeta: { fontSize: 12, marginTop: 2 },
  invoiceRow: { gap: 8, paddingVertical: 2 },
  invoiceChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 140,
    gap: 4,
  },
  invoiceNumber: { fontSize: 13, fontWeight: "700" },
  invoiceAmount: { fontSize: 12 },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  datePickerText: { flex: 1, fontSize: 14 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
