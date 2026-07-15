/**
 * Sign In Screen - Beautiful onboarding & authentication screen
 * Shown when a user is not authenticated. Provides a clean entry point
 * with OAuth login options and app branding.
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/lib/auth-context";
import Svg, { Rect, Circle, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function CricketIllustration() {
  return (
    <View className="items-center mb-6">
      <Svg width={200} height={160} viewBox="0 0 200 160">
        {/* Cricket bat */}
        <Path
          d="M100 30 L100 150 Q95 155 88 150 L85 145 Q82 140 85 35 Z"
          fill="#D4A853"
          stroke="#8B6914"
          strokeWidth={1.5}
        />
        {/* Bat handle */}
        <Path d="M85 35 L88 20 Q90 15 95 18 L97 22 Z" fill="#5C4033" />
        <Path d="M85 40 L100 40" stroke="#8B6914" strokeWidth={0.5} />
        <Path d="M85 45 L100 45" stroke="#8B6914" strokeWidth={0.5} />
        <Path d="M85 50 L100 50" stroke="#8B6914" strokeWidth={0.5} />
        {/* Cricket ball */}
        <Circle cx={145} cy={55} r={14} fill="#CC0000" />
        <Path d="M140 48 Q145 52 140 58" stroke="#fff" strokeWidth={1} fill="none" opacity={0.6} />
        <Path d="M150 48 Q145 52 150 58" stroke="#fff" strokeWidth={1} fill="none" opacity={0.6} />
        {/* Stumps */}
        <Path d="M55 60 L55 140" stroke="#8B6914" strokeWidth={2.5} />
        <Path d="M65 58 L65 140" stroke="#8B6914" strokeWidth={2.5} />
        <Path d="M75 60 L75 140" stroke="#8B6914" strokeWidth={2.5} />
        {/* Bails */}
        <Path d="M52 58 L78 58" stroke="#8B6914" strokeWidth={2} />
        <Line x1={52} y1={62} x2={78} y2={62} stroke="#8B6914" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

function Line({ x1, y1, x2, y2, ...props }: any) {
  return <Path d={`M${x1} ${y1} L${x2} ${y2}`} {...props} />;
}

const BENEFITS = [
  { icon: "🎯", title: "Ball-by-Ball Scoring", desc: "Professional-grade live scoring with full cricket rules" },
  { icon: "📊", title: "Detailed Statistics", desc: "Track your career stats, averages, and performances" },
  { icon: "🏆", title: "Leagues & Tournaments", desc: "Organize and participate in cricket tournaments" },
  { icon: "🤝", title: "Team Management", desc: "Build your team, manage lineups, assign roles" },
  { icon: "📤", title: "Share Scorecards", desc: "Share match results as beautiful images" },
  { icon: "🎮", title: "All Formats", desc: "T20, ODI, T10, The Hundred & Custom formats" },
];

export default function SignInScreen() {
  const colors = useColors();
  const { login, loading } = useAuthContext();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err) {
      console.error("[SignIn] Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View className="pt-12 pb-8 px-6 items-center gap-4">
          {/* Logo / Icon */}
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-4xl">🏏</Text>
          </View>

          <Text className="text-4xl font-bold text-foreground text-center">
            CrickPro
          </Text>
          <Text className="text-base text-muted text-center max-w-sm leading-6">
            The ultimate cricket scoring & tournament management platform for grassroots and amateur cricket
          </Text>
        </View>

        {/* Cricket Illustration */}
        <View className="items-center mb-6">
          <CricketIllustration />
        </View>

        {/* Benefits Grid */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-foreground mb-4 text-center">
            Everything you need
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {BENEFITS.map((benefit, idx) => (
              <View
                key={idx}
                className="bg-surface rounded-xl p-3.5 border border-border/50"
                style={{ width: (SCREEN_WIDTH - 60 - 12) / 2 }}
              >
                <Text className="text-xl mb-1">{benefit.icon}</Text>
                <Text className="text-xs font-bold text-foreground mb-0.5">
                  {benefit.title}
                </Text>
                <Text className="text-[10px] text-muted leading-4">
                  {benefit.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign In Button */}
        <View className="px-6 pb-8 gap-4">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-5 items-center active:opacity-80 flex-row justify-center gap-3"
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={handleSignIn}
            disabled={isLoggingIn || loading}
          >
            {isLoggingIn || loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text className="text-2xl">🔐</Text>
                <Text className="text-background font-bold text-lg">
                  Continue with OAuth
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Guest mode hint */}
          <View className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <Text className="text-xs text-muted text-center leading-5">
              Sign in to save your matches, track career stats, and manage teams. 
              Your data syncs across all your devices.
            </Text>
          </View>

          {/* Footer */}
          <Text className="text-xs text-muted text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
