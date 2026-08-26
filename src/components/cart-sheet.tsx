import { ColorPalette, Colors } from "@/constants/theme";
import useCartStore, { CartItem } from "@/hooks/use-cart-store";
import Lucide from "@react-native-vector-icons/lucide";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  withSpring,
} from "react-native-reanimated";
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
                <Text style={{ color: colors.textSecondary }}>Cash Portion</Text>
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
                <Text style={{ color: colors.textSecondary }}>Card Portion</Text>
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
  totalItemsCount: number;
  hasItems: boolean;
  colors: ColorPalette;
  onClearCart: () => void;
}

export const CartHeader = ({
  cartName,
  totalItemsCount,
  hasItems,
  colors,
  onClearCart,
}: CartHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <Lucide name="shopping-bag" size={20} color={colors.text} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {cartName}
        </Text>
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
          backgroundColor: colors.sheet,
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
      entering={FadeIn.duration(240)
        .springify()
        .damping(14)
        .stiffness(120)}
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
  colors: ColorPalette;
}

export const CartSummaryCard = ({
  totalItemsCount,
  totalPrice,
  colors,
}: CartSummaryCardProps) => {
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
      <View style={[styles.summaryRow, { marginTop: 8 }]}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>
          Total Due
        </Text>
        <Text style={[styles.totalAmount, { color: colors.text }]}>
          ₦{totalPrice.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

interface CartCheckoutButtonProps {
  totalPrice: number;
  paymentMethod: PaymentMethod;
  isPaidValid: boolean;
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
              disabled={!isPaidValid || splitPaidCash}
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
              disabled={!isPaidValid || splitPaidTransfer}
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
              disabled={!isPaidValid || splitPaidCard}
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
        disabled={!isPaidValid}
        style={[
          styles.primaryButton,
          {
            backgroundColor: isPaidValid ? "#2f7df6" : "#2f7df670",
          },
        ]}
      >
        <Lucide name="check-circle" size={20} color="#ffffff" />
        <Text style={styles.primaryButtonText}>
          Pay ₦{totalPrice.toLocaleString()} • {paymentMethod.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CartPaymentSectionProps {
  totalPrice: number;
  totalItemsCount: number;
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
  colors,
  onSelectPaymentMethod,
  onCashChange,
  onTransferChange,
  onCardChange,
  onSplitEven,
  onCheckout,
}: CartPaymentSectionProps) => {
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
          totalPrice={totalPrice}
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
        colors={colors}
      />

      <CartCheckoutButton
        totalPrice={totalPrice}
        paymentMethod={paymentMethod}
        isPaidValid={isPaidValid}
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

  const carts = useCartStore((s) => s.carts);
  const activeCartId = useCartStore((s) => s.activeCartId);
  const updateQuantityInCart = useCartStore((s) => s.updateQuantityInCart);
  const removeItemFromCart = useCartStore((s) => s.removeItemFromCart);
  const clearCartById = useCartStore((s) => s.clearCartById);

  const activeCart = carts.find((c) => c.id === activeCartId);
  const items = activeCart?.items ?? [];
  const cartName = activeCart?.name ?? "Cart";

  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);

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
        total: totalPrice,
        method: "split",
      });
      setIsSuccess(true);
    }
  }, [splitPaidCash, splitPaidTransfer, splitPaidCard]);

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === "split" && totalPrice > 0) {
      const third = Math.round(totalPrice / 3);
      setCashInput(third.toString());
      setTransferInput(third.toString());
      setCardInput((totalPrice - third * 2).toString());
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
    const third = Math.round(totalPrice / 3);
    setCashInput(third.toString());
    setTransferInput(third.toString());
    setCardInput((totalPrice - third * 2).toString());
  };

  const numCash =
    paymentMethod === "cash"
      ? totalPrice
      : paymentMethod === "split"
        ? parseFloat(cashInput) || 0
        : 0;

  const numTransfer =
    paymentMethod === "transfer"
      ? totalPrice
      : paymentMethod === "split"
        ? parseFloat(transferInput) || 0
        : 0;

  const numCard =
    paymentMethod === "card"
      ? totalPrice
      : paymentMethod === "split"
        ? parseFloat(cardInput) || 0
        : 0;

  const totalPaid = numCash + numTransfer + numCard;
  const isPaidValid = totalPrice > 0 && Math.abs(totalPaid - totalPrice) < 0.01;
  const remainingNeeded = Math.max(0, totalPrice - totalPaid);

  const handleCheckout = (method?: "cash" | "transfer" | "card") => {
    if (!isPaidValid) {
      Alert.alert(
        "Invalid Payment",
        `Payment total must equal ₦${totalPrice.toLocaleString()}`,
      );
      return;
    }

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

    const resolvedMethod = method ?? paymentMethod;
    setLastPayment({
      cash: resolvedMethod === "transfer" || resolvedMethod === "card" ? 0 : numCash,
      transfer: resolvedMethod === "cash" || resolvedMethod === "card" ? 0 : numTransfer,
      card: resolvedMethod === "cash" || resolvedMethod === "transfer" ? 0 : numCard,
      total: totalPrice,
      method: resolvedMethod,
    });
    setIsSuccess(true);
  };

  const handleFinishSuccess = () => {
    clearCartById(activeCartId);
    setIsSuccess(false);
    onVisibleChange(false);
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => clearCartById(activeCartId),
      },
    ]);
  };

  return (
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
                onUpdateQuantity={updateQuantityInCart}
                onRemoveItem={removeItemFromCart}
              />
            )}

            {items.length > 0 && (
              <CartPaymentSection
                totalPrice={totalPrice}
                totalItemsCount={totalItemsCount}
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
});
