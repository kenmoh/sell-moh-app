import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";

interface AppleAuthResult {
  idToken: string | null;
  error: string | null;
  promptAsync: () => Promise<void>;
  isLoading: boolean;
}

export function useAppleAuth(): AppleAuthResult {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrompt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (result.identityToken) {
        setIdToken(result.identityToken);
      } else {
        setError("No identity token received from Apple");
      }
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        setError(null);
      } else {
        setError(e?.message || "Apple sign-in failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { idToken, error, promptAsync: handlePrompt, isLoading };
}
