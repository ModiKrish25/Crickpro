import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { GlassTokens } from "@/lib/_core/theme";
import { loadThemePreference, saveThemePreference, clearThemePreference } from "./theme-persistence";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  /** True if the user has manually chosen a theme (vs following system) */
  isUserSet: boolean;
  /** Reset to follow the system theme */
  resetToSystem: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Apply scheme to document synchronously
function applyDocumentScheme(scheme: ColorScheme) {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.theme = scheme;
    root.classList.toggle("dark", scheme === "dark");
    const palette = SchemeColors[scheme];
    Object.entries(palette).forEach(([token, value]) => {
      root.style.setProperty(`--color-${token}`, value);
    });
    // Glass tokens
    root.style.setProperty("--color-glass", GlassTokens.glass[scheme]);
    root.style.setProperty("--color-glass-border", GlassTokens.glassBorder[scheme]);
    root.style.setProperty("--color-glass-highlight", GlassTokens.glassHighlight[scheme]);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "dark";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("dark"); // Default dark for CrickPro premium glass UI
  const [isUserSet, setIsUserSet] = useState(false);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    applyDocumentScheme(scheme);
  }, []);

  // Apply default dark scheme synchronously on initial render
  if (typeof document !== "undefined" && !document.documentElement.dataset.theme) {
    applyDocumentScheme("dark");
  }

  useLayoutEffect(() => {
    applyScheme(colorScheme);
  }, [colorScheme, applyScheme]);

  // Load persisted theme on mount
  useEffect(() => {
    loadThemePreference().then((preferred) => {
      const scheme = preferred || systemScheme || "dark";
      setColorSchemeState(scheme);
      setIsUserSet(!!preferred);
      applyScheme(scheme);
    });
  }, [systemScheme, applyScheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    setIsUserSet(true);
    applyScheme(scheme);
    saveThemePreference(scheme);
  }, [applyScheme]);

  const resetToSystem = useCallback(() => {
    setIsUserSet(false);
    const scheme = systemScheme || "dark";
    setColorSchemeState(scheme);
    applyScheme(scheme);
    clearThemePreference();
  }, [applyScheme, systemScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
        // Glass tokens for frosted UI
        "color-glass": GlassTokens.glass[colorScheme],
        "color-glass-border": GlassTokens.glassBorder[colorScheme],
        "color-glass-highlight": GlassTokens.glassHighlight[colorScheme],
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      isUserSet,
      resetToSystem,
    }),
    [colorScheme, setColorScheme, isUserSet, resetToSystem],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1, backgroundColor: SchemeColors[colorScheme].background }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
