/**
 * AI Chat Screen - Dedicated CrickAI Assistant Route
 */
import { View, TouchableOpacity, Text } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AIChatbot } from "@/components/ai-chatbot";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export default function AIChatScreen() {
  const router = useRouter();

  return (
    <ScreenContainer gradient>
      {/* Top Header Navigation */}
      <View className="flex-row items-center justify-between p-4 border-b border-white/10 bg-[#070A10]">
        <TouchableOpacity
          onPress={async () => {
            if (process.env.EXPO_OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="flex-row items-center gap-1 active:opacity-75"
        >
          <Text className="text-emerald-400 text-lg font-black">←</Text>
          <Text className="text-white text-sm font-extrabold">Back</Text>
        </TouchableOpacity>
        <Text className="text-base font-black text-white">🤖 CrickAI Coach</Text>
        <View className="w-12" />
      </View>

      <AIChatbot />
    </ScreenContainer>
  );
}
