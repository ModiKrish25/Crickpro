/**
 * useReducedMotion — Detects user preference for reduced motion.
 *
 * Uses AccessibilityInfo API on native platforms and
 * prefers-reduced-motion media query on web.
 */
import { useState, useEffect } from "react";
import { Platform, AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      // Web: use matchMedia for prefers-reduced-motion
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    // Native: use AccessibilityInfo
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}

export default useReducedMotion;
