/**
 * Clerk Auth Configuration & Providers
 *
 * Configures Clerk Publishable Key, Token Cache, and OAuth social providers
 * for CrickPro (Google, GitHub, Apple).
 */
import { Platform } from "react-native";

// Publishable Key from environment or default active test key
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y2xlcmstY3JpY2twcm8tZGVtby5jbGVyay5hY2NvdW50cy5kZXYk";

export const IS_CLERK_CONFIGURED = Boolean(
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY,
);

export type ClerkProviderType = "oauth_google" | "oauth_github" | "oauth_apple";

export interface ClerkOAuthButtonConfig {
  id: ClerkProviderType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CLERK_SOCIAL_PROVIDERS: ClerkOAuthButtonConfig[] = [
  {
    id: "oauth_google",
    name: "Google",
    icon: "🌐",
    color: "#EA4335",
    bgColor: "rgba(234,67,53,0.10)",
  },
  {
    id: "oauth_github",
    name: "GitHub",
    icon: "🐙",
    color: "#24292E",
    bgColor: "rgba(255,255,255,0.10)",
  },
  {
    id: "oauth_apple",
    name: "Apple",
    icon: "🍎",
    color: "#000000",
    bgColor: "rgba(255,255,255,0.12)",
  },
];

// Secure storage token cache for Clerk (web & native)
export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === "web") {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      }
      const SecureStore = require("expo-secure-store");
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
        }
        return;
      }
      const SecureStore = require("expo-secure-store");
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  async clearToken(key: string) {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(key);
        }
        return;
      }
      const SecureStore = require("expo-secure-store");
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore
    }
  },
};
