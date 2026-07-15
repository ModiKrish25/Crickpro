import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";

export interface BoundaryCelebrationProps {
  runs: number;
  onAnimationComplete?: () => void;
}

/**
 * Boundary Celebration Animation Component
 * Shows celebratory animation for fours and sixes
 */
export function BoundaryCelebration({ runs, onAnimationComplete }: BoundaryCelebrationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    // Animate in and out
    scale.value = withSequence(
      withTiming(1.2, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      })
    );

    translateY.value = withSequence(
      withTiming(-20, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(-40, {
        duration: 600,
        easing: Easing.in(Easing.cubic),
      })
    );

    // Call completion callback after animation
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const isSix = runs === 6;
  const celebrationText = isSix ? "🎆 SIX! 🎆" : "🎉 FOUR! 🎉";

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: -80,
          marginTop: -40,
          width: 160,
          height: 80,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: isSix ? "#FF6B35" : "#4CAF50",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
          }}
        >
          {celebrationText}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#fff",
            marginTop: 4,
          }}
        >
          +{runs} runs
        </Text>
      </View>
    </Animated.View>
  );
}
