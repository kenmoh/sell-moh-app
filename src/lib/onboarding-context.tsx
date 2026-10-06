import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "onboarded";

type OnboardingContextValue = {
  isLoading: boolean;
  seen: boolean;
  complete: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  isLoading: true,
  seen: false,
  complete: () => {},
});

function readStorage(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return Promise.resolve(localStorage.getItem(KEY));
    } catch {
      return Promise.resolve(null);
    }
  }
  return SecureStore.getItemAsync(KEY).catch(() => null);
}

function writeStorage(value: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
  } else {
    SecureStore.setItemAsync(KEY, value).catch(() => {});
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readStorage().then((value) => {
      if (!cancelled) {
        setSeen(value === "true");
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(() => {
    setSeen(true);
    writeStorage("true");
  }, []);

  return (
    <OnboardingContext.Provider value={{ isLoading, seen, complete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
