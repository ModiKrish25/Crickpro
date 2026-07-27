/**
 * Shared constants and utilities for tab bar configuration.
 * 
 * These are extracted from app/(tabs)/_layout.tsx so other screens
 * can compute responsive scroll padding without duplication.
 *
 * All functions accept an optional `platform` parameter for testability.
 * When omitted, the real `Platform.OS` from react-native is used.
 */

import { Platform } from "react-native";

/** Tab bar config per device type */
export const TAB_BAR_CONFIG = {
  phone: {
    height: 56,
    bottomOffset: 0,
    horizontalPadding: 8,
    labelSize: 9,
    iconBottomMargin: -2,
  },
  tablet: {
    height: 60,
    bottomOffset: 4,
    horizontalPadding: 12,
    labelSize: 10,
    iconBottomMargin: -2,
  },
  desktop: {
    height: 52,
    bottomOffset: 0,
    horizontalPadding: 6,
    labelSize: 10,
    iconBottomMargin: -2,
  },
} as const;

export type TabDeviceType = keyof typeof TAB_BAR_CONFIG;

/**
 * Resolve the current platform, defaulting to the real `Platform.OS`
 * when the optional override is not provided (e.g. from tests).
 */
function resolvePlatform(platform?: string): string {
  return platform ?? Platform.OS;
}

/**
 * Platform-aware bottom safe area padding.
 *
 * | Scenario                    | insets.bottom | Result |
 * |-----------------------------|---------------|--------|
 * | Android gesture nav         | 0             | 14     |
 * | Android 3-button nav        | 48            | 48     |
 * | Android 3-button (unusual)  | 36            | 36     |
 * | iOS home indicator          | 34            | 34     |
 * | iOS SE / iPad (no notch)    | 0             | 8      |
 * | Web                         | —             | 12     |
 *
 * @param insetsBottom - The safe area bottom inset from useSafeAreaInsets().
 * @param platform - Optional platform override for testing. Defaults to Platform.OS.
 */
export function getBottomPadding(insetsBottom: number, platform?: string): number {
  const os = resolvePlatform(platform);
  if (os === "android") {
    // Android gesture nav has insets.bottom = 0 → need min 14px for a gap
    // Android 3-button nav has insets.bottom ≈ 48px → cap at 48 to avoid excess
    return Math.min(Math.max(insetsBottom, 14), 48);
  }
  if (os === "web") return 12;
  // iOS: home indicator is ~34px, or 0 on SE/iPad
  return Math.max(insetsBottom, 8);
}

/**
 * Platform-aware tab bar bottom position (absolute).
 * Controls how far the floating glass tab bar sits from the screen bottom edge.
 *
 * @param insetsBottom - The safe area bottom inset.
 * @param platform - Optional platform override for testing.
 */
export function getTabBarBottom(insetsBottom: number, platform?: string): number {
  const os = resolvePlatform(platform);
  if (os === "android") {
    // Android gesture: 8px gap from screen bottom
    // Android 3-button: just above the nav bar (insets.bottom - 2 with 6px floor)
    return Math.max(insetsBottom - 2, 8);
  }
  if (os === "web") return 16;
  // iOS: above the home indicator with a small inset
  return Math.max(insetsBottom - 4, 8);
}

/**
 * Get the total tab bar height for a given device type and bottom inset.
 * This is the full height of the floating tab bar including safe-area padding.
 *
 * @param devType - Device type (phone / tablet / desktop).
 * @param insetsBottom - Safe area bottom inset.
 * @param platform - Optional platform override for testing.
 */
export function getTabBarHeight(
  devType: TabDeviceType,
  insetsBottom: number,
  platform?: string,
): number {
  const cfg = TAB_BAR_CONFIG[devType];
  return cfg.height + getBottomPadding(insetsBottom, platform);
}

/**
 * Compute the scroll bottom padding that prevents content
 * from being hidden behind the floating tab bar.
 *
 * The padding accounts for:
 * - The tab bar height (varies by device type)
 * - The safe area bottom inset
 * - A comfortable 12px gap so content doesn't sit flush against the tab bar
 *
 * | Device | insets.bottom | platform | extraGap | Result |
 * |--------|--------------|----------|----------|--------|
 * | Phone gesture nav | 0    | android  | 12       | 82     |
 * | Phone 3-button    | 48   | android  | 12       | 116    |
 * | iOS home indicator| 34   | ios      | 12       | 102    |
 * | Desktop web       | 0    | web      | 12       | 76     |
 *
 * @param devType - Device type (phone / tablet / desktop).
 * @param insetsBottom - Safe area bottom inset.
 * @param extraGap - Extra gap above the tab bar (default 12).
 * @param platform - Optional platform override for testing.
 */
export function getScrollBottomPadding(
  devType: TabDeviceType,
  insetsBottom: number,
  extraGap: number = 12,
  platform?: string,
): number {
  const cfg = TAB_BAR_CONFIG[devType];
  const bottomPadding = getBottomPadding(insetsBottom, platform);
  return cfg.height + bottomPadding + extraGap;
}
