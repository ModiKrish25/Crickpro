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

export interface WicketAnimationProps {
  playerName: string;
  dismissalType: string;
  onAnimationComplete?: () => void;
}

/**
 * Wicket Animation Component
 * Shows dramatic animation when a wicket falls
 */
export function WicketAnimation({
  playerName,
  dismissalType,
  onAnimationComplete,
}: WicketAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotateZ.value}deg` },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    // Dramatic entrance
    scale.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(1.3, {
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

    // Rotation effect
    rotateZ.value = withSequence(
      withTiming(-15, {
        duration: 200,
        easing: Easing.inOut(Easing.cubic),
      }),
      withTiming(15, {
        duration: 200,
        easing: Easing.inOut(Easing.cubic),
      }),
      withTiming(0, {
        duration: 200,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    // Slide effect
    translateX.value = withSequence(
      withTiming(-30, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      })
    );

    // Call completion callback after animation
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: -100,
          marginTop: -50,
          width: 200,
          height: 100,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: "#EF4444",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
          borderWidth: 2,
          borderColor: "#DC2626",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
          }}
        >
          ⚠️ WICKET! ⚠️
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#fff",
            marginTop: 6,
            textAlign: "center",
          }}
        >
          {playerName}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "#fff",
            opacity: 0.9,
            marginTop: 2,
          }}
        >
          {dismissalType}
        </Text>
      </View>
    </Animated.View>
  );
}
