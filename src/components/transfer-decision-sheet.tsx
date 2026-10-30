import {
  approveTransferRequest,
  fulfillTransferRequest,
  rejectTransferRequest,
} from "@/api/inventory";
import AppBottomSheet from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import type { TransferRequest } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export type DecisionMode = "approve" | "reject" | "send";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  mode: DecisionMode;
  request: TransferRequest | null;
  isOwner: boolean;
};

const TITLES: Record<DecisionMode, string> = {
  approve: "Approve Transfer",
  reject: "Reject Transfer",
  send: "Send Stock",
};

function friendlyError(message: string) {
  if (message === "supervisor_pin_required")
    return "A supervisor PIN is required.";
  if (message === "invalid_supervisor_pin")
    return "That supervisor PIN is not valid.";
  return message;
}

export default function TransferDecisionSheet({
  visible,
  onVisibleChange,
  mode,
  request,
  isOwner,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const toast = useToast();

  // The parent remounts this sheet per request (keyed), so each decision
  // starts from the requested quantity with no stale PIN or note.
  const [approvedQty, setApprovedQty] = useState(() =>
    request ? String(request.requested_qty) : "",
  );
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
    queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["low-stock"] });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error("No request selected");
      if (mode === "approve") {
        return approveTransferRequest(request.id, {
          approved_qty: parseInt(approvedQty, 10),
          supervisor_pin: pin || undefined,
        });
      }
      if (mode === "reject") {
        return rejectTransferRequest(request.id, {
          rejection_reason: reason || null,
          supervisor_pin: pin || undefined,
        });
      }
      return fulfillTransferRequest(
        request.supplying_store_id,
        request.id,
        pin || undefined,
      );
    },
    onSuccess: () => {
      invalidate();
      toast.success(
        mode === "approve"
          ? "Transfer approved"
          : mode === "reject"
            ? "Transfer rejected"
            : "Stock sent",
        mode === "send" ? "Both stores have been updated." : undefined,
      );
      onVisibleChange(false);
    },
    onError: (error) => toast.error("Action failed", friendlyError(error.message)),
  });

  if (!request) return null;

  const qty = parseInt(approvedQty || "0", 10) || 0;
  const overRequested = qty > request.requested_qty;
  const canSubmit =
    mode === "approve"
      ? qty > 0 && !overRequested
      : isOwner || pin.length > 0;

  return (
    <AppBottomSheet
      snapPoints={["75%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {TITLES[mode]}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {request.item_name ?? "Item"} · {request.supplying_store_name ?? "?"}{" "}
            → {request.requesting_store_name ?? "?"}
          </Text>
        </View>

        <View
          style={[styles.summary, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Requested
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {request.requested_qty}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Reference
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {request.request_number ?? "—"}
            </Text>
          </View>
          {request.approved_qty != null && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                Approved
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {request.approved_qty}
              </Text>
            </View>
          )}
        </View>

        {mode === "approve" && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Quantity to send
            </Text>
            <AppTextInput
              value={approvedQty}
              onChangeText={setApprovedQty}
              placeholder={String(request.requested_qty)}
              keyboardType="number-pad"
              leftIcon="package"
              error={
                overRequested
                  ? `They asked for ${request.requested_qty}`
                  : undefined
              }
            />
          </View>
        )}

        {mode === "reject" && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Reason (optional)
            </Text>
            <AppTextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. None left until Thursday"
              leftIcon="sticky-note"
              multiline
            />
          </View>
        )}

        {mode === "send" && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            This removes {request.approved_qty} from this store and adds it to{" "}
            {request.requesting_store_name ?? "the requesting store"}. Stock is
            checked again, so it can never go negative.
          </Text>
        )}

        {!isOwner && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Supervisor PIN
            </Text>
            <AppTextInput
              value={pin}
              onChangeText={setPin}
              placeholder="Required for this action"
              keyboardType="number-pad"
              secureTextEntry
              leftIcon="lock"
            />
          </View>
        )}

        <Button
          disabled={!canSubmit}
          fullWidth
          leftIcon={(color) => (
            <Lucide
              name={mode === "reject" ? "x" : mode === "send" ? "package-check" : "check"}
              size={18}
              color={color}
            />
          )}
          loading={isPending}
          onPress={() => mutate()}
          title={TITLES[mode]}
        />
      </ScrollView>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  summary: { borderRadius: 12, padding: 14, gap: 8, marginBottom: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  section: { gap: 10, marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
});
