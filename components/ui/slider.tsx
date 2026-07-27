/**
 * Slider — Range slider for selecting a numeric value.
 *
 * Design: Glass track with animated thumb. Shows current value as tooltip.
 */
import { useCallback } from "react";
import { View, Text, Platform, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Label above the slider */
  label?: string;
  /** Show current value to the right */
  showValue?: boolean;
  /** Value suffix (e.g. "overs", "%") */
  suffix?: string;
  /** Accent color */
  color?: string;
  /** Additional class names */
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  suffix,
  color = "#0066FF",
  className,
}: SliderProps) {
  const range = max - min;
  const fractionalDigits = step < 1 ? String(step).split(".")[1]?.length ?? 0 : 0;

  const clampedValue = Math.max(min, Math.min(max, value));
  const pct = range > 0 ? (clampedValue - min) / range : 0;

  const progressWidth = useSharedValue(pct);
  const scaleValue = useSharedValue(1);

  const handleUpdate = useCallback(
    (clientX: number, containerWidth: number) => {
      const ratio = Math.max(0, Math.min(1, clientX / containerWidth));
      const rawValue = min + ratio * range;
      const steppedValue = Math.round(rawValue / step) * step;
      const clamped = Math.max(min, Math.min(max, steppedValue));
      progressWidth.value = withSpring((clamped - min) / range, { damping: 20, stiffness: 150 });
      onValueChange(clamped);
    },
    [min, max, range, step, onValueChange],
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      scaleValue.value = withSpring(1.3, { damping: 8, stiffness: 200 });
      handleUpdate(e.nativeEvent.locationX, (e.nativeEvent as any).target ?? 300);
    },
    onPanResponderMove: (e) => {
      handleUpdate(e.nativeEvent.locationX, (e.nativeEvent as any).target ?? 300);
    },
    onPanResponderRelease: () => {
      scaleValue.value = withSpring(1, { damping: 12, stiffness: 200 });
    },
  });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progressWidth.value * 100)}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${Math.round(progressWidth.value * 100)}%`,
    transform: [{ translateX: -10 }, { scale: scaleValue.value }],
  }));

  return (
    <View className={cn("gap-2", className)}>
      {label && (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {showValue && (
            <Text className="text-sm font-bold text-[#0066FF] tabular-nums">
              {value.toFixed(fractionalDigits)}{suffix ? ` ${suffix}` : ""}
            </Text>
          )}
        </View>
      )}

      <View
        className="relative h-8 justify-center"
        onLayout={(e) => {
          // Store width for pan responder
        }}
      >
        {/* Track */}
        <View
          className="absolute left-0 right-0 rounded-full"
          style={{
            height: 6,
            backgroundColor: "rgba(128,128,128,0.15)",
          }}
        />
        {/* Fill */}
        <Animated.View
          className="absolute left-0 rounded-full"
          style={[
            fillStyle,
            { height: 6, backgroundColor: color },
          ]}
        />
        {/* Thumb */}
        <Animated.View
          className="absolute items-center justify-center"
          style={[
            thumbStyle,
            {
              width: 20,
              height: 20,
              marginLeft: -10,
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
              borderWidth: 2,
              borderColor: color,
            },
          ]}
          {...(Platform.OS !== "web" ? panResponder.panHandlers : {})}
        />
      </View>
    </View>
  );
}

export default Slider;
