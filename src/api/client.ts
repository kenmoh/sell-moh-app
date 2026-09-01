import { ApiResponse, create } from "apisauce";
import type { AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const BASE_URL = "https://salesos.fastapicloud.dev/api/v1";

export const apiClient = create({
  baseURL: BASE_URL,
  headers: { "ngrok-skip-browser-warning": "true" },
});

const SESSION_KEY = "session";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

async function getSessionData(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    let raw: string | null;
    if (Platform.OS === "web") {
      raw = localStorage.getItem(SESSION_KEY);
    } else {
      raw = await SecureStore.getItemAsync(SESSION_KEY);
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function storeSessionData(accessToken: string, refreshToken: string) {
  const data = JSON.stringify({ accessToken, refreshToken });
  if (Platform.OS === "web") {
    localStorage.setItem(SESSION_KEY, data);
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, data);
  }
}

async function clearSession() {
  if (Platform.OS === "web") {
    localStorage.removeItem(SESSION_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

let onLogout: (() => void) | null = null;

export function setLogoutHandler(handler: () => void) {
  onLogout = handler;
}

apiClient.addAsyncRequestTransform(async (request) => {
  const session = await getSessionData();
  if (session?.accessToken) {
    request.headers!["Authorization"] = `Bearer ${session.accessToken}`;
  }
});

apiClient.addMonitor((response) => {
  if (response.status === 401) {
    const originalRequest = response.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (originalRequest._retry) {
      clearSession();
      onLogout?.();
      return response;
    }

    if (isRefreshing) {
      return new Promise<ApiResponse<any>>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(apiClient! as any);
          },
          reject: (err: any) => reject(err),
        });
      }) as any;
    }

    originalRequest._retry = true;
    isRefreshing = true;

    getSessionData()
      .then((session) => {
        if (!session?.refreshToken) {
          throw new Error("No refresh token");
        }
        return apiClient.post<{
          data: { tokens: { access_token: string; refresh_token: string } };
        }>("/auth/refresh", { refresh_token: session.refreshToken });
      })
      .then(async (res) => {
        if (!res.ok || !res.data?.data?.tokens) {
          throw new Error("Refresh failed");
        }
        const { access_token, refresh_token } = res.data.data.tokens;
        await storeSessionData(access_token, refresh_token);

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
        }

        return apiClient.any(originalRequest as any);
      })
      .catch((err) => {
        processQueue(err, null);
        clearSession();
        onLogout?.();
      })
      .finally(() => {
        isRefreshing = false;
      });

    return new Promise<ApiResponse<any>>(() => {});
  }

  return response;
});
