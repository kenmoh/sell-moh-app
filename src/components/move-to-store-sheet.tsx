import { movePayableToStore, moveReceivableToStore } from "@/api/accounting";
import AppBottomSheet from "@/components/bottom-sheet";
import Pill from "@/components/pill";
import PillRow from "@/components/pill-row";
import AppTextInput from "@/components/text-input";
import { Colors, type ColorPalette } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import { useActiveStore } from "@/lib/store-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** Which sub-ledger the correction applies to. */
  kind: "receivable" | "payable";
  recordId: string;
  /** Invoice or bill number, shown so it is obvious what is being moved. */
  reference: string;
  /** Current store, or null when untagged. */
  currentStoreId: string | null;
};

const isPinRequiredError = (message: string) =>
  message.includes("supervisor_pin_required") ||
  message.toLowerCase().includes("pin");

/**
 * Correction sheet for a document booked against the wrong store.
 *
 * Re-attributing a document rewrites the store's cash and receivable history,
 * so the server requires a supervisor PIN unless the caller is an owner. The
 * PIN field is hidden for owners and revealed whenever the server asks for it,
 * which keeps the common case to a single tap without trusting the client to
 * decide whether approval was needed.
 */
const MoveToStoreSheet = ({
  visible,
  onVisibleChange,
  kind,
  recordId,
  reference,
  currentStoreId,
}: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const { isOwner, stores } = useActiveStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [targetStoreId, setTargetStoreId] = useState<string | null>();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const canSubmit = targetStoreId !== undefined && targetStoreId !== currentStoreId;

  const move = useMutation({
    mutationFn: async () => {
      if (targetStoreId === undefined) return;
      return kind === "receivable"
        ? await moveReceivableToStore(recordId, targetStoreId, pin || undefined)
        : await movePayableToStore(recordId, targetStoreId, pin || undefined);
    },
    onSuccess: () => {
      const name =
        targetStoreId === null
          ? "All Stores"
          : (stores.find((s) => s.id === targetStoreId)?.name ?? "that store");
      toast.success("Store updated", `${reference} now shows under ${name}.`);
      void queryClient.invalidateQueries({
        queryKey: [kind === "receivable" ? "receivables" : "payables"],
      });
      void queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      setPin("");
      setTargetStoreId(undefined);
      onVisibleChange(false);
    },
    onError: (error: Error) => {
      if (isPinRequiredError(error.message)) {
        // The server knows the caller's rank; the client does not. Reveal the
        // field rather than guessing who needs approval.
        setShowPin(true);
        toast.error("Supervisor PIN required", error.message);
        return;
      }
      toast.error("Could not update store", error.message);
    },
  });

  const currentName =
    currentStoreId === null
      ? "All Stores"
      : (stores.find((s) => s.id === currentStoreId)?.name ?? "Unknown store");

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={onVisibleChange}
      snapPoints={showPin ? ["55%", "80%"] : ["38%", "60%"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {kind === "receivable" ? "Move Receivable" : "Move Payable"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {reference} is booked to {currentName}
        </Text>
      </View>

      <PillRow>
        <Pill
          label="All Stores"
          icon="layers"
          active={
            targetStoreId === undefined
              ? currentStoreId === null
              : targetStoreId === null
          }
          onPress={() => setTargetStoreId(null)}
        />
        {stores.map((store) => (
          <Pill
            key={store.id}
            label={store.name}
            icon="store"
            active={
              targetStoreId === undefined
                ? store.id === currentStoreId
                : store.id === targetStoreId
            }
            onPress={() => setTargetStoreId(store.id)}
          />
        ))}
      </PillRow>

      {showPin && !isOwner && (
        <View style={styles.pinBlock}>
          <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>
            Supervisor PIN
          </Text>
          <AppTextInput
            value={pin}
            onChangeText={setPin}
            placeholder="4-6 digits"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <Text style={[styles.pinHint, { color: colors.textSecondary }]}>
            Moving a document rewrites store-level figures, so a supervisor has to
            approve it. This change is recorded in the audit trail.
          </Text>
        </View>
      )}

      <Pressable
        style={[
          styles.updateBtn,
          {
            backgroundColor: colors.buttonPrimary,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
        disabled={!canSubmit || move.isPending}
        onPress={() => move.mutate()}
      >
        {move.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="check" size={18} color="#fff" />
            <Text style={styles.updateBtnText}>Update Store</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 13 },
  pinBlock: { gap: 6, marginTop: 16 },
  pinLabel: { fontSize: 12, fontWeight: "600" },
  pinHint: { fontSize: 11, lineHeight: 16 },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 18,
  },
  updateBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default MoveToStoreSheet;