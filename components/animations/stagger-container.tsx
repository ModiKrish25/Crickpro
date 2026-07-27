/**
 * StaggerContainer — Orchestrates staggered entrance animations for glass cards
 * 
 * Wraps a list of items and animates them in with a cascading reveal effect.
 * Each child is wrapped in Animated.View with spring-based opacity + translateY + scale.
 * 
 * Usage:
 * <StaggerContainer>
 *   <GlassCard staggerIndex={0}>...</GlassCard>
 *   <GlassCard staggerIndex={1}>...</GlassCard>
 *   <GlassCard staggerIndex={2}>...</GlassCard>
 * </StaggerContainer>
 * 
 * Or auto-index children:
 * <StaggerContainer>
 *   <View>...</View>  // auto-indexed as 0
 *   <View>...</View>  // auto-indexed as 1
 * </StaggerContainer>
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";
import { useEffect, useMemo, useRef } from "react";

interface StaggerContainerProps extends ViewProps {
  /** Children to stagger-animate */
  children: ReactNode;
  /** Delay between each item in ms */
  staggerInterval?: number;
  /** Whether animations should play */
  animate?: boolean;
  /** Spring config for entrance */
  springConfig?: WithSpringConfig;
  /** Initial translateY offset */
  translateY?: number;
}

interface StaggerItemProps extends ViewProps {
  /** Index in stagger sequence */
  staggerIndex: number;
  /** Delay between items */
  staggerInterval?: number;
  /** Whether animation is enabled */
  animate?: boolean;
  /** TranslateY offset */
  translateY?: number;
  /** Spring config */
  springConfig?: WithSpringConfig;
}

/**
 * Individual stagger-animated wrapper.
 * Use directly when you need more control over the stagger index.
 */
export function StaggerItem({
  children,
  staggerIndex,
  staggerInterval = 80,
  animate = true,
  translateY = 24,
  springConfig,
  className,
  style,
  ...props
}: StaggerItemProps) {
  const isWeb = Platform.OS === "web";

  // On Web: start at final values immediately — Reanimated springs are unreliable
  const opacityVal = useSharedValue(isWeb ? 1 : 0);
  const offsetYVal = useSharedValue(isWeb ? 0 : translateY);

  const spring = springConfig || { damping: 20, stiffness: 200, mass: 0.8 };

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Web or disabled: already at final values
    if (isWeb || !animate) {
      opacityVal.value = 1;
      offsetYVal.value = 0;
      return;
    }

    const delay = staggerIndex * staggerInterval;

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      (opacityVal as any).value = withSpring(1 as any, { damping: 18, stiffness: 200, mass: 0.8 } as any);
      (offsetYVal as any).value = withSpring(0 as any, { damping: 20, stiffness: 180, mass: 0.8 } as any);
    }, delay);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [staggerIndex, staggerInterval, animate, isWeb]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
    transform: [
      { translateY: offsetYVal.value },
    ],
  }));

  if (isWeb) {
    return (
      <View className={cn(className)} style={[{ opacity: 1 }, style]} {...props}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      className={cn(className)}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}


/**
 * StaggerContainer — Wraps children and staggers their entrance.
 * Auto-assigns indices to direct children.
 */
export function StaggerContainer({
  children,
  staggerInterval = 80,
  animate = true,
  springConfig,
  translateY = 24,
  className,
  style,
  ...props
}: StaggerContainerProps) {
  const childrenArray = useMemo(
    () => Children.toArray(children).filter(isValidElement) as ReactElement[],
    [children],
  );

  const staggeredChildren = useMemo(() => {
    return childrenArray.map((child, index) => {
      // If child already has a staggerIndex prop (e.g., GlassCard), let it manage itself
      const props = child.props as Record<string, unknown>;
      if (props.staggerIndex !== undefined) {
        return child;
      }
      return (
        <StaggerItem
          key={child.key || `stagger-${index}`}
          staggerIndex={index}
          staggerInterval={staggerInterval}
          animate={animate}
          translateY={translateY}
          springConfig={springConfig}
        >
          {child}
        </StaggerItem>
      );
    });
  }, [childrenArray, staggerInterval, animate, translateY, springConfig]);

  return (
    <View className={cn(className)} style={style} {...props}>
      {staggeredChildren}
    </View>
  );
}
