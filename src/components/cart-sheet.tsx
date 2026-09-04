import { validateCoupon } from "@/api/discount";
import { voidCartItem, getCart, clearCartItems, checkoutCart } from "@/api/cart";
import {
  recordCashPayment,
  initiateCardPayment,
  initiateTransferPayment,
  recordSplitPayment,
} from "@/api/payments";
import { ColorPalette, Colors } from "@/constants/theme";
import useCartStore, { CartItem } from "@/hooks/use-cart-store";
import { useSession } from "@/lib/ctx";
import Lucide from "@react-native-vector-icons/lucide";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useRouter } from "expo-router";
import AppBottomSheet from "./bottom-sheet";

export type PaymentMethod = "cash" | "transfer" | "split" | "card";

export interface PaymentReceipt {
  cash: number;
  transfer: number;
  card: number;
  total: number;
  method: PaymentMethod;
}

interface CartSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Sub-Components (Kept in same file for modularity)
 * ────────────────────────────────────────────────────────────────────────── */

interface CartSuccessViewProps {
  receipt: PaymentReceipt;
  colors: ColorPalette;
  onFinish: () => void;
}

export const CartSuccessView = ({
  receipt,
  colors,
  onFinish,
}: CartSuccessViewProps) => {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successBadge}>
        <Lucide name="check-circle" size={56} color="#10b981" />
      </View>
      <Text style={[styles.successTitle, { color: colors.text }]}>
        Payment Successful!
      </Text>
      <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
        Order completed via {receipt.method.toUpperCase()}
      </Text>

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.sheet,
            borderColor: colors.backgroundElement,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary }}>Total Amount</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₦{receipt.total.toLocaleString()}
          </Text>
        </View>

        {receipt.method === "split" ? (
          <>
            {receipt.cash > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.textSecondary }}>
                  Cash Portion
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  ₦{receipt.cash.toLocaleString()}
                </Text>
              </View>
            )}
            {receipt.transfer > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.textSecondary }}>
                  Transfer Portion
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  ₦{receipt.transfer.toLocaleString()}
                </Text>
              </View>
            )}
            {receipt.card > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.textSecondary }}>
                  Card Portion
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  ₦{receipt.card.toLocaleString()}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.textSecondary }}>Paid via</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {receipt.method === "cash"
                ? "Full Cash"
                : receipt.method === "card"
                  ? "Full Card"
                  : "Full Transfer"}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onFinish}
        style={[
          styles.primaryButton,
          { backgroundColor: "#10b981", width: "100%" },
        ]}
      >
        <Text style={styles.primaryButtonText}>Start New Sale</Text>
      </TouchableOpacity>
    </View>
  );
};

interface CartHeaderProps {
  cartName: string;
  sessionId?: string;
  customerName?: string;
  customerPhone?: string;
  totalItemsCount: number;
  hasItems: boolean;
  colors: ColorPalette;
  onClearCart: () => void;
}

export const CartHeader = ({
  cartName,
  sessionId,
  customerName,
  customerPhone,
  totalItemsCount,
  hasItems,
  colors,
  onClearCart,
}: CartHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <Lucide name="shopping-bag" size={20} color={colors.text} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Cart
            </Text>
            <Text style={[{ color: colors.text, fontSize: 10 }]}>
              ({sessionId?.toUpperCase() || cartName})
            </Text>
          </View>
          {customerName && (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {customerName}
              {customerPhone ? ` · ${customerPhone}` : ""}
            </Text>
          )}
        </View>
        <View>
          {totalItemsCount > 0 && (
            <View style={styles.itemBadge}>
              <Text style={styles.itemBadgeText}>{totalItemsCount}</Text>
            </View>
          )}
        </View>
        {hasItems && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClearCart}
            style={styles.clearCartBtn}
          >
            <Lucide name="trash-2" size={16} color={colors.error} />
            <Text style={[styles.clearCartText, { color: colors.error }]}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface CartEmptyStateProps {
  colors: ColorPalette;
}

export const CartEmptyState = ({ colors }: CartEmptyStateProps) => {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconBg,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Lucide name="shopping-cart" size={40} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Your cart is empty
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Add products to process an order
      </Text>
    </View>
  );
};

interface CartItemRowProps {
  item: CartItem;
  colors: ColorPalette;
  onQuantityChange: (newQty: number) => void;
  onRemove: () => void;
}

