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

import { FloatingChatbotWidget } from "@/components/ui/floating-chatbot-widget";

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
    // Dark Charcoal Frosted Glass background matching iOS 18
    backgroundColor: isDark
      ? "rgba(28, 28, 30, 0.88)"
      : "rgba(255, 255, 255, 0.90)",
    borderWidth: 1,
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.55 : 0.15,
    shadowRadius: 32,
    elevation: 20,
    ...(Platform.OS === "web" ? {
      backdropFilter: "blur(28px) saturate(190%)",
      WebkitBackdropFilter: "blur(28px) saturate(190%)",
      ...webTabBarStyle,
    } : {}),
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        tabBarActiveTintColor: "#FF9F0A",
        tabBarInactiveTintColor: isDark ? "rgba(235, 235, 245, 0.6)" : "rgba(60, 60, 67, 0.6)",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: tabBarStyle as any,
        tabBarItemStyle: {
          paddingVertical: showInlineLabel ? 4 : 4,
          height: tabBarHeight - bottomPadding,
          flexDirection: showInlineLabel ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: showInlineLabel ? 4 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
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
            <View className={`items-center justify-center ${focused ? "w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/50" : "px-2 py-0.5"}`}>
              <IconSymbol size={focused ? 20 : 22} name="house.fill" color={focused ? "#FFFFFF" : color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="leagues"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/50" : "px-2 py-0.5"}`}>
              <IconSymbol size={focused ? 20 : 22} name="trophy.fill" color={focused ? "#FFFFFF" : color} />
            </View>
          ),
        }}
      />

      {/* Center Score Button Action */}
      <Tabs.Screen
        name="scorecard"
        options={{
          title: "+ Score",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center -mt-5">
              <View className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/60 border-2 border-[#0B0E17] active:scale-95 transition-transform">
                <Text className="text-white text-xl font-black" style={{ lineHeight: 22 }}>+</Text>
              </View>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "900",
            color: "#6366F1",
            marginTop: 4,
          },
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/50" : "px-2 py-0.5"}`}>
              <IconSymbol size={focused ? 20 : 22} name="people.fill" color={focused ? "#FFFFFF" : color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/50" : "px-2 py-0.5"}`}>
              <IconSymbol size={focused ? 20 : 22} name="chart.bar.fill" color={focused ? "#FFFFFF" : color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? "w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/50" : "px-2 py-0.5"}`}>
              <IconSymbol size={focused ? 20 : 22} name="person.fill" color={focused ? "#FFFFFF" : color} />
            </View>
          ),
        }}
      />
    </Tabs>

    <FloatingChatbotWidget />
    </View>
  );
}
