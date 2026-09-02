import {
  createStore,
  deleteTenantStore,
  updateTenantStore,
} from "@/api/store";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const storeSchema = z.object({
  name: z.string().trim().min(1, "Store name is required"),
  address: z.string().optional(),
  is_warehouse: z.boolean(),
});

type StoreField = keyof z.infer<typeof storeSchema>;

type StoreData = {
  id: string;
  name: string;
  address: string | null;
  is_warehouse: boolean;
  status: string;
  created_at: string | null;
};

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  store?: StoreData | null;
};

const StoreSheet = ({ visible, onVisibleChange, store }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const isEditing = !!store;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isWarehouse, setIsWarehouse] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<StoreField, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setAddress(store.address || "");
      setIsWarehouse(store.is_warehouse);
    } else {
      reset();
    }
  }, [store, visible]);

  const { mutate: saveStore, isPending } = useMutation({
    mutationFn: () => {
      const payload = { name, address: address || undefined, is_warehouse: isWarehouse };
      return store
        ? updateTenantStore(store.id, payload)
        : createStore(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      onVisibleChange(false);
      reset();
    },
  });

  const { mutate: deleteStore, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteTenantStore(store!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setName("");
    setAddress("");
    setIsWarehouse(false);
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const handleSave = () => {
    const result = storeSchema.safeParse({ name, address, is_warehouse: isWarehouse });
    if (!result.success) {
      const fieldErrors: Partial<Record<StoreField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as StoreField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveStore();
  };

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["60%", "80%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Store" : "Add Store"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isEditing ? "Update store details" : "Create a new store location"}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Store Details
          </Text>
          <AppTextInput
            placeholder="Store name"
            value={name}
            onChangeText={setName}
            leftIcon="store"
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <AppTextInput
            placeholder="Address (optional)"
            value={address}
            onChangeText={setAddress}
            leftIcon="map-pin"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Type
          </Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: !isWarehouse
                    ? colors.buttonPrimary
                    : colors.backgroundElement,
                },
              ]}
              onPress={() => setIsWarehouse(false)}
            >
              <Lucide
                name="store"
                size={16}
                color={!isWarehouse ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: !isWarehouse ? "#fff" : colors.textSecondary },
                ]}
              >
                Retail Store
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: isWarehouse
                    ? colors.buttonPrimary
                    : colors.backgroundElement,
                },
              ]}
              onPress={() => setIsWarehouse(true)}
            >
              <Lucide
                name="warehouse"
                size={16}
                color={isWarehouse ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: isWarehouse ? "#fff" : colors.textSecondary },
                ]}
              >
                Warehouse
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

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
            <Lucide name={isEditing ? "check" : "plus"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>
              {isEditing ? "Save Changes" : "Create Store"}
            </Text>
          </>
        )}
      </Pressable>

      {isEditing && (
        <>
          {showDeleteConfirm ? (
            <View style={styles.deleteConfirm}>
              <Text style={[styles.deleteConfirmText, { color: colors.text }]}>
                Delete this store? This cannot be undone.
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
                  onPress={() => deleteStore()}
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
              <Text style={styles.deleteBtnText}>Delete Store</Text>
            </Pressable>
          )}
        </>
      )}
    </AppBottomSheet>
  );
};

export default StoreSheet;

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
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  toggleBtnText: { fontSize: 14, fontWeight: "600" },
  errorText: { fontSize: 12, color: "#DC2626", marginTop: -4 },
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
