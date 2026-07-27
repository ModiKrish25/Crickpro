/**
 * ScreenContainer - Premium responsive screen wrapper with frosted glass background,
 * backdrop blur, safe area handling, optional gradient overlay, and responsive max-width centering.
 * 
 * Guaranteed full height expansion across Web and Native.
 * 
 * Web: Uses min-height instead of height chains that collapse in CSS.
 * Native: Uses flex: 1 and SafeAreaView for proper safe area handling.
 */
import { View, type ViewProps, Platform } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { useThemeContext } from "@/lib/theme-provider";
import { useResponsive } from "@/hooks/use-responsive";
import { AmbientGradient } from "@/components/ui/ambient-gradient";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
  /** Enable frosted glass background effect */
  glass?: boolean;
  /** Show subtle gradient overlay */
  gradient?: boolean;
  /** Blur amount for web backdrop-filter */
  blurAmount?: number;
  /** Disable responsive max-width centering (use full width on all screens) */
  noMaxWidth?: boolean;
  /** Override max-width (defaults to responsive value) */
  maxWidth?: number;
}

/**
 * Premium ScreenContainer with frosted glass background,
 * safe area handling, optional gradient overlay, and responsive layout.
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  glass = false,
  gradient = false,
  blurAmount = 12,
  noMaxWidth = false,
  maxWidth,
  style,
  ...props
}: ScreenContainerProps) {
  const { colorScheme } = useThemeContext();
  const responsive = useResponsive();
  const isDark = colorScheme === "dark";

  // Responsive horizontal padding
  const hPadding = responsive.horizontalPadding;

  // Content max-width
  const contentMaxWidth = maxWidth || responsive.contentMaxWidth;
  const shouldCenter = !noMaxWidth && contentMaxWidth > 0;

  const isWeb = Platform.OS === "web";

  return (
    <View
      className={cn(
        "flex-1",
        isDark ? "bg-background" : "bg-[#F5F5F7]",
        glass && (isDark ? "bg-black/50" : "bg-white/50"),
        containerClassName,
      )}
      style={[
        isWeb
          ? {
              // Web: use min-height and let content flow naturally
              minHeight: "100vh" as any,
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }
          : {
              // Native: flex fills parent
              flex: 1,
              width: "100%",
            },
        (isWeb && glass) ? {
          backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
        } : {},
        style,
      ] as any}
      {...props}
    >
      {/* Ambient gradient mesh background */}
      {gradient && <AmbientGradient intensity={0.6} />}

      {/* Ambient refraction layer */}
      {glass && (
        <View className="absolute inset-0" pointerEvents="none">
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: isDark
                ? "rgba(0,102,255,0.02)"
                : "rgba(255,255,255,0.08)",
              opacity: 0.6,
            }}
          />
          <View
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(0,102,255,0.03)"
                : "rgba(255,255,255,0.12)",
            }}
          />
        </View>
      )}

      <SafeAreaView
        edges={edges}
        className={cn("flex-1 w-full", safeAreaClassName)}
        style={
          isWeb
            ? {
                width: "100%",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }
            : {
                flex: 1,
                width: "100%",
              }
        }
      >
        {/* Content container — responsive centering */}
        <View
          style={
            isWeb
              ? {
                  flex: 1,
                  width: "100%",
                  maxWidth: shouldCenter ? contentMaxWidth : undefined,
                  paddingLeft: hPadding,
                  paddingRight: hPadding,
                  alignSelf: shouldCenter ? "center" : undefined,
                  display: "flex",
                  flexDirection: "column",
                }
              : {
                  flex: 1,
                  width: "100%",
                  paddingHorizontal: hPadding,
                  maxWidth: shouldCenter ? contentMaxWidth : undefined,
                  alignSelf: shouldCenter ? "center" : undefined,
                }
          }
          className={cn("flex-1 w-full", className)}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default ScreenContainer;
