/**
 * LoadingMessage — Cycling cricket-themed loading messages.
 *
 * Messages crossfade with blur effect. The cycle is driven by
 * real initialization progress, not a timer.
 */
import { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface LoadingMessageProps {
  /** Current loading progress (0–1) to drive message cycling */
  progress: number;
  /** Custom messages to cycle through */
  messages?: string[];
}

const DEFAULT_MESSAGES = [
  "Preparing the pitch...",
  "Setting the field...",
  "Checking the weather...",
  "Players are ready...",
  "Let's play.",
];

const MESSAGE_PROGRESS_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8];

export function LoadingMessage({
  progress,
  messages = DEFAULT_MESSAGES,
}: LoadingMessageProps) {
  const reducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const opacity = useSharedValue(reducedMotion ? 1 : 1);

  // Track which message index we should show based on progress
  useEffect(() => {
    let targetIndex = 0;
    for (let i = MESSAGE_PROGRESS_THRESHOLDS.length - 1; i >= 0; i--) {
      if (progress >= MESSAGE_PROGRESS_THRESHOLDS[i]) {
        targetIndex = i;
        break;
      }
    }
    targetIndex = Math.min(targetIndex, messages.length - 1);

    if (targetIndex !== currentIndex) {
      // Crossfade
      if (!reducedMotion) {
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(setCurrentIndex)(targetIndex);
          opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
        });
      } else {
        setCurrentIndex(targetIndex);
      }
    }
  }, [progress, currentIndex, messages.length, reducedMotion]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      className="text-center"
      style={[
        textStyle,
        {
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          fontWeight: "500",
          letterSpacing: 0.5,
        },
      ]}
    >
      {messages[currentIndex]}
    </Animated.Text>
  );
}

export default LoadingMessage;
