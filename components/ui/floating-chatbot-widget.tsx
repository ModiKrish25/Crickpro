/**
 * FloatingChatbotWidget — Floating AI Chatbot Action Button
 * 
 * Features:
 * - Floating action widget in bottom-right (inspired by Image 1 & Image 2)
 * - Robot headset avatar styling (Image 2)
 * - Glowing pulse aura with unread notification badge
 * - One-tap trigger to open CrickAI Assistant (/ai-chat)
 */
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export function FloatingChatbotWidget() {
  const router = useRouter();

  const handlePress = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/ai-chat" as any);
  };

  return (
    <View
      style={{
        position: "fixed" as any,
        right: 20,
        bottom: 92,
        zIndex: 99999,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="relative group flex-row items-center gap-2"
      >
        {/* Subtle Tooltip Label on Hover/Focus */}
        <View className="hidden md:flex bg-[#1C1C1E] border border-white/20 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
          <Text className="text-xs font-black text-white">Ask CrickAI 🤖</Text>
        </View>

        {/* Outer Glow Ring */}
        <View className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-75 blur-md group-hover:opacity-100 transition-all animate-pulse" />

        {/* Circular Action Button */}
        <View className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#3B82F6] border-2 border-cyan-400/50 items-center justify-center shadow-2xl shadow-cyan-500/50 active:scale-95 transition-transform">
          {/* Headset Robot Icon Avatar (Image 2 style) */}
          <Text className="text-2xl" style={{ textShadowColor: "rgba(56, 189, 248, 0.8)", textShadowRadius: 10 }}>
            🤖
          </Text>

          {/* Green Online Dot Badge */}
          <View className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#0B0E17] flex-row items-center justify-center">
            <View className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
