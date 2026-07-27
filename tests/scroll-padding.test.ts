/**
 * Unit tests for shared scroll-padding utilities.
 *
 * These tests verify the platform-aware bottom padding logic
 * that prevents ScrollView content from being hidden behind
 * the floating glass tab bar.
 *
 * All four exported functions accept an optional `platform`
 * parameter so they can be tested without mocking `Platform.OS`.
 */
import { describe, it, expect, vi } from "vitest";

// Mock react-native so vitest can parse the module
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

import {
  getBottomPadding,
  getTabBarBottom,
  getTabBarHeight,
  getScrollBottomPadding,
  TAB_BAR_CONFIG,
} from "../lib/const";

// ─── getBottomPadding ────────────────────────────────────────────────────────

describe("getBottomPadding", () => {
  // ── Android ──
  describe("on Android", () => {
    it("returns 14 for gesture nav (insets.bottom = 0)", () => {
      expect(getBottomPadding(0, "android")).toBe(14);
    });

    it("returns 48 for 3-button nav (insets.bottom = 48)", () => {
      expect(getBottomPadding(48, "android")).toBe(48);
    });

    it("caps at 48 for unusually large insets (e.g. 60)", () => {
      expect(getBottomPadding(60, "android")).toBe(48);
    });

    it("returns the input value for non-zero below cap (e.g. 36)", () => {
      expect(getBottomPadding(36, "android")).toBe(36);
    });

    it("floors at 14 for small insets (e.g. 4 → 14)", () => {
      expect(getBottomPadding(4, "android")).toBe(14);
    });
  });

  // ── Web ──
  describe("on Web", () => {
    it("always returns 12 regardless of insets", () => {
      expect(getBottomPadding(0, "web")).toBe(12);
      expect(getBottomPadding(34, "web")).toBe(12);
      expect(getBottomPadding(100, "web")).toBe(12);
    });
  });

  // ── iOS ──
  describe("on iOS", () => {
    it("returns 34 for home indicator (insets.bottom = 34)", () => {
      expect(getBottomPadding(34, "ios")).toBe(34);
    });

    it("returns 8 when insets.bottom is 0 (SE / iPad no notch)", () => {
      expect(getBottomPadding(0, "ios")).toBe(8);
    });

    it("returns the inset value when it is > 8", () => {
      expect(getBottomPadding(20, "ios")).toBe(20);
    });

    it("floors at 8 for very small insets (e.g. 0 → 8)", () => {
      expect(getBottomPadding(2, "ios")).toBe(8);
    });
  });
});

// ─── getTabBarBottom ─────────────────────────────────────────────────────────

describe("getTabBarBottom", () => {
  // ── Android ──
  describe("on Android", () => {
    it("returns 8 for gesture nav (insets.bottom = 0)", () => {
      expect(getTabBarBottom(0, "android")).toBe(8);
    });

    it("returns 46 for 3-button nav (insets.bottom = 48)", () => {
      expect(getTabBarBottom(48, "android")).toBe(46);
    });

    it("floors at 8 for small insets", () => {
      expect(getTabBarBottom(5, "android")).toBe(8);
    });
  });

  // ── Web ──
  describe("on Web", () => {
    it("always returns 16 regardless of insets", () => {
      expect(getTabBarBottom(0, "web")).toBe(16);
      expect(getTabBarBottom(50, "web")).toBe(16);
    });
  });

  // ── iOS ──
  describe("on iOS", () => {
    it("returns 30 for home indicator (insets.bottom = 34)", () => {
      expect(getTabBarBottom(34, "ios")).toBe(30);
    });

    it("returns 8 when insets.bottom is 0", () => {
      expect(getTabBarBottom(0, "ios")).toBe(8);
    });

    it("floors at 8 for small insets", () => {
      expect(getTabBarBottom(5, "ios")).toBe(8);
    });
  });
});

// ─── getTabBarHeight ─────────────────────────────────────────────────────────

describe("getTabBarHeight", () => {
  it("returns phone height (56) + bottom padding for Android gesture nav", () => {
    const height = getTabBarHeight("phone", 0, "android");
    // 56 (phone base) + 14 (Android gesture padding) = 70
    expect(height).toBe(70);
  });

  it("returns phone height + bottom padding for Android 3-button nav", () => {
    const height = getTabBarHeight("phone", 48, "android");
    // 56 + 48 = 104
    expect(height).toBe(104);
  });

  it("returns phone height + bottom padding for iOS home indicator", () => {
    const height = getTabBarHeight("phone", 34, "ios");
    // 56 + 34 = 90
    expect(height).toBe(90);
  });

  it("returns tablet height + bottom padding for iOS no notch", () => {
    const height = getTabBarHeight("tablet", 0, "ios");
    // 60 + 8 = 68
    expect(height).toBe(68);
  });

  it("returns desktop height + web padding", () => {
    const height = getTabBarHeight("desktop", 0, "web");
    // 52 + 12 = 64
    expect(height).toBe(64);
  });

  it("desktop height is unaffected by insets on web", () => {
    const height = getTabBarHeight("desktop", 999, "web");
    // 52 + 12 = 64 (web padding is fixed)
    expect(height).toBe(64);
  });
});

