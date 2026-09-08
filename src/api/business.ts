import { apiClient, BASE_URL } from "./client";
import type { BusinessSettings, BusinessUpdate } from "@/types/business";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const URL = "/business/settings";

const getErrorMessage = (res: any): string => {
  if (res.data && typeof res.data === "object" && res.data.message) {
    return res.data.message;
  }
  return res.problem || "An unknown error occurred";
};

async function getAccessToken(): Promise<string | null> {
  try {
    let raw: string | null;
    if (Platform.OS === "web") {
      raw = localStorage.getItem("session");
    } else {
      raw = await SecureStore.getItemAsync("session");
    }
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}

export const fetchBusinessSettings = async (): Promise<BusinessSettings> => {
  const res = await apiClient.get<{ data: BusinessSettings }>(URL);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data!;
};

export const updateBusinessSettings = async (
  data: BusinessUpdate,
): Promise<BusinessSettings> => {
  const res = await apiClient.patch<{ data: BusinessSettings }>(URL, data);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data!;
};

export const uploadBusinessLogo = async (
  fileUri: string,
): Promise<BusinessSettings> => {
  const formData = new FormData();
  const filename = fileUri.split("/").pop() || "logo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() || "jpeg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  formData.append("file", {
    uri: fileUri,
    name: filename,
    type: mimeType,
  } as any);

  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/business/logo`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Upload failed (${res.status})`);
  }

  const json = await res.json();
  return json.data as BusinessSettings;
};
