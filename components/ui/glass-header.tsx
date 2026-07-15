/**
 * GlassHeader - Glassmorphism gradient header with spatial depth
 * 
 * A premium header component with:
 * - Rich gradient background with glass overlay
 * - Depth shadow for spatial layering
 * - Animated liquid glass sheen
 * - Frosted glass bottom edge
 * - Title and subtitle layout
 */
import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { LiquidGlassOverlay } from "./liquid-glass-overlay";

interface GlassHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  /** Gradient color (defaults to theme primary) */
  gradientColor?: string;
  /** Optional second color for richer gradient */
  gradientColor2?: string;
  /** Whether to show liquid glass animation */
  animated?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function GlassHeader({
  title,
  subtitle,
  gradientColor,
  gradientColor2,
  animated = true,
  size = "md",
  className,
  style,
  ...props
}: GlassHeaderProps) {
  const colors = useColors();
  const primary = gradientColor || colors.primary;
  const secondary = gradientColor2 || `${primary}dd`;

  const sizeStyles = {
    sm: { padding: "p-4", titleSize: "text-xl", subtitleSize: "text-xs" },
    md: { padding: "p-5", titleSize: "text-2xl", subtitleSize: "text-sm" },
    lg: { padding: "p-6 pt-12", titleSize: "text-3xl", subtitleSize: "text-base" },
  };

  const s = sizeStyles[size];

  return (
    <View
      className={cn("relative overflow-hidden rounded-2xl", s.padding, className)}
      style={[
        {
          // Multilayer gradient simulation via layered backgrounds
          backgroundColor: primary,
          // Subtle gradient overlay
          shadowColor: primary,
          shadowOffset: { width: 0, height: size === "lg" ? 8 : 4 },
          shadowOpacity: 0.35,
          shadowRadius: size === "lg" ? 20 : 12,
          elevation: size === "lg" ? 10 : 6,
        },
        // Second gradient layer
        {
          borderWidth: 0,
        },
        style,
      ]}
      {...props}
    >
      {/* Gradient overlay layer (simulates a gradient from primary to darker) */}
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: primary,
          opacity: 0.6,
        }}
      />

      {/* Second gradient tone */}
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: secondary,
          opacity: 0.3,
        }}
      />

      {/* Subtle bottom-to-top lighter fade */}
      <View
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />

      {/* Liquid glass animated sheen */}
      {animated && <LiquidGlassOverlay color="#ffffff" variant="sheen" speed={0.7} />}

      {/* Frosted glass edge accent */}
      <View
        className="absolute bottom-0 left-4 right-4 h-[1px] rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
      />
      <View
        className="absolute top-0 left-4 right-4 h-[1px] rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      />

      {/* Content */}
      <View className="relative z-10 gap-1">
        <Text className={cn("font-bold text-background", s.titleSize)}>
          {title}
        </Text>
        {subtitle && (
          <Text className={cn("text-background/70", s.subtitleSize)}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
