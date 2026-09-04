import AView from "@/components/view";
import { Stack } from "expo-router";

const POSLayout = () => {
  return (
    <AView>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="scan" options={{ headerShown: false }} />
        <Stack.Screen name="payment-awaiting/[saleId]" options={{ headerShown: false }} />
      </Stack>
    </AView>
  );
};

export default POSLayout;
