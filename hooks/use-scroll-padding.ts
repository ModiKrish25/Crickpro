/**
 * useScrollPadding — React hook that returns the responsive
 * bottom padding for ScrollViews, accounting for the floating
 * tab bar height and safe area insets.
 * 
 * Use this instead of hardcoded `paddingBottom: 100 / 120` values.
 * The padding adjusts automatically for:
 * - Phone / tablet / desktop device types
 * - iOS home indicator / Android gesture nav / Android 3-button nav
 * - Landscape vs portrait orientation
 */
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "@/hooks/use-responsive";
import { useMemo } from "react";
import {
  getScrollBottomPadding,
  getTabBarHeight,
  type TabDeviceType,
  TAB_BAR_CONFIG,
} from "@/lib/const";

export interface ScrollPaddingInfo {
  /** The computed bottom padding for ScrollViews */
  paddingBottom: number;
  /** The total tab bar height (used for tab bar calculations) */
  tabBarHeight: number;
  /** The device type responsible for sizing */
  devType: TabDeviceType;
}

/**
 * Returns the scroll bottom padding for screens within the tab layout.
 * The padding ensures content scrolls above the floating glass tab bar.
 * 
 * @param extraGap - Extra gap above the tab bar (default 12px).
 *                    Increase to 16-20px if you want more breathing room.
 */
export function useScrollPadding(extraGap: number = 12): ScrollPaddingInfo {
  const insets = useSafeAreaInsets();
  const { isPhone, isTablet } = useResponsive();

  return useMemo(() => {
    const devType: TabDeviceType = isPhone ? "phone" : isTablet ? "tablet" : "desktop";
    const tabBarHeight = getTabBarHeight(devType, insets.bottom);
    const paddingBottom = getScrollBottomPadding(devType, insets.bottom, extraGap);
    return { paddingBottom, tabBarHeight, devType };
  }, [insets.bottom, isPhone, isTablet, extraGap]);
}

/**
 * A simpler variant for screens that are NOT inside the tab layout
 * (e.g. modals, standalone screens). Returns just a safe bottom
 * padding without the tab bar height.
 * 
 * @param minimumGap - Minimum gap from bottom edge (default 16px on web, 24px on native)
 */
export function useSafeBottomPadding(minimumGap?: number): number {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const gap = minimumGap ?? (insets.bottom > 0 ? insets.bottom + 8 : 24);
    return Math.max(insets.bottom + 8, gap);
  }, [insets.bottom, minimumGap]);
}
