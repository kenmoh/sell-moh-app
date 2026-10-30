import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

interface GoogleAuthResult {
  idToken: string | null;
  error: string | null;
  promptAsync: () => Promise<void>;
  isLoading: boolean;
}

export interface GoogleAuthConfig {
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
}

/**
 * Google native clients expect the deep-linked redirect URI in reversed
 * client-ID form: com.googleusercontent.apps.<REVERSED>:/oauthredirect.
 */
const googleNativeRedirect = (clientId: string) => {
  const reversed = clientId.replace(".apps.googleusercontent.com", "");
  return `com.googleusercontent.apps.${reversed}:/oauthredirect`;
};

export function useGoogleAuth(config: GoogleAuthConfig): GoogleAuthResult {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isWeb = Platform.OS === "web";
  const clientId = isWeb
    ? config.webClientId ?? ""
    : Platform.OS === "android"
      ? config.androidClientId ?? ""
      : config.iosClientId ?? "";

  const schemeRedirect = makeRedirectUri({
    scheme: "storeflow",
    path: "google",
  });
  const redirectUri = isWeb || !clientId
    ? schemeRedirect
    : googleNativeRedirect(clientId);

  const [request, response, promptAsync] = useAuthRequest({
    clientId,
    redirectUri,
    usePKCE: true,
    scopes: ["openid", "email", "profile"],
    extraParams: {
      nonce: Crypto.randomUUID(),
    },
  }, discovery);

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        setIdToken(authentication.idToken);
      } else {
        setError("No ID token received from Google");
      }
    } else if (response?.type === "error") {
      setError(response.error?.message || "Google sign-in failed");
    }
  }, [response]);

  const handlePrompt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await promptAsync();
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { idToken, error, promptAsync: handlePrompt, isLoading };
}
