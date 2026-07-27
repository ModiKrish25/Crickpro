/**
 * GlassHeader - Premium glassmorphism header with ambient lighting,
 * spatial depth layers, and frosted translucent effect.
 * 
 * Now supports two modes:
 * 1. Gradient solid mode (original) - rich gradient with ambient light
 * 2. Frosted glass mode (new) - translucent glass with backdrop blur
 * 
 * Features:
 * - Real-time blur on web via backdrop-filter
 * - Liquid glass sheen animation
 * - Depth shadow hierarchy
 * - Frosted glass bottom edge accent
 * - Smooth transitions
 * - High contrast text readability
 */
import { View, Text, type ViewProps, Platform } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { LiquidGlassOverlay } from "./liquid-glass-overlay";

interface GlassHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  gradientColor?: string;
  gradientColor2?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show back gradient overlay */
  overlay?: boolean;
  /** Use frosted glass style instead of solid gradient */
  glass?: boolean;
  /** Glass intensity when glass mode is on */
  glassIntensity?: "subtle" | "medium" | "high";
}

export function GlassHeader({
  title,
  subtitle,
  gradientColor,
  gradientColor2,
  animated = true,
  size = "md",
  overlay = true,
  glass = false,
  glassIntensity = "high",
  className,
  style,
  ...props
}: GlassHeaderProps) {
  const colors = useColors();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const primary = gradientColor || colors.primary;
  const secondary = gradientColor2 || `${primary}99`;

  const sizeStyles = {
    sm: { padding: "p-4", titleSize: "text-xl", subtitleSize: "text-xs", gap: "gap-1" },
    md: { padding: "p-5", titleSize: "text-2xl", subtitleSize: "text-sm", gap: "gap-1.5" },
    lg: { padding: "p-6 pt-12", titleSize: "text-3xl", subtitleSize: "text-base", gap: "gap-2" },
    xl: { padding: "p-8 pt-16", titleSize: "text-4xl", subtitleSize: "text-lg", gap: "gap-3" },
  };

  const s = sizeStyles[size];

  const glassBg = {
    subtle: isDark ? "bg-white/[0.04]" : "bg-white/40",
    medium: isDark ? "bg-white/[0.06]" : "bg-white/55",
    high: isDark ? "bg-white/[0.10]" : "bg-white/75",
  };

  // Frosted glass style
  if (glass) {
    return (
      <View
        className={cn(
          "relative overflow-hidden rounded-3xl border",
          s.padding,
          glassBg[glassIntensity],
          isDark ? "border-white/[0.10]" : "border-white/40",
          className,
        )}
        style={[
          {
            ...(Platform.OS === "web" ? {
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            } : {}),
            shadowColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 16,
            elevation: 6,
          },
          style,
        ]}
        {...props}
      >
        {/* Glass highlight layers */}
        <View className="absolute inset-0" pointerEvents="none">
          <View
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)" }}
          />
          <View
            className="absolute bottom-0 left-4 right-4 h-[1px] rounded-full"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)" }}
          />
          {/* Corner glow */}
          <View
            className="absolute -top-10 -right-10 w-20 h-20 rounded-full"
            style={{ backgroundColor: `${primary}12`, opacity: isDark ? 0.3 : 0.15 }}
          />
        </View>

        {/* Animated sheen */}
        {animated && <LiquidGlassOverlay color="#ffffff" variant="sheen" speed={0.7} intensity={0.5} />}

        {/* Content */}
        <View className="relative z-10 gap-1">
          <Text className={cn("font-bold text-foreground tracking-tight", s.titleSize)}>
            {title}
          </Text>
          {subtitle && (
            <Text className={cn("text-muted leading-relaxed", s.subtitleSize)}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Original gradient style
  return (
    <View
      className={cn("relative overflow-hidden", s.padding, className)}
      style={[
        {
          backgroundColor: primary,
          shadowColor: primary,
          shadowOffset: { width: 0, height: size === "xl" || size === "lg" ? 10 : 6 },
          shadowOpacity: 0.35,
          shadowRadius: size === "xl" || size === "lg" ? 24 : 16,
          elevation: size === "xl" || size === "lg" ? 12 : 8,
        },
        style,
      ]}
      {...props}
    >
      {/* Base gradient layer */}
      <View className="absolute inset-0" style={{ backgroundColor: primary, opacity: 0.5 }} />

      {/* Secondary gradient tone */}
      <View className="absolute inset-0" style={{ backgroundColor: secondary, opacity: 0.3 }} />

      {/* Ambient light overlay - top to bottom fade */}
      {overlay && (
        <View className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
      )}
      
      {/* Top highlight gradient using layered views for cross-platform compatibility */}
      {overlay && (
        <View className="absolute top-0 left-0 right-0 h-1/2" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
      )}

      {/* Depth shadow layer */}
      <View className="absolute bottom-0 left-0 right-0 h-1/3" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

      {/* Liquid glass animated sheen */}
      {animated && <LiquidGlassOverlay color="#ffffff" variant="sheen" speed={0.7} intensity={0.8} />}

      {/* Frosted glass edge accents */}
      <View className="absolute bottom-0 left-4 right-4 h-[1px] rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)" }} />
      <View className="absolute top-0 left-4 right-4 h-[1px] rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

      {/* Corner ambient glow */}
      <View className="absolute -top-8 -right-8 w-20 h-20 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
      <View className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />

      {/* Content */}
      <View className={cn("relative z-10", s.gap)}>
        <Text
          className={cn("font-bold text-background tracking-tight", s.titleSize)}
          style={{ fontFamily: "SF Pro Display" }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className={cn("text-background/70 leading-relaxed", s.subtitleSize)}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
