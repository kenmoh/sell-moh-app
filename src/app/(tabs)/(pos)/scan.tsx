import { addToCart } from "@/api/cart";
import { getProductById } from "@/api/inventory";
import AppBottomSheet from "@/components/bottom-sheet";
import CartSheet from "@/components/cart-sheet";
import NewCartSheet from "@/components/new-cart-sheet";
import { Colors, Spacing } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useActiveStore } from "@/lib/store-context";
import { ProductResponse } from "@/types/product";
import { Product } from "@/types/product-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const QR_PATTERN = /\/v1\/products\/([0-9a-f-]{36})\/([0-9a-f-]{36})/i;

const SCAN_COOLDOWN_MS = 1500;

const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function toScannedProduct(response: ProductResponse): Product {
  return {
    id: response.id,
    name: response.name,
    description: response.sku ?? "",
    price: response.selling_price,
    in_stock: response.qty,
    reorder_point: response.reorder_point ?? 0,
    imageUrl: response.image_url ?? undefined,
    category: response.category
      ? { id: response.category, name: response.category }
      : undefined,
    taxes: response.taxes ?? [],
  };
}

export default function ScanScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const toast = useToast();
  const { resolvedStoreId } = useActiveStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [hasDetectedQr, setHasDetectedQr] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [newCartVisible, setNewCartVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [scannerAreaLayout, setScannerAreaLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [frameTransform, setFrameTransform] = useState({
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
  });
  const lastScanRef = useRef<{ data: string; time: number } | null>(null);
  const openCartAfterSheetCloseRef = useRef(false);

  const scanFrameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(frameTransform.translateX, {
          damping: 18,
          stiffness: 180,
        }),
      },
      {
        translateY: withSpring(frameTransform.translateY, {
          damping: 18,
          stiffness: 180,
        }),
      },
      {
        scaleX: withSpring(frameTransform.scaleX, {
          damping: 18,
          stiffness: 180,
        }),
      },
      {
        scaleY: withSpring(frameTransform.scaleY, {
          damping: 18,
          stiffness: 180,
        }),
      },
    ],
  }));

  const animateFrameToBounds = (bounds: BarcodeScanningResult["bounds"]) => {
    if (
      !scannerAreaLayout ||
      bounds.size.width <= 0 ||
      bounds.size.height <= 0
    ) {
      return;
    }

    const frameSize = 260;
    const padding = 12;
    const frameCenterX = scannerAreaLayout.x + scannerAreaLayout.width / 2;
    const frameCenterY = scannerAreaLayout.y + frameSize / 2;
    const targetWidth = bounds.size.width + padding * 2;
    const targetHeight = bounds.size.height + padding * 2;

    setFrameTransform({
      translateX: bounds.origin.x + bounds.size.width / 2 - frameCenterX,
      translateY: bounds.origin.y + bounds.size.height / 2 - frameCenterY,
      scaleX: targetWidth / frameSize,
      scaleY: targetHeight / frameSize,
    });
  };

  const handleBarcodeScanned = async ({
    data,
    bounds,
  }: BarcodeScanningResult) => {
    if (isLookingUp || product) return;
    const now = Date.now();
    if (
      lastScanRef.current &&
      lastScanRef.current.data === data &&
      now - lastScanRef.current.time < SCAN_COOLDOWN_MS
    ) {
      return;
    }
    lastScanRef.current = { data, time: now };

    const match = QR_PATTERN.exec(data);
    if (!match) {
      toast.error(
        "Not a product QR code",
        "Point the camera at a store product QR.",
      );
      return;
    }

    const [, qrStoreId, productId] = match;
    setHasDetectedQr(true);
    animateFrameToBounds(bounds);
    setIsLookingUp(true);
    try {
      const response = await getProductById(productId, qrStoreId);
      if (!response) {
        throw new Error("This product no longer exists");
      }
      setProduct(toScannedProduct(response));
      setQuantity(1);
    } catch (error) {
      toast.error(
        "Product not found",
        error instanceof Error ? error.message : "Scan failed, try again.",
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const resetScanner = () => {
    setProduct(null);
    setIsLookingUp(false);
    setHasDetectedQr(false);
    setFrameTransform({ translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 });
  };

  const handleViewCart = () => {
    openCartAfterSheetCloseRef.current = true;
    setProduct(null);
    setIsLookingUp(true);
  };

  const handleAddToCart = async () => {
    if (!product || isAdding) return;
    const state = useCartStore.getState();
    const cartId = state.activeCartId;
    if (!cartId || cartId.startsWith("cart-")) {
      toast.action(
        "No Cart Active",
        "Create a cart first before adding products.",
        [
          {
            label: "Create Cart",
            onPress: () => setNewCartVisible(true),
          },
          { label: "Dismiss", onPress: () => {} },
        ],
        "warning",
      );
      return;
    }
    setIsAdding(true);
    try {
      const item = await addToCart(cartId, {
        product_id: product.id,
        qty: quantity,
      });
      state.addItem(product, quantity, item.id);
      toast.success("Added to cart", `${quantity} × ${product.name}`);
      resetScanner();
    } catch (error) {
      toast.error(
        "Couldn't add to cart",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  if (!permission)
    return (
      <View
        style={[
          styles.permissionScreen,
          { backgroundColor: colors.background },
        ]}
      />
    );

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionScreen,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.permissionIcon,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Text style={styles.permissionIconText}>⌁</Text>
        </View>
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Scan products faster
        </Text>
        <Text
          style={[styles.permissionMessage, { color: colors.textSecondary }]}
        >
          Allow camera access to scan a product QR code and add it to your cart.
        </Text>
        <Pressable onPress={requestPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Allow camera access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          active={!product && !isLookingUp}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <>
          <View style={styles.cameraShade} />
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>QUICK SALE</Text>
                <Text style={styles.title}>Scan product</Text>
              </View>
              <View style={styles.qrBadge}>
                <Text style={styles.qrBadgeText}>QR</Text>
              </View>
            </View>
            <View
              style={styles.scannerArea}
              onLayout={(event) =>
                setScannerAreaLayout(event.nativeEvent.layout)
              }
            >
              <Animated.View style={[styles.scanFrame, scanFrameAnimatedStyle]}>
                {hasDetectedQr ? (
                  <View style={styles.detectedFrame} />
                ) : (
                  <>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </>
                )}
                {isLookingUp && (
                  <View style={styles.lookupOverlay}>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={styles.lookupText}>Finding product…</Text>
                  </View>
                )}
              </Animated.View>
              <Text style={styles.scanHint}>
                Point your camera at a product QR code
              </Text>
            </View>
            <View style={styles.footer}>
              <View style={styles.tipDot} />
              <Text style={styles.footerText}>
                Make sure the code is inside the frame
              </Text>
            </View>
          </View>

          <AppBottomSheet
            visible={Boolean(product)}
            onVisibleChange={(isVisible) => {
              if (!isVisible) {
                resetScanner();
                if (openCartAfterSheetCloseRef.current) {
                  openCartAfterSheetCloseRef.current = false;
                  setCartVisible(true);
                }
              }
            }}
            snapPoints={["65%", "85%"]}
            index={0}
          >
            {product && (
              <>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Add to cart
                </Text>
                <View
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                    },
                  ]}
                >
                  <View style={styles.productCardTop}>
                    <Text
                      numberOfLines={2}
                      style={[styles.productName, { color: colors.text }]}
                    >
                      {product.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: colors.text }]}>
                      {money(product.price)}
                    </Text>
                  </View>
                  <View style={styles.productCardMeta}>
                    <View style={styles.productMetaLeft}>
                      {product.category?.name ? (
                        <Text
                          style={[
                            styles.categoryText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {product.category.name}
                        </Text>
                      ) : null}
                      {product.description ? (
                        <Text
                          style={[
                            styles.skuText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          SKU: {product.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.stockPill}>
                      <Text style={styles.stockPillText}>
                        {product.in_stock} in stock
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.quantityRow,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                    },
                  ]}
                >
                  <Text style={[styles.quantityLabel, { color: colors.text }]}>
                    Quantity
                  </Text>
                  <View style={styles.quantityControl}>
                    <Pressable
                      accessibilityLabel="Decrease quantity"
                      disabled={quantity <= 1}
                      onPress={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                      style={[
                        styles.quantityButton,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Lucide
                        name="minus"
                        size={14}
                        color={
                          quantity <= 1 ? colors.textSecondary : colors.text
                        }
                      />
                    </Pressable>
                    <Text
                      style={[styles.quantityValue, { color: colors.text }]}
                    >
                      {quantity}
                    </Text>
                    <Pressable
                      accessibilityLabel="Increase quantity"
                      disabled={quantity >= product.in_stock}
                      onPress={() =>
                        setQuantity((current) =>
                          Math.min(product.in_stock, current + 1),
                        )
                      }
                      style={[
                        styles.quantityButton,
                        {
                          backgroundColor: colors.card,
                          opacity: quantity >= product.in_stock ? 0.4 : 1,
                        },
                      ]}
                    >
                      <Lucide name="plus" size={14} color={colors.text} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.cartActions}>
                  <Pressable
                    style={[
                      styles.addToCartButton,
                      { backgroundColor: colors.buttonPrimary },
                      (isAdding || product.in_stock === 0) && { opacity: 0.6 },
                    ]}
                    onPress={handleAddToCart}
                    disabled={isAdding || product.in_stock === 0}
                  >
                    {isAdding ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text numberOfLines={1} style={styles.addToCartText}>
                        Add to cart{quantity > 1 ? ` (${quantity})` : ""}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[
                      styles.viewCartButton,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.backgroundSelected,
                      },
                    ]}
                    onPress={handleViewCart}
                    accessibilityRole="button"
                  >
                    <Lucide
                      name="shopping-cart"
                      size={17}
                      color={colors.text}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.viewCartText, { color: colors.text }]}
                    >
                      View cart
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </AppBottomSheet>

          <CartSheet visible={cartVisible} onVisibleChange={setCartVisible} />

          <NewCartSheet
            visible={newCartVisible}
            onVisibleChange={setNewCartVisible}
            storeId={resolvedStoreId ?? ""}
            onCartCreated={() => {}}
          />
        </>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  content: { flex: 1, justifyContent: "space-between", padding: Spacing.four },
  cameraShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(4, 11, 24, 0.48)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: "#9eb8e8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#ffffff", fontSize: 30, fontWeight: "700", marginTop: 5 },
  qrBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
  },
  qrBadgeText: { color: "#ffffff", fontWeight: "800", fontSize: 12 },
  scannerArea: { alignItems: "center", gap: Spacing.four },
  scanFrame: {
    width: 260,
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: "#65a0ff",
  },
  detectedFrame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 3,
    borderColor: "#42e3a4",
    borderRadius: 12,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  lookupOverlay: { alignItems: "center", gap: 10 },
  lookupText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  scanHint: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    alignSelf: "center",
    paddingBottom: Spacing.two,
  },
  tipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#65a0ff" },
  footerText: { color: "rgba(255,255,255,0.72)", fontSize: 12 },
  permissionScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.five,
  },
  permissionIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  permissionIconText: { color: "#2f7df6", fontSize: 36, fontWeight: "700" },
  permissionTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  permissionMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  primaryButton: {
    backgroundColor: "#2f7df6",
    borderRadius: 100,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  productCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  productCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  productPrice: { fontSize: 17, fontWeight: "800" },
  productCardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  productMetaLeft: {
    flex: 1,
    gap: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  skuText: { fontSize: 12 },
  stockPill: {
    backgroundColor: "rgba(5, 150, 105, 0.12)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockPillText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  quantityLabel: { fontSize: 15, fontWeight: "600" },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  cartActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  addToCartButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  viewCartButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  viewCartText: { fontSize: 13, fontWeight: "600" },
  scanAgainButton: { alignItems: "center", paddingVertical: 12 },
  scanAgainText: { fontSize: 14, fontWeight: "600" },
});
