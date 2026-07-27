/**
 * Toggle — Switch/toggle component for boolean settings.
 *
 * Design: Glass animated toggle with label and optional description.
 * Follows Apple-style switch with spring animation.
 */
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Label shown to the left */
  label?: string;
  /** Description shown below the label */
  description?: string;
  /** Accent color when on */
  activeColor?: string;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

const TRACK_SIZE = { sm: { w: 36, h: 22, thumb: 16 }, md: { w: 48, h: 28, thumb: 22 }, lg: { w: 56, h: 32, thumb: 26 } };
const THUMB_MARGIN = 3;

export function Toggle({
  value,
  onValueChange,
  label,
  description,
  activeColor = "#34C759",
  size = "md",
  disabled = false,
  className,
}: ToggleProps) {
  const { w, h, thumb } = TRACK_SIZE[size];
  const thumbTranslate = useSharedValue(value ? w - thumb - THUMB_MARGIN * 2 : 0);

  const handlePress = () => {
    if (disabled) return;
    onValueChange(!value);
    thumbTranslate.value = withSpring(value ? 0 : w - thumb - THUMB_MARGIN * 2, {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    });
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbTranslate.value }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      className={cn("flex-row items-center gap-3", className)}
      activeOpacity={0.7}
    >
      {label && (
        <View className="flex-1">
          <Text
            className={cn(
              "text-sm font-semibold text-foreground",
              disabled && "opacity-40",
            )}
          >
            {label}
          </Text>
          {description && (
            <Text className="text-xs text-muted mt-0.5">{description}</Text>
          )}
        </View>
      )}
      <View
        className="rounded-full relative"
        style={{
          width: w,
          height: h,
          backgroundColor: value ? activeColor : "rgba(128,128,128,0.25)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Animated.View
          className="absolute rounded-full"
          style={[
            thumbStyle,
            {
              width: thumb,
              height: thumb,
              top: THUMB_MARGIN,
              left: THUMB_MARGIN,
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

export default Toggle;
