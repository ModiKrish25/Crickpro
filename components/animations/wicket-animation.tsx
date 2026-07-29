import { View, Text, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

export interface WicketAnimationProps {
  playerName: string;
  dismissalType: string;
  onAnimationComplete?: () => void;
}

/**
 * Wicket Animation Component
 * Renders a root transparent Modal overlay when a wicket falls
 */
export function WicketAnimation({
  playerName,
  dismissalType,
  onAnimationComplete,
}: WicketAnimationProps) {
  const [visible, setVisible] = useState(true);
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 120, easing: Easing.inOut(Easing.cubic) })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 1400 }),
      withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) })
    );

    const timer = setTimeout(() => {
      setVisible(false);
      onAnimationComplete?.();
    }, 1700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => {}}>
      <View
        className="flex-1 items-center justify-center bg-black/70"
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
              backgroundColor: "#EF4444",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#FFFFFF",
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.7,
              shadowRadius: 32,
              elevation: 25,
              minWidth: 260,
            },
            animatedStyle,
          ]}
        >
          <Text style={{ fontSize: 30, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }}>
            🚨 WICKET! 🚨
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginTop: 6 }}>
            {playerName}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 2, textTransform: "uppercase" }}>
            {dismissalType}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
