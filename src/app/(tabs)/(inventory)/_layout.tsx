import AView from "@/components/view";
import { Colors } from "@/constants/theme";
import Lucide from "@react-native-vector-icons/lucide";
import { router, Stack } from "expo-router";
import { Text, TouchableOpacity, useColorScheme } from "react-native";

const InventoryLayout = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <AView>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Iventory",
            headerShadowVisible: false,
            headerRight: () => (
              <HeaderRight
                onPress={() => router.push("/(tabs)/(inventory)/add-product")}
              />
            ),
          }}
        />
        <Stack.Screen name="[id]" options={{ title: "Product Details" }} />
        <Stack.Screen name="add-product" options={{ title: "Add Product" }} />
      </Stack>
    </AView>
  );
};

export default InventoryLayout;

const HeaderRight = ({ onPress }: { onPress: () => void }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={10}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        paddingHorizontal: 10,
        paddingVertical: 3.5,
        backgroundColor: colors.buttonPrimary,
        borderRadius: 20,
        justifyContent: "center",
      }}
    >
      <Lucide name="plus" size={18} color={"#fff"} />
      <Text style={{ color: "#fff", fontSize: 12 }}>New</Text>
    </TouchableOpacity>
  );
};