// ─── getScrollBottomPadding ──────────────────────────────────────────────────

describe("getScrollBottomPadding", () => {
  // ── Phone ──
  describe("on phone", () => {
    it("returns 82 for Android gesture nav with default extraGap", () => {
      // 56 + 14 + 12 = 82
      expect(getScrollBottomPadding("phone", 0, 12, "android")).toBe(82);
    });

    it("returns 116 for Android 3-button nav with default extraGap", () => {
      // 56 + 48 + 12 = 116
      expect(getScrollBottomPadding("phone", 48, 12, "android")).toBe(116);
    });

    it("returns 102 for iOS home indicator with default extraGap", () => {
      // 56 + 34 + 12 = 102
      expect(getScrollBottomPadding("phone", 34, 12, "ios")).toBe(102);
    });

    it("returns 76 for iOS no-notch with default extraGap", () => {
      // 56 + 8 + 12 = 76
      expect(getScrollBottomPadding("phone", 0, 12, "ios")).toBe(76);
    });

    it("respects a custom extraGap (e.g. 16)", () => {
      // 56 + 14 + 16 = 86
      expect(getScrollBottomPadding("phone", 0, 16, "android")).toBe(86);
    });

    it("with extraGap=0 returns just the tab bar height + bottom padding", () => {
      // 56 + 14 + 0 = 70
      expect(getScrollBottomPadding("phone", 0, 0, "android")).toBe(70);
    });
  });

  // ── Tablet ──
  describe("on tablet", () => {
    it("returns 86 for Android gesture nav with default extraGap", () => {
      // 60 + 14 + 12 = 86
      expect(getScrollBottomPadding("tablet", 0, 12, "android")).toBe(86);
    });

    it("returns 120 for Android 3-button nav with default extraGap", () => {
      // 60 + 48 + 12 = 120
      expect(getScrollBottomPadding("tablet", 48, 12, "android")).toBe(120);
    });

    it("returns 106 for iOS home indicator with default extraGap", () => {
      // 60 + 34 + 12 = 106
      expect(getScrollBottomPadding("tablet", 34, 12, "ios")).toBe(106);
    });
  });

  // ── Desktop ──
  describe("on desktop (web)", () => {
    it("returns 76 for web with default extraGap", () => {
      // 52 + 12 + 12 = 76
      expect(getScrollBottomPadding("desktop", 0, 12, "web")).toBe(76);
    });

    it("web padding is unaffected by insets", () => {
      expect(getScrollBottomPadding("desktop", 999, 12, "web")).toBe(76);
    });
  });
});

// ─── Default platform (no override) ──────────────────────────────────────────
// These tests verify that omitting the platform param uses the real Platform.OS.
// In vitest (Node), Platform.OS is "undefined", so the code will fall through
// to the iOS branch. This documents the existing behaviour.

describe("default platform (no override)", () => {
  // With vi.mock("react-native") above, Platform.OS is set to "ios".
  // So calling functions without a platform arg hits the iOS branch.

  it("getBottomPadding falls back to iOS branch", () => {
    expect(getBottomPadding(0)).toBe(8);  // Math.max(0, 8) = 8
    expect(getBottomPadding(34)).toBe(34); // Math.max(34, 8) = 34
  });

  it("getTabBarBottom falls back to iOS branch", () => {
    expect(getTabBarBottom(0)).toBe(8);   // Math.max(0 - 4, 8) = 8
    expect(getTabBarBottom(34)).toBe(30);  // Math.max(34 - 4, 8) = 30
  });

  it("getTabBarHeight falls back to iOS branch", () => {
    const h = getTabBarHeight("phone", 0);
    // 56 (phone) + 8 (iOS min) = 64
    expect(h).toBe(64);
  });
});

// ─── TAB_BAR_CONFIG structure ────────────────────────────────────────────────

describe("TAB_BAR_CONFIG", () => {
  it("has three device types", () => {
    expect(Object.keys(TAB_BAR_CONFIG)).toEqual(["phone", "tablet", "desktop"]);
  });

  it("phone has height 56", () => {
    expect(TAB_BAR_CONFIG.phone.height).toBe(56);
  });

  it("tablet has height 60", () => {
    expect(TAB_BAR_CONFIG.tablet.height).toBe(60);
  });

  it("desktop has height 52", () => {
    expect(TAB_BAR_CONFIG.desktop.height).toBe(52);
  });

  it("all configs have the required fields", () => {
    for (const key of Object.keys(TAB_BAR_CONFIG) as Array<keyof typeof TAB_BAR_CONFIG>) {
      expect(TAB_BAR_CONFIG[key]).toHaveProperty("height");
      expect(TAB_BAR_CONFIG[key]).toHaveProperty("bottomOffset");
      expect(TAB_BAR_CONFIG[key]).toHaveProperty("horizontalPadding");
      expect(TAB_BAR_CONFIG[key]).toHaveProperty("labelSize");
      expect(TAB_BAR_CONFIG[key]).toHaveProperty("iconBottomMargin");
    }
  });
});
