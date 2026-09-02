import { use, createContext, useEffect, useState, type PropsWithChildren } from "react";
import { useStorageState } from "@/lib/useStorageState";
import { AuthUser } from "@/types/auth";
import { setLogoutHandler } from "@/api/client";

export interface SessionData {
  accessToken: string;
  refreshToken: string;
}

const AuthContext = createContext<{
  signIn: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  signOut: () => void;
  session: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  getTokens: () => Promise<{ accessToken: string; refreshToken: string } | null>;
} | null>(null);

export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");
  const [[, userRaw], setUserRaw] = useStorageState("user");
  const [userState, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (userRaw) {
      try {
        setUserState(JSON.parse(userRaw));
      } catch {
        setUserState(null);
      }
    }
  }, [userRaw]);

  useEffect(() => {
    setLogoutHandler(() => {
      setSession(null);
      setUserRaw(null);
      setUserState(null);
    });
    return () => setLogoutHandler(() => {});
  }, []);

  const getTokens = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
    if (!session) return null;
    try {
      const parsed = JSON.parse(session) as SessionData;
      return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: (accessToken, refreshToken, user) => {
          const data: SessionData = { accessToken, refreshToken };
          setSession(JSON.stringify(data));
          setUserRaw(JSON.stringify(user));
          setUserState(user);
        },
        signOut: () => {
          setSession(null);
          setUserRaw(null);
          setUserState(null);
        },
        session,
        user: userState,
        isLoading,
        getTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
