import Card from "@/components/card";
import DraggableCart from "@/components/draggable-cart";
import ExpandableFAB from "@/components/expandable-fab";
import SearchInput from "@/components/search-input";
import { Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const mockProducts = [
  {
    id: "1",
    name: "Product 1",
    description: "Description 1",
    price: 100,
    in_stock: 100,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "2",
    name: "Product 2",
    description: "Description 2",
    price: 100,
    in_stock: 200,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "3",
    name: "Product 3",
    description: "Description 3",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "4",
    name: "Product 4",
    description: "Description 4",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "5",
    name: "Product 5",
    description: "Description 5",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "6",
    name: "Product 6",
    description: "Description 6",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "7",
    name: "Product 7 ggg uuuuu uuuuuu",
    description: "Description 7",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "8",
    name: "Product 8",
    description: "Description 8",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "9",
    name: "Product 9",
    description: "Description 9",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "10",
    name: "Product 10",
    description: "Description 10",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "11",
    name: "Product 11",
    description: "Description 11",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "12",
    name: "Product 12",
    description: "Description 12",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "13",
    name: "Product 13",
    description: "Description 13",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
  {
    id: "14",
    name: "Product 14",
    description: "Description 14",
    price: 100,
    in_stock: 500,
    category: {
      id: "1",
      name: "Category 1",
    },
  },
];

const index = () => {
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  const filteredProducts = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <FlatList
        style={{ width: "100%" }}
        data={filteredProducts}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        numColumns={2}
        ListHeaderComponent={() => (
          <View
            style={{
              width: "100%",
              backgroundColor: colors.background,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products..."
              containerStyle={{ flex: 1 }}
            />
            <Pressable
              onPress={() => router.push("/(tabs)/scan")}
              style={[styles.scanButton, { backgroundColor: colors.textInput }]}
            >
              <Lucide
                name="scan-qr-code"
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        )}
        columnWrapperStyle={{
          gap: 10,
          marginVertical: 5,
          justifyContent: "center",
        }}
        renderItem={({ item }) => (
          <Card
            product={item}
            onPress={() => useCartStore.getState().addItem(item)}
          />
        )}
        keyExtractor={(item, index) => item.id || String(index)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
      <DraggableCart />
      <ExpandableFAB />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  scanButton: {
    borderRadius: 25,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
