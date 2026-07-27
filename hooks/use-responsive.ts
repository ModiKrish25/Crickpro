/**
 * useResponsive - Responsive design hook for React Native / Web
 * 
 * Provides breakpoint-aware utilities for building responsive UIs
 * across phone, tablet, and desktop screen sizes.
 * 
 * Breakpoints:
 * - Phone: < 768px
 * - Tablet: 768px - 1024px  
 * - Desktop: > 1024px
 * 
 * Returns responsive values and grid layout helpers.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Dimensions, Platform, ScaledSize } from "react-native";

// ─── Breakpoints ───

export const BREAKPOINTS = {
  PHONE: 0,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1440,
} as const;

export type DeviceType = "phone" | "tablet" | "desktop" | "wide";
export type Orientation = "portrait" | "landscape";

export interface ResponsiveInfo {
  /** Current device type based on width */
  deviceType: DeviceType;
  /** Whether the current device is a phone */
  isPhone: boolean;
  /** Whether the current device is a tablet */
  isTablet: boolean;
  /** Whether the current device is a desktop */
  isDesktop: boolean;
  /** Whether the current device is wide (1440px+) */
  isWide: boolean;
  /** Current screen width in pixels */
  width: number;
  /** Current screen height in pixels */
  height: number;
  /** Current orientation */
  orientation: Orientation;
  /** Whether running on web platform */
  isWeb: boolean;
  /** Whether running on native (iOS/Android) */
  isNative: boolean;
  /** Number of columns for a grid layout (2 phone, 3 tablet, 4 desktop) */
  gridColumns: number;
  /** Content max-width for centering (full on phone, 720 on tablet, 1024 on desktop) */
  contentMaxWidth: number;
  /** Horizontal padding (16 phone, 24 tablet, 32 desktop) */
  horizontalPadding: number;
  /** Whether the sidebar nav should be shown instead of bottom tabs */
  showSidebar: boolean;
  /** Font size scale factor */
  fontScale: number;
  /** Spacing scale factor */
  spacingScale: number;
}

function getDeviceType(width: number): DeviceType {
  if (width >= BREAKPOINTS.WIDE) return "wide";
  if (width >= BREAKPOINTS.DESKTOP) return "desktop";
  if (width >= BREAKPOINTS.TABLET) return "tablet";
  return "phone";
}

function getOrientation(width: number, height: number): Orientation {
  return width >= height ? "landscape" : "portrait";
}

function getGridColumns(deviceType: DeviceType): number {
  switch (deviceType) {
    case "wide": return 4;
    case "desktop": return 3;
    case "tablet": return 2;
    default: return 1;
  }
}

function getContentMaxWidth(deviceType: DeviceType): number {
  switch (deviceType) {
    case "wide": return 1280;
    case "desktop": return 1024;
    case "tablet": return 720;
    default: return 0; // 0 = full width
  }
}

function getHorizontalPadding(deviceType: DeviceType): number {
  switch (deviceType) {
    case "wide": return 48;
    case "desktop": return 32;
    case "tablet": return 24;
    default: return 16;
  }
}

function getFontScale(width: number): number {
  if (width >= 1440) return 1.15;
  if (width >= 1024) return 1.1;
  if (width >= 768) return 1.05;
  return 1;
}

function getSpacingScale(width: number): number {
  if (width >= 1440) return 1.25;
  if (width >= 1024) return 1.15;
  if (width >= 768) return 1.08;
  return 1;
}

/**
 * React hook that returns responsive layout information
 * that updates when the window dimensions change.
 */
export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };
    const subscription = Dimensions.addEventListener("change", handleChange);
    return () => subscription?.remove();
  }, []);

  return useMemo(() => {
    const { width, height } = dimensions;
    const deviceType = getDeviceType(width);

    return {
      deviceType,
      isPhone: deviceType === "phone",
      isTablet: deviceType === "tablet",
      isDesktop: deviceType === "desktop" || deviceType === "wide",
      isWide: deviceType === "wide",
      width,
      height,
      orientation: getOrientation(width, height),
      isWeb: Platform.OS === "web",
      isNative: Platform.OS !== "web",
      gridColumns: getGridColumns(deviceType),
      contentMaxWidth: getContentMaxWidth(deviceType),
      horizontalPadding: getHorizontalPadding(deviceType),
      showSidebar: deviceType === "desktop" || deviceType === "wide",
      fontScale: getFontScale(width),
      spacingScale: getSpacingScale(width),
    };
  }, [dimensions]);
}

/**
 * Returns responsive Tailwind class names based on device type.
 * 
 * Examples:
 * - responsiveClass("flex-col", "flex-row") // phone: column, tablet+: row
 * - responsiveClass("gap-3", "gap-4", "gap-6") // phone/tablet/desktop
 */
export function responsiveClass(
  phone: string,
  tablet?: string,
  desktop?: string,
  wide?: string,
): (deviceType: DeviceType) => string {
  return (deviceType: DeviceType) => {
    if (deviceType === "wide" && wide) return wide;
    if (deviceType === "desktop" && desktop) return desktop;
    if (deviceType === "tablet" && tablet) return tablet;
    return phone;
  };
}

/**
 * Hook that returns a weight class based on responsive fontScale.
 */
export function useResponsiveFontSize(baseSize: number): number {
  const { fontScale } = useResponsive();
  return Math.round(baseSize * fontScale);
}

/**
 * Hook that returns a responsive spacing value based on responsive spacingScale.
 */
export function useResponsiveSpacing(baseSpacing: number): number {
  const { spacingScale } = useResponsive();
  return Math.round(baseSpacing * spacingScale);
}
