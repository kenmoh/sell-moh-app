import * as Device from "expo-device";
import { Platform } from "react-native";

export function deviceName(): string {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Device.modelName || `${Platform.OS} device`;
  }
  return `${Platform.OS} device`;
}
