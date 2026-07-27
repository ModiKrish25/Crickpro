/**
 * CrickPro Centralized Design Tokens
 * 
 * Apple-inspired live sports experience with a sophisticated dark emerald identity.
 */
export const TOKENS = {
  colors: {
    // Deep Near-Black Dark Emerald Base
    bgDarkBase: "#08120E",
    bgDarkSurface: "#11201A",
    bgDarkSurfaceElevated: "#162821",
    bgDarkCard: "rgba(17, 32, 26, 0.80)",

    // Emerald Accents
    emeraldPrimary: "#10B981",
    emeraldLight: "#34D399",
    emeraldDark: "#059669",
    emeraldGlow: "rgba(16, 185, 129, 0.25)",
    emeraldBorder: "rgba(16, 185, 129, 0.20)",

    // Typography
    textPrimary: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    textInverse: "#06120E",

    // Semantic Match States
    amberWarning: "#F59E0B",
    amberGlow: "rgba(245, 158, 11, 0.20)",
    redWicket: "#EF4444",
    redGlow: "rgba(239, 68, 68, 0.20)",
    blueInfo: "#3B82F6",

    // Borders & Dividers
    borderSubtle: "rgba(255, 255, 255, 0.10)",
    borderTranslucent: "rgba(255, 255, 255, 0.08)",
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  typography: {
    display: { fontSize: 36, fontWeight: "900", letterSpacing: -0.8 },
    h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: "700" },
    body: { fontSize: 14, fontWeight: "400" },
    caption: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.8 },
  },

  animation: {
    fast: 200,
    normal: 300,
    slow: 400,
  },
} as const;