export const CartItemRow = ({
  item,
  colors,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) => {
  return (
    <View
      style={[
        styles.itemCard,
        {
          borderColor: colors.backgroundElement,
        },
      ]}
    >
      <View style={styles.itemMainInfo}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.product.name}
          </Text>
          {item.product.category && (
            <Text
              style={[styles.itemCategory, { color: colors.textSecondary }]}
            >
              {item.product.category.name}
            </Text>
          )}
          <Text style={[styles.itemUnitPrice, { color: colors.textSecondary }]}>
            ₦{item.product.price.toLocaleString()} each
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRemove}
          style={styles.removeItemBtn}
        >
          <Lucide name="x" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemBottomRow}>
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onQuantityChange(item.quantity - 1)}
            style={[
              styles.stepperBtn,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Lucide name="minus" size={14} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.stepperQty, { color: colors.text }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onQuantityChange(item.quantity + 1)}
            style={[
              styles.stepperBtn,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Lucide name="plus" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.itemTotalPrice, { color: colors.text }]}>
          ₦{(item.product.price * item.quantity).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

interface CartItemsListProps {
  items: CartItem[];
  activeCartId: string;
  colors: ColorPalette;
  onUpdateQuantity: (cartId: string, productId: string, qty: number) => void;
  onRemoveItem: (cartId: string, productId: string) => void;
}

export const CartItemsList = ({
  items,
  activeCartId,
  colors,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemsListProps) => {
  return (
    <View style={styles.itemsList}>
      {items.map((item) => (
        <CartItemRow
          key={item.product.id}
          item={item}
          colors={colors}
          onQuantityChange={(qty) =>
            onUpdateQuantity(activeCartId, item.product.id, qty)
          }
          onRemove={() => onRemoveItem(activeCartId, item.product.id)}
        />
      ))}
    </View>
  );
};

interface CouponInputProps {
  couponCode: string | null;
  discountAmount: number;
  cartSubtotal: number;
  colors: ColorPalette;
  onApply: (code: string) => void;
  onRemove: () => void;
  isValidating: boolean;
}

export const CouponInput = ({
  couponCode,
  discountAmount,
  cartSubtotal,
  colors,
  onApply,
  onRemove,
  isValidating,
}: CouponInputProps) => {
  const [inputCode, setInputCode] = useState("");

  const handleApply = () => {
    if (inputCode.trim()) {
      onApply(inputCode.trim().toUpperCase());
      setInputCode("");
    }
  };

  if (couponCode) {
    return (
      <View
        style={[
          styles.couponApplied,
          { backgroundColor: "#10b98110", borderColor: "#10b98130" },
        ]}
      >
        <View style={styles.couponAppliedLeft}>
          <Lucide name="ticket" size={16} color="#10b981" />
          <View>
            <Text style={[styles.couponCode, { color: "#10b981" }]}>
              {couponCode}
            </Text>
            <Text
              style={[styles.couponDiscount, { color: colors.textSecondary }]}
            >
              -₦{discountAmount.toLocaleString()} off
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.couponRemoveBtn}>
          <Lucide name="x" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.couponInputRow}>
      <View
        style={[
          styles.couponInputWrapper,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Lucide name="ticket" size={16} color={colors.textSecondary} />
        <TextInput
          placeholder="Enter coupon code"
          placeholderTextColor={colors.textSecondary}
          value={inputCode}
          onChangeText={setInputCode}
          autoCapitalize="characters"
          style={[styles.couponTextInput, { color: colors.text }]}
          onSubmitEditing={handleApply}
          returnKeyType="done"
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleApply}
        disabled={!inputCode.trim() || isValidating}
        style={[
          styles.couponApplyBtn,
          {
            backgroundColor: inputCode.trim()
              ? "#3b82f6"
              : colors.backgroundElement,
            opacity: inputCode.trim() && !isValidating ? 1 : 0.5,
          },
        ]}
      >
        {isValidating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            style={[
              styles.couponApplyText,
              { color: inputCode.trim() ? "#fff" : colors.textSecondary },
            ]}
          >
            Apply
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

interface PaymentMethodTabsProps {
  paymentMethod: PaymentMethod;
  colors: ColorPalette;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentMethodTabs = ({
  paymentMethod,
  colors,
  onSelectMethod,
}: PaymentMethodTabsProps) => {
  const methods: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: "cash", label: "Cash", icon: "banknote" },
    { key: "transfer", label: "Transfer", icon: "arrow-left-right" },
    { key: "card", label: "Card", icon: "credit-card" },
    { key: "split", label: "Split", icon: "pie-chart" },
  ];

  return (
    <View style={styles.paymentMethodTabs}>
      {methods.map((method) => {
        const isSelected = paymentMethod === method.key;
        return (
          <TouchableOpacity
            key={method.key}
            activeOpacity={0.7}
            onPress={() => onSelectMethod(method.key)}
            style={[
              styles.methodTab,
              {
                backgroundColor: isSelected ? "#2f7df615" : colors.card,
                borderColor: isSelected ? "#2f7df6" : colors.backgroundElement,
              },
            ]}
          >
            <Lucide
              name={method.icon as any}
              size={20}
              color={isSelected ? "#2f7df6" : colors.textSecondary}
            />
            <Text
              style={[
                styles.methodTabText,
                { color: isSelected ? "#2f7df6" : colors.text },
              ]}
            >
              {method.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface SplitPaymentBoxProps {
  cashInput: string;
  transferInput: string;
  cardInput: string;
  numCash: number;
  numTransfer: number;
  numCard: number;
  totalPaid: number;
  totalPrice: number;
  isPaidValid: boolean;
  remainingNeeded: number;
  colors: ColorPalette;
  onCashChange: (val: string) => void;
  onTransferChange: (val: string) => void;
  onCardChange: (val: string) => void;
  onSplitEven: () => void;
}

export const SplitPaymentBox = ({
  cashInput,
  transferInput,
  cardInput,
  numCash,
  numTransfer,
  numCard,
  totalPaid,
  totalPrice,
  isPaidValid,
  remainingNeeded,
  colors,
  onCashChange,
  onTransferChange,
  onCardChange,
  onSplitEven,
}: SplitPaymentBoxProps) => {
  return (
    <Animated.View
      entering={FadeIn.duration(240).springify().damping(14).stiffness(120)}
      exiting={FadeOut.duration(160)}
      style={[
        styles.splitBox,
        {
          backgroundColor: colors.card,
          borderColor: colors.backgroundElement,
        },
      ]}
    >
      <View style={styles.splitHeaderRow}>
        <Text style={[styles.splitBoxTitle, { color: colors.text }]}>
          Split Payment Details
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSplitEven}
          style={styles.fiftyFiftyBtn}
        >
          <Text style={styles.fiftyFiftyText}>Split Even</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.splitInputGroup}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Cash (₦)
          </Text>
          <TextInput
            keyboardType="numeric"
            value={cashInput}
            onChangeText={onCashChange}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.backgroundElement,
                color: colors.text,
              },
            ]}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Transfer (₦)
          </Text>
          <TextInput
            keyboardType="numeric"
            value={transferInput}
            onChangeText={onTransferChange}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.backgroundElement,
                color: colors.text,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.splitInputGroup}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Card (₦)
          </Text>
          <TextInput
            keyboardType="numeric"
            value={cardInput}
            onChangeText={onCardChange}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.backgroundElement,
                color: colors.text,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.splitBreakdownRow}>
        <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
          Paid: ₦{numCash.toLocaleString()} (Cash) + ₦
          {numTransfer.toLocaleString()} (Transfer) + ₦
          {numCard.toLocaleString()} (Card) = ₦{totalPaid.toLocaleString()}
        </Text>
      </View>

      {!isPaidValid && (
        <Text style={[styles.warningText, { color: colors.error }]}>
          {remainingNeeded > 0
            ? `₦${remainingNeeded.toLocaleString()} remaining to match total ₦${totalPrice.toLocaleString()}`
            : `Entered amount exceeds total ₦${totalPrice.toLocaleString()}`}
        </Text>
      )}
    </Animated.View>
  );
};

interface CartSummaryCardProps {
  totalItemsCount: number;
  totalPrice: number;
  discountAmount: number;
  couponCode: string | null;
  colors: ColorPalette;
}

export const CartSummaryCard = ({
  totalItemsCount,
  totalPrice,
  discountAmount,
  couponCode,
  colors,
}: CartSummaryCardProps) => {
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.sheet,
          borderColor: colors.backgroundElement,
        },
      ]}
    >
      <View style={styles.summaryRow}>
        <Text style={{ color: colors.textSecondary }}>
          Subtotal ({totalItemsCount} items)
        </Text>
        <Text style={{ color: colors.text, fontWeight: "600" }}>
          ₦{totalPrice.toLocaleString()}
        </Text>
      </View>
      {discountAmount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={{ color: "#10b981" }}>
            Discount{couponCode ? ` (${couponCode})` : ""}
          </Text>
          <Text style={{ color: "#10b981", fontWeight: "600" }}>
            -₦{discountAmount.toLocaleString()}
          </Text>
        </View>
      )}
      <View style={[styles.summaryRow, { marginTop: 8 }]}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>
          Total Due
        </Text>
        <Text style={[styles.totalAmount, { color: colors.text }]}>
          ₦{finalTotal.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

interface CartCheckoutButtonProps {
  totalPrice: number;
  paymentMethod: PaymentMethod;
  isPaidValid: boolean;
  isCheckingOut: boolean;
  numCash: number;
  numTransfer: number;
  numCard: number;
  splitPaidCash: boolean;
  splitPaidTransfer: boolean;
  splitPaidCard: boolean;
  onCheckout: (method?: "cash" | "transfer" | "card") => void;
}

const SPLIT_SPRING = { damping: 16, stiffness: 140, mass: 0.8 };

export const CartCheckoutButton = ({
  totalPrice,
  paymentMethod,
  isPaidValid,
  isCheckingOut,
  numCash,
  numTransfer,
  numCard,
  splitPaidCash,
  splitPaidTransfer,
  splitPaidCard,
  onCheckout,
}: CartCheckoutButtonProps) => {
  const isSplit = paymentMethod === "split";

  if (isSplit) {
    return (
      <Animated.View
        style={styles.splitButtonRow}
        layout={Layout.springify()
          .damping(SPLIT_SPRING.damping)
          .stiffness(SPLIT_SPRING.stiffness)}
      >
        {numCash > 0 && (
          <Animated.View
            entering={FadeIn.duration(180)
              .delay(60)
              .springify()
              .damping(12)
              .stiffness(120)}
            exiting={FadeOut.duration(120)}
            layout={Layout.springify()
              .damping(SPLIT_SPRING.damping)
              .stiffness(SPLIT_SPRING.stiffness)}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onCheckout("cash")}
              disabled={!isPaidValid || splitPaidCash || isCheckingOut}
              style={[
                styles.splitButton,
                {
                  backgroundColor: splitPaidCash
                    ? "#10b98140"
                    : isPaidValid
                      ? "#10b981"
                      : "#10b98170",
                },
              ]}
            >
              <Lucide
                name={splitPaidCash ? "check-circle" : "banknote"}
                size={18}
                color="#ffffff"
              />
              <Text style={styles.splitButtonText}>
                {splitPaidCash
                  ? `✓ ₦${numCash.toLocaleString()}`
                  : `₦${numCash.toLocaleString()}`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {numTransfer > 0 && (
          <Animated.View
            entering={FadeIn.duration(180)
              .delay(120)
              .springify()
              .damping(12)
              .stiffness(120)}
            exiting={FadeOut.duration(120)}
            layout={Layout.springify()
              .damping(SPLIT_SPRING.damping)
              .stiffness(SPLIT_SPRING.stiffness)}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onCheckout("transfer")}
              disabled={!isPaidValid || splitPaidTransfer || isCheckingOut}
              style={[
                styles.splitButton,
                {
                  backgroundColor: splitPaidTransfer
                    ? "#3b82f640"
                    : isPaidValid
                      ? "#3b82f6"
                      : "#3b82f670",
                },
              ]}
            >
              <Lucide
                name={splitPaidTransfer ? "check-circle" : "arrow-left-right"}
                size={18}
                color="#ffffff"
              />
              <Text style={styles.splitButtonText}>
                {splitPaidTransfer
                  ? `✓ ₦${numTransfer.toLocaleString()}`
                  : `₦${numTransfer.toLocaleString()}`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {numCard > 0 && (
          <Animated.View
            entering={FadeIn.duration(180)
              .delay(180)
              .springify()
              .damping(12)
              .stiffness(120)}
            exiting={FadeOut.duration(120)}
            layout={Layout.springify()
              .damping(SPLIT_SPRING.damping)
              .stiffness(SPLIT_SPRING.stiffness)}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onCheckout("card")}
              disabled={!isPaidValid || splitPaidCard || isCheckingOut}
              style={[
                styles.splitButton,
                {
                  backgroundColor: splitPaidCard
                    ? "#8b5cf640"
                    : isPaidValid
                      ? "#8b5cf6"
                      : "#8b5cf670",
                },
              ]}
            >
              <Lucide
                name={splitPaidCard ? "check-circle" : "credit-card"}
                size={18}
                color="#ffffff"
              />
              <Text style={styles.splitButtonText}>
                {splitPaidCard
                  ? `✓ ₦${numCard.toLocaleString()}`
                  : `₦${numCard.toLocaleString()}`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={Layout.springify()
        .damping(SPLIT_SPRING.damping)
        .stiffness(SPLIT_SPRING.stiffness)}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onCheckout()}
        disabled={!isPaidValid || isCheckingOut}
        style={[
          styles.primaryButton,
          {
            backgroundColor: isPaidValid && !isCheckingOut ? "#2f7df6" : "#2f7df670",
          },
        ]}
      >
        {isCheckingOut ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Lucide name="check-circle" size={20} color="#ffffff" />
        )}
        <Text style={styles.primaryButtonText}>
          {isCheckingOut
            ? "Processing..."
            : `Pay ₦${totalPrice.toLocaleString()} • ${paymentMethod.toUpperCase()}`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CartPaymentSectionProps {
  totalPrice: number;
  totalItemsCount: number;
  discountAmount: number;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  cashInput: string;
  transferInput: string;
  cardInput: string;
  numCash: number;
  numTransfer: number;
  numCard: number;
  totalPaid: number;
  isPaidValid: boolean;
  remainingNeeded: number;
  splitPaidCash: boolean;
  splitPaidTransfer: boolean;
  splitPaidCard: boolean;
  isCheckingOut: boolean;
  colors: ColorPalette;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onCashChange: (val: string) => void;
  onTransferChange: (val: string) => void;
  onCardChange: (val: string) => void;
  onSplitEven: () => void;
  onCheckout: (method?: "cash" | "transfer" | "card") => void;
}

export const CartPaymentSection = ({
  totalPrice,
  totalItemsCount,
  discountAmount,
  couponCode,
  paymentMethod,
  cashInput,
  transferInput,
  cardInput,
  numCash,
  numTransfer,
  numCard,
  totalPaid,
  isPaidValid,
  remainingNeeded,
  splitPaidCash,
  splitPaidTransfer,
  splitPaidCard,
  isCheckingOut,
  colors,
  onSelectPaymentMethod,
  onCashChange,
  onTransferChange,
  onCardChange,
  onSplitEven,
  onCheckout,
}: CartPaymentSectionProps) => {
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  return (
    <View style={styles.paymentSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Payment Method
      </Text>

      <PaymentMethodTabs
        paymentMethod={paymentMethod}
        colors={colors}
        onSelectMethod={onSelectPaymentMethod}
      />

      {paymentMethod === "split" && (
        <SplitPaymentBox
          cashInput={cashInput}
          transferInput={transferInput}
          cardInput={cardInput}
          numCash={numCash}
          numTransfer={numTransfer}
          numCard={numCard}
          totalPaid={totalPaid}
          totalPrice={finalTotal}
          isPaidValid={isPaidValid}
          remainingNeeded={remainingNeeded}
          colors={colors}
          onCashChange={onCashChange}
          onTransferChange={onTransferChange}
          onCardChange={onCardChange}
          onSplitEven={onSplitEven}
        />
      )}

      <CartSummaryCard
        totalItemsCount={totalItemsCount}
        totalPrice={totalPrice}
        discountAmount={discountAmount}
        couponCode={couponCode}
        colors={colors}
      />

      <CartCheckoutButton
        totalPrice={finalTotal}
        paymentMethod={paymentMethod}
        isPaidValid={isPaidValid}
        isCheckingOut={isCheckingOut}
        numCash={numCash}
        numTransfer={numTransfer}
        numCard={numCard}
        splitPaidCash={splitPaidCash}
        splitPaidTransfer={splitPaidTransfer}
        splitPaidCard={splitPaidCard}
        onCheckout={onCheckout}
      />
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Container Component
 * ────────────────────────────────────────────────────────────────────────── */

const CartSheet = ({ visible, onVisibleChange }: CartSheetProps) => {
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const { user } = useSession();
  const router = useRouter();

  const carts = useCartStore((s) => s.carts);
  const activeCartId = useCartStore((s) => s.activeCartId);
  const updateQuantityInCart = useCartStore((s) => s.updateQuantityInCart);
  const removeItemFromCart = useCartStore((s) => s.removeItemFromCart);
  const clearCartById = useCartStore((s) => s.clearCartById);
  const setCartCoupon = useCartStore((s) => s.setCartCoupon);
  const clearCartCoupon = useCartStore((s) => s.clearCartCoupon);

  const activeCart = carts.find((c) => c.id === activeCartId);
  const items = activeCart?.items ?? [];
  const cartName = activeCart?.name ?? "Cart";
  const couponCode = activeCart?.couponCode ?? null;
  const discountAmount = activeCart?.discountAmount ?? 0;

  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState<string>("");
  const [transferInput, setTransferInput] = useState<string>("");
  const [cardInput, setCardInput] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastPayment, setLastPayment] = useState<PaymentReceipt | null>(null);
  const [splitPaidCash, setSplitPaidCash] = useState<boolean>(false);
  const [splitPaidTransfer, setSplitPaidTransfer] = useState<boolean>(false);
  const [splitPaidCard, setSplitPaidCard] = useState<boolean>(false);
  const [splitPaidAmount, setSplitPaidAmount] = useState<{
    method: "cash" | "transfer" | "card";
    amount: number;
  } | null>(null);

  const [voidPinVisible, setVoidPinVisible] = useState(false);
  const [voidPin, setVoidPin] = useState("");
  const [voidQty, setVoidQty] = useState("");
  const [pendingVoidItems, setPendingVoidItems] = useState<
    { itemId: string; productId: string; maxQty: number }[]
  >([]);

  // Sync API cart items (with itemId) into Zustand when sheet opens
  useEffect(() => {
    if (!visible || !activeCart || activeCartId.startsWith("cart-")) return;
    getCart(activeCartId).then((apiCart) => {
      const state = useCartStore.getState();
      const cart = state.carts.find((c) => c.id === activeCartId);
      if (!cart) return;
      const merged = apiCart.items.map((apiItem) => {
        const local = cart.items.find((i) => i.product.id === apiItem.product_id);
        return {
          product: local?.product ?? {
            id: apiItem.product_id,
            name: apiItem.name,
            price: apiItem.unit_price,
            in_stock: 0,
          },
          quantity: apiItem.qty,
          itemId: apiItem.id,
        };
      });
      useCartStore.setState((s) => ({
        carts: s.carts.map((c) =>
          c.id === activeCartId ? { ...c, items: merged } : c,
        ),
      }));
    }).catch(() => {});
  }, [visible, activeCartId]);

  // Coupon validation
  const { mutate: validateCouponCode, isPending: isValidatingCoupon } =
    useMutation({
      mutationFn: (code: string) => validateCoupon(code, totalPrice),
      onSuccess: (result) => {
        if (result.valid) {
          setCartCoupon(
            activeCartId,
            result.code ?? couponCode,
            result.discount_amount,
          );
        } else {
          Alert.alert(
            "Invalid Coupon",
            result.message || "This coupon is not valid",
          );
        }
      },
      onError: () => {
        Alert.alert("Error", "Failed to validate coupon. Please try again.");
      },
    });

  const handleApplyCoupon = (code: string) => {
    validateCouponCode(code);
  };

  const handleRemoveCoupon = () => {
    clearCartCoupon(activeCartId);
  };

  useEffect(() => {
    if (!visible) {
      setIsSuccess(false);
      setPaymentMethod("cash");
      setCashInput("");
      setTransferInput("");
      setCardInput("");
      setSplitPaidCash(false);
      setSplitPaidTransfer(false);
      setSplitPaidCard(false);
      setSplitPaidAmount(null);
    }
  }, [visible]);

  useEffect(() => {
    const allPaid =
      (numCash > 0 ? splitPaidCash : true) &&
      (numTransfer > 0 ? splitPaidTransfer : true) &&
      (numCard > 0 ? splitPaidCard : true);

    if (paymentMethod === "split" && allPaid && !isSuccess) {
      setLastPayment({
        cash: numCash,
        transfer: numTransfer,
        card: numCard,
        total: finalTotal,
        method: "split",
      });
      setIsSuccess(true);
    }
  }, [splitPaidCash, splitPaidTransfer, splitPaidCard]);

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === "split" && finalTotal > 0) {
      const third = Math.round(finalTotal / 3);
      setCashInput(third.toString());
      setTransferInput(third.toString());
      setCardInput((finalTotal - third * 2).toString());
    }
  };

  const handleCashChange = (val: string) => {
    setCashInput(val);
  };

  const handleTransferChange = (val: string) => {
    setTransferInput(val);
  };

  const handleCardChange = (val: string) => {
    setCardInput(val);
  };

  const handleSplitEven = () => {
    const third = Math.round(finalTotal / 3);
    setCashInput(third.toString());
    setTransferInput(third.toString());
    setCardInput((finalTotal - third * 2).toString());
  };

  const numCash =
    paymentMethod === "cash"
      ? finalTotal
      : paymentMethod === "split"
        ? parseFloat(cashInput) || 0
        : 0;

  const numTransfer =
    paymentMethod === "transfer"
      ? finalTotal
      : paymentMethod === "split"
        ? parseFloat(transferInput) || 0
        : 0;

  const numCard =
    paymentMethod === "card"
      ? finalTotal
      : paymentMethod === "split"
        ? parseFloat(cardInput) || 0
        : 0;

  const totalPaid = numCash + numTransfer + numCard;
  const isPaidValid = finalTotal > 0 && Math.abs(totalPaid - finalTotal) < 0.01;
  const remainingNeeded = Math.max(0, finalTotal - totalPaid);

  const { mutate: checkoutMutation, isPending: isCheckingOut } = useMutation({
    mutationFn: async (method: "cash" | "transfer" | "card") => {
      const checkoutResult = await checkoutCart(activeCartId, {
        customer_name: activeCart?.customerName || undefined,
        customer_phone: activeCart?.customerPhone || undefined,
      });

      const saleId = checkoutResult.sale_id;
      const customerEmail = user?.email || "";

      if (method === "cash") {
        await recordCashPayment({ sale_id: saleId, amount: finalTotal });
        return { type: "cash" as const };
      }

      if (method === "card") {
        const [cardResult, transferResult] = await Promise.all([
          initiateCardPayment({ sale_id: saleId, amount: finalTotal, customer_email: customerEmail }),
          initiateTransferPayment({ sale_id: saleId, amount: finalTotal, customer_email: customerEmail }),
        ]);
        return {
          type: "card" as const,
          saleId,
          cardResult,
          transferResult,
        };
      }

      // transfer
      const transferResult = await initiateTransferPayment({
        sale_id: saleId, amount: finalTotal, customer_email: customerEmail,
      });
      return {
        type: "transfer" as const,
        saleId,
        transferResult,
      };
    },
    onSuccess: (result) => {
      if (result.type === "cash") {
        clearCartById(activeCartId);
        setIsSuccess(true);
        return;
      }

      onVisibleChange(false);

      if (result.type === "card") {
        router.push({
          pathname: "/(tabs)/(pos)/payment-awaiting/[saleId]",
          params: {
            saleId: result.saleId,
            paymentId: result.cardResult.payment_id,
            method: "card",
            amount: String(finalTotal),
            qrCode: result.cardResult.qr_code_base64 || "",
            txRef: result.cardResult.tx_ref || "",
            accountNumber: result.transferResult.account_number || "",
            bankName: result.transferResult.bank_name || "",
            expiryDate: result.transferResult.expiry_date || "",
          },
        });
      } else {
        router.push({
          pathname: "/(tabs)/(pos)/payment-awaiting/[saleId]",
          params: {
            saleId: result.saleId,
            paymentId: result.transferResult.payment_id,
            method: "transfer",
            amount: String(finalTotal),
            accountNumber: result.transferResult.account_number || "",
            bankName: result.transferResult.bank_name || "",
            txRef: result.transferResult.tx_ref || "",
            expiryDate: result.transferResult.expiry_date || "",
          },
        });
      }
    },
    onError: (err: any) => {
      Alert.alert("Payment Failed", err?.message || "Something went wrong");
    },
  });

  const { mutate: splitCheckoutMutation, isPending: isSplitCheckingOut } = useMutation({
    mutationFn: async () => {
      const checkoutResult = await checkoutCart(activeCartId, {
        customer_name: activeCart?.customerName || undefined,
        customer_phone: activeCart?.customerPhone || undefined,
      });

      const saleId = checkoutResult.sale_id;
      const customerEmail = user?.email || "";

      await recordSplitPayment({
        sale_id: saleId,
        splits: {
          cash: numCash || undefined,
          card: numCard || undefined,
          transfer: numTransfer || undefined,
        },
        customer_email: customerEmail,
      });

      if (numCard > 0) {
        const [cardResult, transferResult] = await Promise.all([
          initiateCardPayment({ sale_id: saleId, amount: numCard, customer_email: customerEmail }),
          initiateTransferPayment({ sale_id: saleId, amount: numCard, customer_email: customerEmail }),
        ]);
        return {
          type: "card" as const,
          saleId,
          cardResult,
          transferResult,
          amount: numCard,
        };
      }

      if (numTransfer > 0) {
        const transferResult = await initiateTransferPayment({
          sale_id: saleId, amount: numTransfer, customer_email: customerEmail,
        });
        return {
          type: "transfer" as const,
          saleId,
          transferResult,
          amount: numTransfer,
        };
      }

      return { type: "cash" as const };
    },
    onSuccess: (result) => {
      if (result.type === "cash") {
        clearCartById(activeCartId);
        setIsSuccess(true);
        return;
      }

      onVisibleChange(false);

      if (result.type === "card") {
        router.push({
          pathname: "/(tabs)/(pos)/payment-awaiting/[saleId]",
          params: {
            saleId: result.saleId,
            paymentId: result.cardResult.payment_id,
            method: "card",
            amount: String(result.amount),
            qrCode: result.cardResult.qr_code_base64 || "",
            txRef: result.cardResult.tx_ref || "",
            accountNumber: result.transferResult.account_number || "",
            bankName: result.transferResult.bank_name || "",
            expiryDate: result.transferResult.expiry_date || "",
          },
        });
      } else {
        router.push({
          pathname: "/(tabs)/(pos)/payment-awaiting/[saleId]",
          params: {
            saleId: result.saleId,
            paymentId: result.transferResult.payment_id,
            method: "transfer",
            amount: String(result.amount),
            accountNumber: result.transferResult.account_number || "",
            bankName: result.transferResult.bank_name || "",
            txRef: result.transferResult.tx_ref || "",
            expiryDate: result.transferResult.expiry_date || "",
          },
        });
      }
    },
    onError: (err: any) => {
      Alert.alert("Payment Failed", err?.message || "Something went wrong");
    },
  });

  const handleCheckout = (method?: "cash" | "transfer" | "card") => {
    if (!isPaidValid) {
      Alert.alert(
        "Invalid Payment",
        `Payment total must equal ₦${finalTotal.toLocaleString()}`,
      );
      return;
    }

    const resolvedMethod = method ?? paymentMethod;

    if (paymentMethod === "split" && method) {
      if (method === "cash" && !splitPaidCash) {
        setSplitPaidCash(true);
        setSplitPaidAmount({ method: "cash", amount: numCash });
        return;
      }
      if (method === "transfer" && !splitPaidTransfer) {
        setSplitPaidTransfer(true);
        setSplitPaidAmount({ method: "transfer", amount: numTransfer });
        return;
      }
      if (method === "card" && !splitPaidCard) {
        setSplitPaidCard(true);
        setSplitPaidAmount({ method: "card", amount: numCard });
        return;
      }
    }

    setLastPayment({
      cash: resolvedMethod === "transfer" || resolvedMethod === "card" ? 0 : numCash,
      transfer: resolvedMethod === "cash" || resolvedMethod === "card" ? 0 : numTransfer,
      card: resolvedMethod === "cash" || resolvedMethod === "transfer" ? 0 : numCard,
      total: finalTotal,
      method: resolvedMethod,
    });

    if (paymentMethod === "split") {
      splitCheckoutMutation();
    } else {
      checkoutMutation(resolvedMethod as "cash" | "transfer" | "card");
    }
  };

  const handleFinishSuccess = () => {
    clearCartById(activeCartId);
    setIsSuccess(false);
    onVisibleChange(false);
  };

  const handleRemoveItem = (cartId: string, productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    if (!item) return;
    setPendingVoidItems([{ itemId: item.itemId ?? "", productId, maxQty: item.quantity }]);
    setVoidPin("");
    setVoidQty("");
    setVoidPinVisible(true);
  };

  const handleQuantityChange = (cartId: string, productId: string, newQty: number) => {
    if (newQty <= 0) {
      const item = items.find((i) => i.product.id === productId);
      if (item) {
        setPendingVoidItems([{ itemId: item.itemId ?? "", productId, maxQty: item.quantity }]);
        setVoidPin("");
        setVoidQty("");
        setVoidPinVisible(true);
        return;
      }
    }
    updateQuantityInCart(cartId, productId, newQty);
  };

  const handleVoidSubmit = async () => {
    if (!voidPin.trim() || pendingVoidItems.length === 0) return;
    try {
      const pin = voidPin.trim();
      const isClearAll = pendingVoidItems.length > 1 && !voidQty.trim();

      if (isClearAll) {
        // Bulk clear — single API call
        await clearCartItems(activeCartId, { supervisor_pin: pin });
        clearCartById(activeCartId);
      } else {
        // Single item void (possibly partial qty)
        const voidedQty = voidQty.trim() ? Number(voidQty.trim()) : undefined;
        for (const item of pendingVoidItems) {
          if (item.itemId) {
            await voidCartItem(item.itemId, { supervisor_pin: pin, qty: voidedQty });
          }
          if (voidedQty && voidedQty < item.maxQty) {
            // Partial void — update qty in Zustand
            useCartStore.setState((s) => ({
              carts: s.carts.map((c) =>
                c.id === activeCartId
                  ? {
                      ...c,
                      items: c.items.map((i) =>
                        i.itemId === item.itemId
                          ? { ...i, quantity: i.quantity - voidedQty }
                          : i
                      ),
                    }
                  : c
              ),
            }));
          } else {
            removeItemFromCart(activeCartId, item.productId);
          }
        }
      }

      setPendingVoidItems([]);
      setVoidPin("");
      setVoidQty("");
      setVoidPinVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Invalid PIN or void failed");
    }
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    setPendingVoidItems(
      items
        .filter((i) => i.itemId)
        .map((i) => ({ itemId: i.itemId!, productId: i.product.id, maxQty: i.quantity }))
    );
    setVoidPin("");
    setVoidQty("");
    setVoidPinVisible(true);
  };

  return (
    <>
    <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
      <View style={styles.container}>
        {isSuccess && lastPayment ? (
          <CartSuccessView
            receipt={lastPayment}
            colors={colors}
            onFinish={handleFinishSuccess}
          />
        ) : (
          <>
            <CartHeader
              cartName={cartName}
              sessionId={activeCart?.sessionId}
              customerName={activeCart?.customerName}
              customerPhone={activeCart?.customerPhone}
              totalItemsCount={totalItemsCount}
              hasItems={items.length > 0}
              colors={colors}
              onClearCart={handleClearCart}
            />

            {items.length === 0 ? (
              <CartEmptyState colors={colors} />
            ) : (
              <CartItemsList
                items={items}
                activeCartId={activeCartId}
                colors={colors}
                onUpdateQuantity={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
              />
            )}

            {items.length > 0 && (
              <CouponInput
                couponCode={couponCode}
                discountAmount={discountAmount}
                cartSubtotal={totalPrice}
                colors={colors}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                isValidating={isValidatingCoupon}
              />
            )}

            {items.length > 0 && (
              <CartPaymentSection
                totalPrice={totalPrice}
                totalItemsCount={totalItemsCount}
                discountAmount={discountAmount}
                couponCode={couponCode}
                paymentMethod={paymentMethod}
                cashInput={cashInput}
                transferInput={transferInput}
                cardInput={cardInput}
                numCash={numCash}
                numTransfer={numTransfer}
                numCard={numCard}
                totalPaid={totalPaid}
                isPaidValid={isPaidValid}
                remainingNeeded={remainingNeeded}
                splitPaidCash={splitPaidCash}
                splitPaidTransfer={splitPaidTransfer}
                splitPaidCard={splitPaidCard}
                isCheckingOut={isCheckingOut || isSplitCheckingOut}
                colors={colors}
                onSelectPaymentMethod={handleSelectPaymentMethod}
                onCashChange={handleCashChange}
                onTransferChange={handleTransferChange}
                onCardChange={handleCardChange}
                onSplitEven={handleSplitEven}
                onCheckout={handleCheckout}
              />
            )}
          </>
        )}
      </View>
    </AppBottomSheet>

    <AppBottomSheet
      visible={voidPinVisible}
      onVisibleChange={setVoidPinVisible}
      snapPoints={["40%"]}
    >
      <Text style={[styles.voidTitle, { color: colors.text }]}>
        Supervisor PIN Required
      </Text>
      <Text style={[styles.voidSubtitle, { color: colors.textSecondary }]}>
        {pendingVoidItems.length > 1
          ? `Clear all ${pendingVoidItems.length} items from cart?`
          : `Void "${pendingVoidItems[0]?.productId ? items.find((i) => i.product.id === pendingVoidItems[0]?.productId)?.product.name : ""}"`}
      </Text>

      {pendingVoidItems.length === 1 && pendingVoidItems[0].maxQty > 1 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.voidLabel, { color: colors.textSecondary }]}>
            Quantity to void (max {pendingVoidItems[0].maxQty})
          </Text>
          <TextInput
            style={[styles.voidPinInput, { color: colors.text, borderColor: colors.backgroundElement }]}
            placeholder={`All ${pendingVoidItems[0].maxQty}`}
            placeholderTextColor={colors.textSecondary}
            value={voidQty}
            onChangeText={setVoidQty}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      )}

      <TextInput
        style={[styles.voidPinInput, { color: colors.text, borderColor: colors.backgroundElement }]}
        placeholder="Enter supervisor PIN"
        placeholderTextColor={colors.textSecondary}
        value={voidPin}
        onChangeText={setVoidPin}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        autoFocus
      />
      <View style={styles.voidActions}>
        <Pressable
          onPress={() => {
            setVoidPinVisible(false);
            setVoidPin("");
            setVoidQty("");
            setPendingVoidItems([]);
          }}
          style={[styles.voidCancelBtn, { borderColor: colors.backgroundElement }]}
        >
          <Text style={[styles.voidCancelText, { color: colors.text }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleVoidSubmit}
          disabled={!voidPin.trim()}
          style={[
            styles.voidConfirmBtn,
            { backgroundColor: !voidPin.trim() ? colors.textSecondary : colors.error },
          ]}
        >
          <Text style={styles.voidConfirmText}>Confirm</Text>
        </Pressable>
      </View>
    </AppBottomSheet>
    </>
  );
};

export default CartSheet;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
    alignSelf: "auto",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 16,
    width: "100%",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  itemBadge: {
    backgroundColor: "#2f7df6",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  clearCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
  },

  /* Cart Items List */
  itemsList: {
    width: "100%",
    gap: 0,
    borderRadius: 15,
  },
  itemCard: {
    width: "100%",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 10,
    marginTop: -1,
  },
  itemMainInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 13,
    marginTop: 4,
  },
  removeItemBtn: {
    padding: 4,
  },
  itemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperQty: {
    fontSize: 15,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  itemTotalPrice: {
    fontSize: 15,
    fontWeight: "700",
  },

  /* Payment Section */
  paymentSection: {
    width: "100%",
    marginTop: 8,
    paddingHorizontal: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  paymentMethodTabs: {
    flexDirection: "row",
    gap: 10,
  },
  methodTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  methodTabText: {
    fontSize: 11,
    fontWeight: "600",
  },

  /* Split Box */
  splitBox: {
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 15,
    gap: 12,
  },
  splitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  splitBoxTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  fiftyFiftyBtn: {
    backgroundColor: "#2f7df620",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fiftyFiftyText: {
    color: "#2f7df6",
    fontSize: 12,
    fontWeight: "700",
  },
  splitInputGroup: {
    flexDirection: "row",
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  splitBreakdownRow: {
    paddingTop: 4,
  },
  breakdownText: {
    fontSize: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* Summary Card */
  summaryCard: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 15,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
  },

  /* Primary Button */
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 25,
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  splitButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  splitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 25,
    paddingVertical: 14,
  },
  splitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Success View */
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 16,
  },
  successBadge: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  successSubtitle: {
    fontSize: 14,
    marginTop: -8,
  },

  /* Coupon */
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  couponTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    padding: 0,
  },
  couponApplyBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  couponApplyText: {
    fontSize: 14,
    fontWeight: "700",
  },
  couponApplied: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  couponAppliedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: "700",
  },
  couponDiscount: {
    fontSize: 12,
  },
  couponRemoveBtn: {
    padding: 4,
  },
  voidTitle: { fontSize: 18, fontWeight: "700" },
  voidSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  voidLabel: { fontSize: 12, marginBottom: 6 },
  voidPinInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 4,
    textAlign: "center",
  },
  voidActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  voidCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  voidCancelText: { fontSize: 14, fontWeight: "600" },
  voidConfirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  voidConfirmText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
