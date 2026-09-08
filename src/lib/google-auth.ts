import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";

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

export function useGoogleAuth(webClientId: string): GoogleAuthResult {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: "sellmoh",
    path: "google",
  });

  const [request, response, promptAsync] = useAuthRequest({
    clientId: webClientId,
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
