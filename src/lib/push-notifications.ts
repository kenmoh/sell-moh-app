import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushToken as apiRegisterPushToken } from "@/api/notifications";

let _registered = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true as const,
    shouldPlaySound: true as const,
    shouldSetBadge: false as const,
    shouldShowBanner: true as const,
    shouldShowList: true as const,
  }),
});

export async function requestPushPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (!_registered) {
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await apiRegisterPushToken(token, platform);
      _registered = true;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    return token;
  } catch (err) {
    console.warn("Failed to register push token:", err);
    return null;
  }
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void,
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
