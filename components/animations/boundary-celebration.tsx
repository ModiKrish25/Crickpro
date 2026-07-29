import { View, Text, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

export interface BoundaryCelebrationProps {
  runs: number;
  onAnimationComplete?: () => void;
}

/**
 * Boundary Celebration Animation Component
 * Renders a root transparent Modal overlay for 4s and 6s
 */
export function BoundaryCelebration({ runs, onAnimationComplete }: BoundaryCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 120, easing: Easing.inOut(Easing.cubic) })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 1300 }),
      withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) })
    );

    const timer = setTimeout(() => {
      setVisible(false);
      onAnimationComplete?.();
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  const isSix = runs === 6;
  const title = isSix ? "🎆 SIX! 🎆" : "🎉 FOUR! 🎉";
  const bgColor = isSix ? "#10B981" : "#3B82F6"; // Mint Green for 6, Blue for 4

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => {}}>
      <View
        className="flex-1 items-center justify-center bg-black/60"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={[
            {
              paddingHorizontal: 36,
              paddingVertical: 24,
              borderRadius: 28,
              backgroundColor: bgColor,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#FFFFFF",
              shadowColor: bgColor,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.6,
              shadowRadius: 32,
              elevation: 25,
            },
            animatedStyle,
          ]}
        >
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }}>
            {title}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginTop: 4 }}>
            +{runs} RUNS BOUNDARY!
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
