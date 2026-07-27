import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export function HapticTab(props: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <PlatformPressable
        {...props}
        onPressIn={(ev) => {
          scale.value = withSpring(0.92, { damping: 15, stiffness: 300, mass: 0.5 });
          if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          props.onPressIn?.(ev);
        }}
        onPressOut={(ev) => {
          scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
          props.onPressOut?.(ev);
        }}
      />
    </Animated.View>
  );
}
