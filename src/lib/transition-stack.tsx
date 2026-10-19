import { withLayoutContext } from "expo-router";
import { createNativeStackNavigator } from "react-native-screen-transitions/native-stack";

const { Navigator } = createNativeStackNavigator();

export const Stack = withLayoutContext(Navigator);
