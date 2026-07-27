import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, View, Text } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";
import { useResponsive } from "@/hooks/use-responsive";
import {
  getBottomPadding,
  getTabBarBottom,
  TAB_BAR_CONFIG,
  type TabDeviceType,
} from "@/lib/const";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const { isPhone, isTablet, isDesktop } = useResponsive();

  const devType: TabDeviceType = isPhone ? "phone" : isTablet ? "tablet" : "desktop";
  const cfg = TAB_BAR_CONFIG[devType];
  const bottomPadding = getBottomPadding(insets.bottom);
  const tabBarHeight = cfg.height + bottomPadding + 6;

  const showInlineLabel = devType === "desktop";

  const webTabBarStyle = Platform.OS === "web" ? {
    position: "fixed" as const,
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    width: isDesktop ? "auto" : `calc(100% - ${isPhone ? 20 : isTablet ? 40 : 64}px)`,
    maxWidth: isDesktop ? 640 : 500,
    zIndex: 9999,
  } : {};

  const tabBarStyle = {
    display: "flex" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-around" as const,
    ...(Platform.OS !== "web" ? {
      position: "absolute" as const,
      bottom: getTabBarBottom(insets.bottom),
      left: isPhone ? 12 : isTablet ? 24 : 32,
      right: isPhone ? 12 : isTablet ? 24 : 32,
    } : {}),
    height: tabBarHeight,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: cfg.horizontalPadding,
    borderRadius: 32,
    // Dark Emerald Frosted Glass background
    backgroundColor: isDark
      ? "rgba(15, 28, 22, 0.90)"
      : "rgba(255, 255, 255, 0.90)",
    borderWidth: 1,
    borderColor: isDark
      ? "rgba(16, 185, 129, 0.25)"
      : "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.45 : 0.15,
    shadowRadius: 28,
    elevation: 16,
    ...(Platform.OS === "web" ? {
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      ...webTabBarStyle,
    } : {}),
  };

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: isDark ? "rgba(156, 163, 175, 0.7)" : "rgba(107, 114, 128, 0.7)",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: tabBarStyle as any,
        tabBarItemStyle: {
          paddingVertical: showInlineLabel ? 4 : 6,
          height: tabBarHeight - bottomPadding,
          flexDirection: showInlineLabel ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: showInlineLabel ? 4 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: -0.2,
          marginTop: 2,
        },
        ...(Platform.OS === "web" ? {
          animation: "none" as const,
          lazy: false,
        } : {}),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "scale-105" : "opacity-75"}`}>
              <IconSymbol size={22} name="house.fill" color={focused ? "#10B981" : color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="leagues"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "scale-105" : "opacity-75"}`}>
              <IconSymbol size={22} name="trophy.fill" color={focused ? "#10B981" : color} />
            </View>
          ),
        }}
      />

      {/* Visually Prominent Center + Score Action */}
      <Tabs.Screen
        name="scorecard"
        options={{
          title: "+ Score",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center -mt-5">
              <View className="w-12 h-12 rounded-full bg-[#10B981] items-center justify-center shadow-lg shadow-[#10B981]/40 border-2 border-[#08120E] active:scale-95 transition-transform">
                <Text className="text-white text-xl font-extrabold" style={{ lineHeight: 22 }}>+</Text>
              </View>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "800",
            color: "#10B981",
            marginTop: 4,
          },
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "scale-105" : "opacity-75"}`}>
              <IconSymbol size={22} name="chart.bar.fill" color={focused ? "#10B981" : color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "scale-105" : "opacity-75"}`}>
              <IconSymbol size={22} name="person.fill" color={focused ? "#10B981" : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
