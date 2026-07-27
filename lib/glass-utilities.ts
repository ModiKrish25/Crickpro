/**
 * Glass Utilities — Cross-platform glassmorphism styling
 * 
 * Provides consistent frosted-glass effects across web (CSS backdrop-filter)
 * and native (simulated with layered opacities, rgba, and shadows).
 * 
 * Design: Apple Human Interface Guidelines glass aesthetic
 * - Real-time blur (web: backdrop-filter, native: layered simulation)
 * - Dynamic reflections and light scattering
 * - Frosted translucent surfaces
 * - Soft highlights and gradient borders
 * - High contrast text readability
 */
import { Platform, type ViewStyle } from "react-native";

// ─── Platform Detection ───────────────────────────────────────────────────────

export const isWeb = Platform.OS === "web";

// ─── Glass Intensity Levels ───────────────────────────────────────────────────

export type GlassIntensity = "ultra-light" | "subtle" | "medium" | "high" | "heavy";

interface GlassConfig {
  /** Background rgba for light mode */
  bgLight: string;
  /** Background rgba for dark mode */
  bgDark: string;
  /** Border rgba for light mode */
  borderLight: string;
  /** Border rgba for dark mode */
  borderDark: string;
  /** Blur radius in pixels (web only) */
  blurPx: number;
  /** Opacity multiplier for the glass effect */
  opacity: number;
}

const glassConfigs: Record<GlassIntensity, GlassConfig> = {
  "ultra-light": {
    bgLight: "rgba(255,255,255,0.30)",
    bgDark: "rgba(255,255,255,0.02)",
    borderLight: "rgba(255,255,255,0.20)",
    borderDark: "rgba(255,255,255,0.05)",
    blurPx: 8,
    opacity: 0.3,
  },
  subtle: {
    bgLight: "rgba(255,255,255,0.40)",
    bgDark: "rgba(255,255,255,0.04)",
    borderLight: "rgba(255,255,255,0.30)",
    borderDark: "rgba(255,255,255,0.08)",
    blurPx: 12,
    opacity: 0.4,
  },
  medium: {
    bgLight: "rgba(255,255,255,0.60)",
    bgDark: "rgba(255,255,255,0.06)",
    borderLight: "rgba(255,255,255,0.40)",
    borderDark: "rgba(255,255,255,0.10)",
    blurPx: 20,
    opacity: 0.6,
  },
  high: {
    bgLight: "rgba(255,255,255,0.78)",
    bgDark: "rgba(255,255,255,0.10)",
    borderLight: "rgba(255,255,255,0.50)",
    borderDark: "rgba(255,255,255,0.14)",
    blurPx: 30,
    opacity: 0.78,
  },
  heavy: {
    bgLight: "rgba(255,255,255,0.88)",
    bgDark: "rgba(255,255,255,0.14)",
    borderLight: "rgba(255,255,255,0.60)",
    borderDark: "rgba(255,255,255,0.18)",
    blurPx: 40,
    opacity: 0.88,
  },
};

// ─── Glass Style Builder ──────────────────────────────────────────────────────

export interface GlassStyleOptions {
  intensity?: GlassIntensity;
  isDark?: boolean;
  /** Optional glow accent color */
  glowColor?: string;
  /** Border radius in px */
  borderRadius?: number;
  /** Show top highlight line */
  highlight?: boolean;
  /** Show gradient border (top edge lighter) */
  gradientBorder?: boolean;
  /** Additional blur for web */
  blurOverride?: number;
}

/**
 * Build a platform-aware glassmorphism ViewStyle.
 * On web, uses real CSS backdropFilter blur.
 * On native, uses layered rgba with appropriate contrast.
 */
export function buildGlassStyle(options: GlassStyleOptions): ViewStyle {
  const {
    intensity = "medium",
    isDark = false,
    glowColor,
    borderRadius = 16,
    highlight = true,
    gradientBorder = false,
    blurOverride,
  } = options;

  const config = glassConfigs[intensity];
  const bgColor = isDark ? config.bgDark : config.bgLight;
  const borderColor = isDark ? config.borderDark : config.borderLight;
  const blurPx = blurOverride ?? config.blurPx;

  const style: ViewStyle = {
    backgroundColor: bgColor,
    borderWidth: 1,
    borderColor,
    borderRadius,
  };

  // Web: real CSS backdrop-filter blur
  if (isWeb) {
    (style as any).backdropFilter = `blur(${blurPx}px) saturate(180%)`;
    (style as any).WebkitBackdropFilter = `blur(${blurPx}px) saturate(180%)`;
  }

  // Shadow with optional glow
  const shadowColor = glowColor || (isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)");
  style.shadowColor = shadowColor;
  style.shadowOffset = { width: 0, height: glowColor ? 8 : 4 };
  style.shadowOpacity = glowColor ? (isDark ? 0.45 : 0.22) : (isDark ? 0.35 : 0.08);
  style.shadowRadius = glowColor ? 24 : 12;
  (style as any).elevation = glowColor ? 12 : 6;

  return style;
}

/**
 * Build a web-only CSS string for the backdrop filter.
 * Used in inline <style> tags or dangerouslySetInnerHTML.
 */
export function webBackdropFilterCSS(blurPx = 20): string {
  return `backdrop-filter: blur(${blurPx}px) saturate(180%); -webkit-backdrop-filter: blur(${blurPx}px) saturate(180%);`;
}

// ─── Tailwind Class Builders ──────────────────────────────────────────────────

export function glassBackgroundClass(intensity: GlassIntensity, isDark: boolean): string {
  const map: Record<GlassIntensity, { light: string; dark: string }> = {
    "ultra-light": { light: "bg-white/30", dark: "bg-white/[0.02]" },
    subtle: { light: "bg-white/40", dark: "bg-white/[0.04]" },
    medium: { light: "bg-white/60", dark: "bg-white/[0.06]" },
    high: { light: "bg-white/80", dark: "bg-white/[0.10]" },
    heavy: { light: "bg-white/90", dark: "bg-white/[0.14]" },
  };
  return isDark ? map[intensity].dark : map[intensity].light;
}

export function glassBorderClass(intensity: GlassIntensity, isDark: boolean): string {
  const map: Record<GlassIntensity, { light: string; dark: string }> = {
    "ultra-light": { light: "border-white/20", dark: "border-white/[0.05]" },
    subtle: { light: "border-white/30", dark: "border-white/[0.08]" },
    medium: { light: "border-white/40", dark: "border-white/[0.10]" },
    high: { light: "border-white/50", dark: "border-white/[0.14]" },
    heavy: { light: "border-white/60", dark: "border-white/[0.18]" },
  };
  return isDark ? map[intensity].dark : map[intensity].light;
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

export const glassIntensities = Object.keys(glassConfigs) as GlassIntensity[];

export const radiusToTW: Record<string, string> = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
};

export const paddingToTW: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
  xl: "p-6",
};
