/**
 * GlassModal — Premium glass modal overlay with backdrop blur.
 * 
 * Apple visionOS-style modal with:
 * - Frosted glass background with real-time blur
 * - Spring scale-up entrance animation
 * - Backdrop dim with frosted effect
 * - Corner glow accents
 * - Gradient border
 * - Dismiss on backdrop tap
 */
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  type ModalProps,
  type ViewStyle,
} from "react-native";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/lib/theme-provider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

export interface GlassModalProps extends ModalProps {
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Show close button */
  showClose?: boolean;
  /** Close handler */
  onClose: () => void;
  /** Glass intensity */
  intensity?: "subtle" | "medium" | "high";
  /** Maximum width (web) */
  maxWidth?: number;
  /** Footer actions */
  footer?: React.ReactNode;
  /** Glow accent color */
  glowColor?: string;
}

export function GlassModal({
  visible,
  title,
  subtitle,
  showClose = true,
  onClose,
  children,
  intensity = "high",
  maxWidth = 480,
  footer,
  glowColor = "#0066FF",
  ...modalProps
}: GlassModalProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const bgClasses = {
    subtle: isDark ? "bg-white/[0.06]" : "bg-white/50",
    medium: isDark ? "bg-white/[0.08]" : "bg-white/65",
    high: isDark ? "bg-white/[0.10]" : "bg-white/80",
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Animate on visibility change
  if (visible) {
    scale.value = withSpring(1, { damping: 20, stiffness: 300, mass: 0.7 });
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  } else {
    scale.value = 0.9;
    opacity.value = 0;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      {...modalProps}
    >
      {/* Backdrop with blur */}
      <Animated.View
        className="flex-1 items-center justify-center"
        style={[
          animatedContainerStyle,
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
          className="absolute inset-0"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Card */}
        <Animated.View
          className={cn(
            "mx-6 w-full rounded-3xl border overflow-hidden",
            bgClasses[intensity],
            isDark ? "border-white/[0.12]" : "border-white/50",
          )}
          style={[
            animatedCardStyle,
            Platform.OS === "web" ? { maxWidth } : { maxWidth: "90%" as any },
            {
              ...(Platform.OS === "web" ? {
                backdropFilter: "blur(30px) saturate(180%)",
                WebkitBackdropFilter: "blur(30px) saturate(180%)",
              } : {}),
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isDark ? 0.5 : 0.25,
              shadowRadius: 32,
              elevation: 16,
            } as ViewStyle,
          ]}
        >
          {/* Top glow accent */}
          <View
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
            style={{ backgroundColor: glowColor, opacity: isDark ? 0.3 : 0.2 }}
            pointerEvents="none"
          />

          {/* Corner glow */}
          <View
            className="absolute -top-16 -right-16 w-32 h-32 rounded-full"
            style={{ backgroundColor: `${glowColor}10`, opacity: isDark ? 0.3 : 0.12 }}
            pointerEvents="none"
          />

          {/* Header */}
          {(title || showClose) && (
            <View className="flex-row items-start justify-between px-6 pt-6 pb-2">
              <View className="flex-1 gap-1 mr-4">
                {title && (
                  <Text className="text-xl font-bold text-foreground tracking-tight">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text className="text-sm text-muted leading-5">{subtitle}</Text>
                )}
              </View>
              {showClose && (
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Text className="text-sm text-muted">✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View className="px-6 py-4">{children}</View>

          {/* Footer */}
          {footer && (
            <View className="px-6 pb-6 pt-2">{footer}</View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
