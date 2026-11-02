import {
  exchangeCodeAsync,
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
} from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import { Platform } from "react-native";

interface GoogleAuthResult {
  promptAsync: () => Promise<string | null>;
  isLoading: boolean;
}

export interface GoogleAuthConfig {
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
}

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

/**
 * Google native clients expect the deep-linked redirect URI in reversed
 * client-ID form: com.googleusercontent.apps.<REVERSED>:/oauthredirect.
 */
const googleNativeRedirect = (clientId: string) => {
  const reversed = clientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${reversed}:/oauthredirect`;
};

export function useGoogleAuth(config: GoogleAuthConfig): GoogleAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [nonce] = useState(() => Crypto.randomUUID());

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

  const [request, , promptAsync] = useAuthRequest({
    clientId,
    redirectUri,
    responseType: isWeb ? ResponseType.IdToken : ResponseType.Code,
    usePKCE: !isWeb,
    scopes: ["openid", "email", "profile"],
    extraParams: {
      nonce,
    },
  }, discovery);

  const handlePrompt = async () => {
    setIsLoading(true);
    try {
      if (!request) {
        throw new Error("Google sign-in is not ready yet. Please try again.");
      }

      const result = await promptAsync();
      if (result.type === "error") {
        throw new Error(result.error?.message || "Google sign-in failed");
      }
      if (result.type !== "success") return null;

      let idToken: string | undefined = result.params.id_token;
      if (!isWeb) {
        if (!result.params.code || !request.codeVerifier) {
          throw new Error("Google did not return a verifiable authorization code");
        }
        const tokenResponse = await exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier },
          },
          discovery,
        );
        idToken = tokenResponse.idToken;
      }

      if (!idToken) {
        throw new Error("No ID token received from Google");
      }
      return idToken;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { promptAsync: handlePrompt, isLoading };
}
