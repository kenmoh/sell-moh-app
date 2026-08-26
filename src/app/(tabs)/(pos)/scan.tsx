import AppBottomSheet from "@/components/bottom-sheet";
import { Colors, Spacing } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { Product } from "@/types/product-types";
import { Button, Column, Text as NativeText } from "@expo/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_PRODUCT: Product = {
  id: "mock-qr-product",
  name: "Everyday Essentials",
  description: "A product found from the QR code.",
  price: 12500,
  in_stock: 24,
  category: { id: "mock-category", name: "Groceries" },
};

export default function ScanScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [permission, requestPermission] = useCameraPermissions();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [visible, setVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    },
    [],
  );

  const handleBarcodeScanned = useCallback(() => {
    if (isLookingUp || product) return;
    setIsLookingUp(true);
    // Replace this timeout with the product lookup API when QR products exist.
    lookupTimeout.current = setTimeout(() => {
      setProduct(MOCK_PRODUCT);
      setQuantity(1);
      setIsLookingUp(false);
    }, 900);
  }, [isLookingUp, product]);

  const resetScanner = () => {
    setProduct(null);
    setIsLookingUp(false);
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
            <View style={styles.scannerArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {isLookingUp && (
                  <View style={styles.lookupOverlay}>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={styles.lookupText}>Finding product…</Text>
                  </View>
                )}
              </View>
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
              if (!isVisible) resetScanner();
            }}
          >
            {product && (
              <Column spacing={14} style={{ paddingLeft: 3, paddingRight: 15 }}>
                <NativeText textStyle={styles.sheetTitle}>
                  {product.name}
                </NativeText>
                <NativeText textStyle={styles.sheetDescription}>
                  {product.description}
                </NativeText>
                <View style={styles.productMeta}>
                  <View>
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      PRICE
                    </Text>
                    <Text style={[styles.price, { color: colors.text }]}>
                      ₦{product.price.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.stockPill}>
                    <Text style={styles.metaLabel}>
                      {product.in_stock} in stock
                    </Text>
                  </View>
                </View>
                <View style={styles.quantityRow}>
                  <Text style={[styles.quantityLabel, { color: colors.text }]}>
                    Quantity
                  </Text>
                  <View style={styles.quantityControl}>
                    <Pressable
                      accessibilityLabel="Decrease quantity"
                      disabled={quantity === 1}
                      onPress={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                      style={[
                        styles.quantityButton,
                        quantity === 1 && styles.quantityButtonDisabled,
                        { backgroundColor: "#B0C4DE" },
                      ]}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </Pressable>
                    <Text
                      style={[styles.quantityValue, { color: colors.text }]}
                    >
                      {quantity}
                    </Text>
                    <Pressable
                      accessibilityLabel="Increase quantity"
                      disabled={quantity === product.in_stock}
                      onPress={() =>
                        setQuantity((current) =>
                          Math.min(product.in_stock, current + 1),
                        )
                      }
                      style={[
                        styles.quantityButton,
                        quantity === product.in_stock &&
                          styles.quantityButtonDisabled,
                        { backgroundColor: "#B0C4DE" },
                      ]}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <Button
                  label="Add to cart"
                  onPress={() => {
                    useCartStore.getState().addItem(product, quantity);
                    resetScanner();
                  }}
                />
                <Pressable onPress={resetScanner} style={styles.title}>
                  <Text style={[{ color: colors.textSecondary }]}>
                    Scan another product
                  </Text>
                </Pressable>
              </Column>
            )}
          </AppBottomSheet>
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

  sheetEyebrow: {
    color: "#2f7df6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  sheetTitle: { fontSize: 25, fontWeight: "800" },
  sheetDescription: { fontSize: 14, color: "#60646C" },
  productMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 2,
    marginBottom: 4,
    width: "90%",
  },
  metaLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  price: { fontSize: 24, fontWeight: "800", marginTop: 3 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  quantityLabel: { fontSize: 15, fontWeight: "700" },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonDisabled: { opacity: 0.9 },
  quantityButtonText: {
    color: "#2f7df6",
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "700",
  },
  quantityValue: {
    minWidth: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  stockPill: {
    backgroundColor: "#e5f6ed",
    borderRadius: 100,
    paddingHorizontal: 11,
  },
});
