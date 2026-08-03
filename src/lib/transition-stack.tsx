import { withLayoutContext } from "expo-router";
import {
  createNativeStackNavigator,
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
} from "react-native-screen-transitions/native-stack";
import type { StackNavigationState } from "@react-navigation/native";
import type { ParamListBase } from "@react-navigation/native";

const { Navigator } = createNativeStackNavigator();

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator);
