/**
 * WebSafeAnimated — Drop-in replacement for Reanimated Animated.View on Web.
 *
 * On Web: renders a plain <View> with explicit opacity: 1 — prevents Reanimated
 * shared animation values from leaving components stuck at opacity: 0.
 *
 * On Native: passes through to the real Animated.View from react-native-reanimated.
 *
 * Usage: replace `<Animated.View>` with `<WebSafeAnimated.View>` wherever
 * the component is used in app content (not in the preloader overlay).
 */
import { Platform, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";

type SafeViewProps = ViewProps & {
  style?: any;
  children?: React.ReactNode;
};

function SafeView({ style, children, ...props }: SafeViewProps) {
  if (Platform.OS === "web") {
    // On web: strip animated style values, apply opacity: 1 to guarantee visibility
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...(style.filter(Boolean) as object[]))
      : style ?? {};

    const safeStyle = {
      ...flatStyle,
      opacity: 1,
      // Keep transform only if it doesn't contain Reanimated worklet values
      transform: undefined,
    };

    return (
      <View style={safeStyle} {...props}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={style} {...props}>
      {children}
    </Animated.View>
  );
}

const WebSafeAnimated = { View: SafeView };
export default WebSafeAnimated;
