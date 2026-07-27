import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Determine the auth method:
  // - Native platform: use stored session token as Bearer auth
  // - Web (including iframe): use cookie-based auth (browser handles automatically)
  if (Platform.OS !== "web") {
    const sessionToken = await Auth.getSessionToken();
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }
  }

  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : endpoint;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        // Not JSON, use text as is
      }
      // Only log non-401 errors (401 is expected when not authenticated)
      if (response.status !== 401) {
        console.warn("[API] Error:", response.status, errorMessage);
      }
      throw new Error(errorMessage || `API call failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    // 401 is expected when not authenticated — don't log it
    if (error instanceof Error && error.message === "Not authenticated") {
      throw error;
    }
    console.warn("[API] Request failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred");
  }
}

// OAuth callback handler - exchange code for session token
// Calls /api/oauth/mobile endpoint which returns JSON with app_session_id and user
export async function exchangeOAuthCode(
  code: string,
  state: string,
): Promise<{ sessionToken: string; user: any }> {
  console.log("[API] exchangeOAuthCode called");
  // Use GET with query params
  const params = new URLSearchParams({ code, state });
  const endpoint = `/api/oauth/mobile?${params.toString()}`;
  console.log("[API] Calling OAuth mobile endpoint:", endpoint);
  const result = await apiCall<{ app_session_id: string; user: any }>(endpoint);

  // Convert app_session_id to sessionToken for compatibility
  const sessionToken = result.app_session_id;
  console.log("[API] OAuth exchange result:", {
    hasSessionToken: !!sessionToken,
    hasUser: !!result.user,
    sessionToken: sessionToken ? `${sessionToken.substring(0, 50)}...` : null,
  });

  return {
    sessionToken,
    user: result.user,
  };
}

// Logout
export async function logout(): Promise<void> {
  await apiCall<void>("/api/auth/logout", {
    method: "POST",
  });
}

/**
 * Send an OTP code to a phone number.
 */
export async function sendPhoneOtp(
  phone: string,
): Promise<{ success: boolean; devCode?: string; error?: string }> {
  try {
    const result = await apiCall<{ success: boolean; devCode?: string; message: string }>(
      "/api/auth/phone/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ phone }),
      },
    );
    return { success: result.success, devCode: result.devCode };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send code";
    return { success: false, error: message };
  }
}

/**
 * Verify an OTP code and complete phone authentication.
 * Returns the session token and user object on success.
 */
export async function verifyPhoneOtp(
  phone: string,
  code: string,
): Promise<{
  success: boolean;
  app_session_id?: string;
  user?: any;
  error?: string;
}> {
  try {
    const result = await apiCall<{
      success: boolean;
      app_session_id: string;
      user: any;
    }>("/api/auth/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
    return {
      success: result.success,
      app_session_id: result.app_session_id,
      user: result.user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid code";
    return { success: false, error: message };
  }
}

// Get current authenticated user (web uses cookie-based auth)
export async function getMe(): Promise<{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const result = await apiCall<{ user: any }>("/api/auth/me", { signal: controller.signal });
    clearTimeout(timer);
    return result.user || null;
  } catch (error) {
    // Not authenticated is not an error — caller handles null user gracefully
    return null;
  }
}

// Establish session cookie on the backend (3000-xxx domain)
// Called after receiving token via postMessage to get a proper Set-Cookie from the backend
export async function establishSession(token: string): Promise<boolean> {
  try {
    console.log("[API] establishSession: setting cookie on backend...");
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/auth/session`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // Important: allows Set-Cookie to be stored
    });

    if (!response.ok) {
      console.error("[API] establishSession failed:", response.status);
      return false;
    }

    console.log("[API] establishSession: cookie set successfully");
    return true;
  } catch (error) {
    console.error("[API] establishSession error:", error);
    return false;
  }
}

/**
 * Register a new account with email and password.
 */
export async function emailRegister(
  name: string,
  email: string,
  password: string,
): Promise<{ success: boolean; app_session_id?: string; user?: any; error?: string }> {
  try {
    const result = await apiCall<{ success: boolean; app_session_id: string; user: any }>(
      "/api/auth/email/register",
      { method: "POST", body: JSON.stringify({ name, email, password }) },
    );
    return { success: true, app_session_id: result.app_session_id, user: result.user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return { success: false, error: message };
  }
}

/**
 * Sign in with email and password.
 */
export async function emailLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; app_session_id?: string; user?: any; error?: string }> {
  try {
    const result = await apiCall<{ success: boolean; app_session_id: string; user: any }>(
      "/api/auth/email/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    return { success: true, app_session_id: result.app_session_id, user: result.user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    return { success: false, error: message };
  }
}

