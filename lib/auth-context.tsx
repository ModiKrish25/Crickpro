import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import * as Api from "@/lib/_core/api";
import type { User } from "@/lib/_core/auth";
import { useUser as useClerkUser, useClerk } from "@clerk/clerk-expo";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isClerkAuthenticated: boolean;
  /** Start OAuth login flow */
  login: () => Promise<void>;
  /** Send an OTP code to a phone number */
  phoneSendOtp: (phone: string) => Promise<{ success: boolean; devCode?: string; error?: string }>;
  /** Verify the OTP code and complete phone-based authentication */
  phoneVerifyOtp: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  /** Register a new account with email/password */
  emailRegister: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Sign in with email/password */
  emailLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: localUser, loading: localLoading, error, isAuthenticated: isLocalAuthenticated, refresh, logout: authLogout } = useAuth();
  
  // Clerk Auth Integration
  let clerkUser: ReturnType<typeof useClerkUser> = { isLoaded: true, isSignedIn: false, user: null };
  let clerk: ReturnType<typeof useClerk> = { signOut: async () => {} } as any;
  try {
    clerkUser = useClerkUser();
    clerk = useClerk();
  } catch {
    // Fallback if ClerkProvider is not loaded
  }

  const isClerkAuthenticated = Boolean(clerkUser.isLoaded && clerkUser.isSignedIn && clerkUser.user);

  const user: User | null = useMemo(() => {
    if (isClerkAuthenticated && clerkUser.user) {
      const cUser = clerkUser.user;
      return {
        id: Math.abs(cUser.id.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) || 999,
        openId: cUser.id,
        name: cUser.fullName || cUser.firstName || cUser.username || "Cricket Player",
        email: cUser.primaryEmailAddress?.emailAddress || null,
        loginMethod: "clerk",
        lastSignedIn: cUser.lastSignInAt ? new Date(cUser.lastSignInAt) : new Date(),
      };
    }
    return localUser;
  }, [isClerkAuthenticated, clerkUser.user, localUser]);

  const isAuthenticated = isClerkAuthenticated || isLocalAuthenticated;
  const loading = (clerkUser.isLoaded === false) || localLoading;

  const login = useCallback(async () => {
    await startOAuthLogin();
  }, []);

  const phoneSendOtp = useCallback(async (phone: string) => {
    return Api.sendPhoneOtp(phone);
  }, []);

  const phoneVerifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await Api.verifyPhoneOtp(phone, code);
    if (result.success && result.app_session_id && result.user) {
      await Auth.setSessionToken(result.app_session_id);
      const userInfo: User = {
        id: result.user.id,
        openId: result.user.openId,
        name: result.user.name,
        email: result.user.email,
        loginMethod: result.user.loginMethod || "phone",
        lastSignedIn: result.user.lastSignedIn ? new Date(result.user.lastSignedIn) : new Date(),
      };
      await Auth.setUserInfo(userInfo);
      await refresh();
      return { success: true };
    }
    return { success: false, error: result.error || "Verification failed" };
  }, [refresh]);

  const emailRegister = useCallback(async (name: string, email: string, password: string) => {
    const result = await Api.emailRegister(name, email, password);
    if (result.success && result.user) {
      if (result.app_session_id) {
        await Auth.setSessionToken(result.app_session_id);
      }
      const userInfo: User = {
        id: result.user.id,
        openId: result.user.openId,
        name: result.user.name,
        email: result.user.email,
        loginMethod: result.user.loginMethod || "email",
        lastSignedIn: result.user.lastSignedIn ? new Date(result.user.lastSignedIn) : new Date(),
      };
      await Auth.setUserInfo(userInfo);
      await refresh();
      return { success: true };
    }
    return { success: false, error: result.error || "Registration failed" };
  }, [refresh]);

  const emailLogin = useCallback(async (email: string, password: string) => {
    const result = await Api.emailLogin(email, password);
    if (result.success && result.user) {
      if (result.app_session_id) {
        await Auth.setSessionToken(result.app_session_id);
      }
      const userInfo: User = {
        id: result.user.id,
        openId: result.user.openId,
        name: result.user.name,
        email: result.user.email,
        loginMethod: result.user.loginMethod || "email",
        lastSignedIn: result.user.lastSignedIn ? new Date(result.user.lastSignedIn) : new Date(),
      };
      await Auth.setUserInfo(userInfo);
      await refresh();
      return { success: true };
    }
    return { success: false, error: result.error || "Sign in failed" };
  }, [refresh]);

  const logout = useCallback(async () => {
    if (isClerkAuthenticated) {
      try {
        await clerk.signOut();
      } catch (e) {
        console.warn("[Clerk] SignOut error:", e);
      }
    }
    await authLogout();
  }, [isClerkAuthenticated, clerk, authLogout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      isClerkAuthenticated,
      login,
      phoneSendOtp,
      phoneVerifyOtp,
      emailRegister,
      emailLogin,
      logout,
      refresh,
    }),
    [user, loading, error, isAuthenticated, isClerkAuthenticated, login, phoneSendOtp, phoneVerifyOtp, emailRegister, emailLogin, logout, refresh],
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
