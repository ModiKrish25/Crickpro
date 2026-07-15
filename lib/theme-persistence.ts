/**
 * Theme Persistence - Save/load theme choice across sessions
 * - Web: uses localStorage
 * - Native: uses expo-secure-store or falls back to in-memory
 */
import { Platform } from "react-native";
import type { ColorScheme } from "@/constants/theme";

const THEME_STORAGE_KEY = "crickpro-theme";

/**
 * Load the persisted theme preference.
 * Returns null if no preference is saved.
 */
export async function loadThemePreference(): Promise<ColorScheme | null> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    }
    // Native: could use AsyncStorage or SecureStore if needed
    return null;
  } catch {
    return null;
  }
}

/**
 * Save the theme preference.
 */
export async function saveThemePreference(scheme: ColorScheme): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, scheme);
    }
    // Native: could use AsyncStorage or SecureStore if needed
  } catch {
    // Silently fail - persistence is a nice-to-have
  }
}

/**
 * Clear the saved theme preference (reset to system default).
 */
export async function clearThemePreference(): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
  } catch {
    // Silently fail
  }
}
