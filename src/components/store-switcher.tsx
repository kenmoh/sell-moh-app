import AppBottomSheet from "@/components/bottom-sheet";
import { ColorPalette, Colors } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type StoreSwitcherProps = {
  /**
   * "store" — store-bound screens (POS, inventory): always operate on a
   * concrete store, falling back to the first store while the global
   * selection is All Stores.
   * "all" — statement screens: offer an explicit "All Stores" option.
   */
  mode?: "store" | "all";
};

export default function StoreSwitcher({ mode = "store" }: StoreSwitcherProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const {
    isOwner,
    stores,
    activeStoreId,
    activeStoreName,
    resolvedStoreId,
    resolvedStoreName,
    setStore,
    sheetVisible,
    setSheetVisible,
  } = useActiveStore();

  const label = mode === "store" ? resolvedStoreName : activeStoreName;
  const activeRowId = mode === "store" ? resolvedStoreId : activeStoreId;

  const selectStore = (storeId: string | null) => {
    setStore(storeId);
    setSheetVisible(false);
  };

  return (
    <>
      {isOwner ? (
        <Pressable onPress={() => setSheetVisible(true)} style={styles.storeSelector}>
          <Text style={[styles.label, { color: colors.buttonPrimary }]}>
            {label}
          </Text>
          <Lucide name="chevron-down" size={14} color={colors.buttonPrimary} />
        </Pressable>
      ) : (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      {isOwner && (
        <AppBottomSheet
          visible={sheetVisible}
          onVisibleChange={setSheetVisible}
          snapPoints={["40%", "70%"]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Select Store
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              {mode === "all"
                ? "Filter by a store or view all stores"
                : "Choose a store to continue"}
            </Text>
          </View>
          {stores.length > 0 ? (
            <View style={styles.pills}>
              {mode === "all" && (
                <Pressable
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        activeStoreId === null ? "#3b82f6" : colors.backgroundElement,
                    },
                  ]}
                  onPress={() => selectStore(null)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: activeStoreId === null ? "#fff" : colors.text },
                    ]}
                  >
                    All Stores
                  </Text>
                </Pressable>
              )}
              {stores.map((store) => {
                const isActive = activeRowId === store.id;
                return (
                  <Pressable
                    key={store.id}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive
                          ? "#3b82f6"
                          : colors.backgroundElement,
                      },
                    ]}
                    onPress={() => selectStore(store.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isActive ? "#fff" : colors.text },
                      ]}
                    >
                      {store.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No stores available
            </Text>
          )}
        </AppBottomSheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
