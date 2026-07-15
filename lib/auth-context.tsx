/**
 * AuthContext - Centralized authentication state provider
 * Wraps the useAuth hook and provides auth state + login/logout to the entire app.
 * This avoids calling useAuth in every screen and ensures a single source of truth.
 */
import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import type { User } from "@/lib/_core/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, error, isAuthenticated, refresh, logout: authLogout } = useAuth();

  const login = useCallback(async () => {
    await startOAuthLogin();
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
  }, [authLogout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      login,
      logout,
      refresh,
    }),
    [user, loading, error, isAuthenticated, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
