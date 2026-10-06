import { createCustomer, deleteCustomer, updateCustomer } from "@/api/customer";
import AppBottomSheet from "@/components/bottom-sheet";
import Pill from "@/components/pill";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Customer, CustomerType } from "@/types/customer";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

/** Customers are someone we sell to; vendors are someone we buy from. */
const TYPES: { id: CustomerType; label: string; icon: string }[] = [
  { id: "customer", label: "Customer", icon: "users" },
  { id: "vendor", label: "Vendor", icon: "truck" },
];

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

type CustomerField = keyof z.infer<typeof customerSchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  customer?: Customer | null;
};

const CustomerSheet = ({ visible, onVisibleChange, customer }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<CustomerType>("customer");
  const [errors, setErrors] = useState<Partial<Record<CustomerField, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reset = () => {
    setSeededFor(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setType("customer");
    setErrors({});
    setShowDeleteConfirm(false);
  };

  // Load the row being edited, or clear the form for a new one. Done during
  // render rather than in an effect so no frame shows the previous customer's
  // details while the effect catches up.
  const seed = visible ? (customer?.id ?? "new") : null;
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (seed && seededFor !== seed) {
    setSeededFor(seed);
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setType(customer.type ?? "customer");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setType("customer");
      setErrors({});
    }
  }

  const { mutate: saveCustomer, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        type,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      };
      return customer
        ? updateCustomer(customer.id, payload)
        : createCustomer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onVisibleChange(false);
      reset();
    },
  });

  const { mutate: removeCustomer, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteCustomer(customer!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onVisibleChange(false);
      reset();
    },
  });

  const handleSave = () => {
    const result = customerSchema.safeParse({ name, phone, email, address });
    if (!result.success) {
      const fieldErrors: Partial<Record<CustomerField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as CustomerField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveCustomer();
  };

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["75%", "90%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing
            ? type === "vendor"
              ? "Edit Vendor"
              : "Edit Customer"
            : type === "vendor"
              ? "Add Vendor"
              : "Add Customer"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isEditing
            ? "Update contact details"
            : type === "vendor"
              ? "Someone you buy from — for bills and payables"
              : "Someone you sell to — for invoices and receivables"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {type === "vendor" ? "Vendor" : "Customer"} Type
          </Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <Pill
                key={t.id}
                label={t.label}
                active={t.id === type}
                onPress={() => setType(t.id)}
                color="#3b82f6"
              />
            ))}
          </View>
          <Text style={[styles.typeHint, { color: colors.textSecondary }]}>
            {type === "vendor"
              ? "Bills you owe them appear under Payables."
              : "Invoices they owe you appear under Receivables."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Personal Info
          </Text>
          <AppTextInput
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            leftIcon="user"
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <AppTextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            leftIcon="phone"
            keyboardType="phone-pad"
          />
          <AppTextInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Address (Optional)
          </Text>
          <AppTextInput
            placeholder="Physical address"
            value={address}
            onChangeText={setAddress}
            leftIcon="map-pin"
            autoCapitalize="words"
          />
        </View>
      </ScrollView>

      <Pressable
        style={[
          styles.saveBtn,
          { backgroundColor: colors.buttonPrimary, opacity: canSubmit ? 1 : 0.5 },
        ]}
        disabled={!canSubmit}
        onPress={handleSave}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name={isEditing ? "check" : "user-plus"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>
              {isEditing ? "Save Changes" : "Add Customer"}
            </Text>
          </>
        )}
      </Pressable>

      {isEditing && (
        <>
          {showDeleteConfirm ? (
            <View style={styles.deleteConfirm}>
              <Text style={[styles.deleteConfirmText, { color: colors.text }]}>
                Delete this customer? This cannot be undone.
              </Text>
              <View style={styles.deleteConfirmRow}>
                <Pressable
                  style={[styles.deleteCancelBtn, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.deleteConfirmBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => removeCustomer()}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.deleteBtn, { borderColor: "#ef4444" }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Lucide name="trash-2" size={16} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete Customer</Text>
            </Pressable>
          )}
        </>
      )}
    </AppBottomSheet>
  );
};

export default CustomerSheet;

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  content: { paddingBottom: 8 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: { fontSize: 12, color: "#DC2626", marginTop: -4 },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeHint: { fontSize: 11, lineHeight: 16 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  deleteBtnText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
  deleteConfirm: { marginTop: 12, gap: 10 },
  deleteConfirmText: { fontSize: 14, textAlign: "center" },
  deleteConfirmRow: { flexDirection: "row", gap: 10 },
  deleteCancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  deleteCancelText: { fontSize: 14, fontWeight: "600" },
  deleteConfirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  deleteConfirmBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
