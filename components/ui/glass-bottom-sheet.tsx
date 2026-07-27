/**
 * GlassBottomSheet — Premium spring-animated bottom sheet with glass effect
 *
 * Apple visionOS / iOS 18 style bottom sheet with:
 * - Spring slide-up entrance animation
 * - Drag-to-dismiss gesture
 * - Frosted glass background with blur
 * - Handle bar indicator
 * - Rounded top corners
 * - Backdrop dim with dismiss on tap
 *
 * Animation pattern: Bottom sheet → Spring animation
 */
import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  type ViewStyle,
  type LayoutChangeEvent,
  PanResponder,
} from "react-native";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/lib/theme-provider";
import { useResponsive } from "@/hooks/use-responsive";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  type WithSpringConfig,
} from "react-native-reanimated";

export interface GlassBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: number;
  snapPoints?: [number, number]; // [collapsed, expanded] in pixels
  showHandle?: boolean;
  glowColor?: string;
  springConfig?: WithSpringConfig;
  footer?: React.ReactNode;
  /** Enable drag-to-dismiss */
  draggable?: boolean;
}

const SPRING_CONFIG: WithSpringConfig = {
  damping: 22,
  stiffness: 280,
  mass: 0.7,
  overshootClamping: false,
};

export function GlassBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight,
  snapPoints,
  showHandle = true,
  glowColor = "#0066FF",
  springConfig = SPRING_CONFIG,
  footer,
  draggable = true,
}: GlassBottomSheetProps) {
  const { colorScheme } = useThemeContext();
  const responsive = useResponsive();
  const isDark = colorScheme === "dark";
  const [contentHeight, setContentHeight] = useState(0);

  // Responsive max height (defaults to 75% of screen height)
  const sheetMaxHeight = maxHeight || responsive.height * 0.75;

  // Animation values
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Track if sheet is open for gesture handling
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsOpen(true);
      // Spring entrance animation
      translateY.value = withSpring(0, {
        ...springConfig,
        stiffness: springConfig.stiffness ?? 280,
      } as any);
      backdropOpacity.value = withTiming(1, { duration: 250 });
      scale.value = withTiming(1, { duration: 300 });
    } else {
      // Exit animation
      translateY.value = withTiming(400, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.95, { duration: 200 });
      setTimeout(() => setIsOpen(false), 250);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateY.value = withTiming(400, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.95, { duration: 150 });
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  // Animated styles
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Drag gesture for dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        draggable && gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.value = gestureState.dy;
          backdropOpacity.value = interpolate(
            gestureState.dy,
            [0, 200],
            [1, 0.5],
            Extrapolate.CLAMP,
          );
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Dismiss
          translateY.value = withTiming(400, { duration: 200 });
          backdropOpacity.value = withTiming(0, { duration: 150 });
          setTimeout(() => onClose(), 200);
        } else {
          // Snap back
          translateY.value = withSpring(0, springConfig);
          backdropOpacity.value = withTiming(1, { duration: 150 });
        }
      },
    }),
  ).current;

  if (!visible && !isOpen) return null;

  return (
    <View
      className="absolute inset-0 z-50"
      pointerEvents={visible ? "auto" : "none"}
      style={{ elevation: 50 }}
    >
      {/* Backdrop */}
      <Animated.View
        className="absolute inset-0"
        style={[
          backdropStyle,
          {
            backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)",
            ...(Platform.OS === "web" ? {
              backdropFilter: "blur(8px) saturate(120%)",
              WebkitBackdropFilter: "blur(8px) saturate(120%)",
            } : {}),
          } as ViewStyle,
        ]}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        className="absolute bottom-0 left-0 right-0"
        style={[sheetStyle]}
      >
        <View
          className="rounded-t-[32px] overflow-hidden border"
          style={{
            maxHeight: sheetMaxHeight,
            backgroundColor: isDark
              ? "rgba(28,28,30,0.92)"
              : "rgba(255,255,255,0.92)",
            borderColor: isDark
              ? "rgba(255,255,255,0.10)"
              : "rgba(255,255,255,0.5)",
            ...(Platform.OS === "web" ? {
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
            } : {}),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -12 },
            shadowOpacity: isDark ? 0.6 : 0.15,
            shadowRadius: 32,
            elevation: 24,
          }}
        >
          {/* Top glow accent */}
          <View
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[32px]"
            style={{ backgroundColor: glowColor, opacity: isDark ? 0.3 : 0.15 }}
            pointerEvents="none"
          />

          {/* Corner glows */}
          <View
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
            style={{ backgroundColor: `${glowColor}10`, opacity: isDark ? 0.2 : 0.08 }}
            pointerEvents="none"
          />
          <View
            className="absolute -top-16 -left-16 w-32 h-32 rounded-full"
            style={{ backgroundColor: `${glowColor}08`, opacity: isDark ? 0.15 : 0.06 }}
            pointerEvents="none"
          />

          {/* Handle bar */}
          {showHandle && (
            <View
              className="items-center pt-2 pb-1"
              {...(draggable ? panResponder.panHandlers : {})}
            >
              <View
                className="w-9 h-1 rounded-full"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(0,0,0,0.15)",
                }}
              />
            </View>
          )}

          {/* Header */}
          {(title || subtitle) && (
            <View className="px-6 pt-3 pb-2 gap-1">
              {title && (
                <Text className="text-xl font-bold text-foreground tracking-tight">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text className="text-sm text-muted leading-5">{subtitle}</Text>
              )}
            </View>
          )}

          {/* Content */}
          <Animated.ScrollView
            className="px-6"
            contentContainerStyle={{ paddingBottom: footer ? 16 : 24 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            onLayout={(e: LayoutChangeEvent) =>
              setContentHeight(e.nativeEvent.layout.height)
            }
          >
            {children}
          </Animated.ScrollView>

          {/* Footer */}
          {footer && (
            <View className="px-6 pb-6 pt-2 border-t border-white/10 dark:border-white/[0.06]">
              {footer}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

export default GlassBottomSheet;
