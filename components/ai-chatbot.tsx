/**
* CrickAI Chatbot Component - Ultra-Premium Cricket AI Assistant
* 
* Features:
* - Intelligent cricket rules, tactical coaching, DLS calculations & app guidance
* - Quick suggestion prompt chips
* - iOS 18 Liquid Glass chat bubbles with typing animations
* - Instant responsive answers with cricket expertise
*/
import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import * as Haptics from "expo-haptics";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "⚡ Explain DLS rain method in T20s",
  "🏏 Best field setting for leg spin",
  "⚾ Explain MCC Law 17.2 consecutive over rule",
  "📊 How do I export match scorecards in CrickPro?",
];

// Knowledgebase response engine for cricket tactics, rules, and app guidance
const AI_RESPONSE_ENGINE: { keywords: string[]; answer: string; followups?: string[] }[] = [
  {
    keywords: ["dls", "duckworth", "rain", "target"],
    answer: "🌧️ **Duckworth-Lewis-Stern (DLS) Method:**\n\nIn rain-interrupted matches, DLS adjusts the target based on relative resources remaining (overs and wickets in hand).\n\n• Each team starts with 100% resources (50 overs & 10 wickets).\n• If overs are lost during 1st innings, 2nd innings target is recalculated using resource percentages.\n• In CrickPro, DLS targets are automatically calculated when match overs are edited in live scoring!",
    followups: ["What is the minimum overs for DLS result?", "How does DLS handle 2nd innings rain interruptions?"],
  },
  {
    keywords: ["law 17.2", "consecutive", "bowler", "restriction", "over"],
    answer: "⚾ **MCC Law 17.2 (Bowler Over Restrictions):**\n\nUnder official cricket laws, no bowler is allowed to bowl two consecutive overs in the same innings!\n\n• After bowling an over, a bowler must rest for at least 1 over from the other end.\n• In CrickPro, our rules engine automatically disables the restricted bowler in the 'Select Next Bowler' popup after every 6 legal balls!",
    followups: ["Can a bowler bowl alternate overs?", "What happens if a bowler gets injured mid-over?"],
  },
  {
    keywords: ["lbw", "drs", "pitching", "impact", "wickets"],
    answer: "🎯 **LBW & DRS Review Breakdown:**\n\nTo confirm a batsman Out LBW, three criteria must be met:\n\n1. **Pitching:** Ball must pitch in-line or outside off (never outside leg).\n2. **Impact:** Ball must strike batter's pad in-line with wickets (unless no shot offered).\n3. **Wickets Hitting:** Ball tracking must show the delivery hitting stumps.\n\n💡 *Remember: If the ball pitches outside leg-stump, it can NEVER be Out LBW!*",
    followups: ["Explain umpire's call in DRS", "How many DRS reviews do teams get in T20?"],
  },
  {
    keywords: ["field", "spin", "leg spin", "tactics", "captain"],
    answer: "🏏 **Tactical Field Setup for Leg Spinners:**\n\nAgainst a right-handed batter:\n\n• **Slip & Leg Slip/Catching Cover:** For top-edge edges and googly turn.\n• **Deep Mid-Wicket & Long-On:** Safeguard against lofted sweep shots.\n• **Deep Cover:** Controls square boundaries.\n\n💡 *Tip: Keep a wide long-off to invite batters to hit against the spin turn!*",
    followups: ["Best field for death overs yorkers", "Powerplay field restrictions in T20"],
  },
  {
    keywords: ["scorecard", "export", "pdf", "share", "crickpro"],
    answer: "📊 **Sharing & Exporting Match Scorecards in CrickPro:**\n\n1. At the end of a match, tap **'Finish Match'** or navigate to **Matches -> Match Details**.\n2. Tap the **'📤 Share Scorecard'** button.\n3. CrickPro generates a high-resolution graphic summary card with team scores, top batter, top bowler, and man-of-the-match awards ready to download or share on WhatsApp & Instagram!",
    followups: ["How to edit player names in live scorecard?", "How to start a tournament in CrickPro?"],
  },
];

export function AIChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      sender: "ai",
      text: "👋 Hi! I'm **CrickAI Assistant**, your personal cricket coach and match rules expert.\n\nAsk me anything about MCC cricket rules, DLS targets, field tactics, or how to use CrickPro!",
      timestamp: "Just now",
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend) return;

    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setIsTyping(true);
    scrollToBottom();

    // Generate AI response
    setTimeout(async () => {
      const lower = textToSend.toLowerCase();
      let matched = AI_RESPONSE_ENGINE.find((item) =>
        item.keywords.some((kw) => lower.includes(kw))
      );

      let replyText = "";
      let followups: string[] | undefined = undefined;

      if (matched) {
        replyText = matched.answer;
        followups = matched.followups;
      } else {
        replyText = `🏏 **CrickAI Analysis for "${textToSend}":**\n\nGreat cricket question! In competitive cricket:\n\n• Ensure team line-ups and toss decisions are confirmed before match start.\n• Track overs, run rates (CRR/RRR), and bowler spell limits in real-time.\n\nFeel free to ask me about DLS rain rules, LBW reviews, field placements, or CrickPro features!`;
        followups = [
          "⚡ Explain DLS rain method in T20s",
          "⚾ Explain MCC Law 17.2 consecutive over rule",
        ];
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: followups,
      };

      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      scrollToBottom();
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="flex-1 bg-[#070A10] p-4 gap-3">

        {/* CHAT HEADER */}
        <View className="flex-row items-center justify-between pb-3 border-b border-white/10">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center shadow-lg shadow-emerald-500/20">
              <Text className="text-xl">🤖</Text>
            </View>
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-lg font-black text-white">CrickAI Assistant</Text>
                <View className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </View>
              <Text className="text-xs font-semibold text-emerald-400">Rules • Tactics • App Coach</Text>
            </View>
          </View>
          <View className="bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <Text className="text-[10px] font-black text-slate-300">ONLINE</Text>
          </View>
        </View>

        {/* MESSAGES LIST */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 gap-4"
          contentContainerStyle={{ paddingVertical: 8, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`flex-col gap-2.5 ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              {/* Bubble */}
              <View
                className={`max-w-[85%] rounded-3xl p-4 border ${msg.sender === "user"
                  ? "bg-emerald-600/90 border-emerald-400/50 rounded-br-none"
                  : "bg-[#1C1C1E] border-white/15 rounded-bl-none"
                  }`}
                style={
                  Platform.OS === "web"
                    ? ({
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    } as any)
                    : {}
                }
              >
                <Text className={`text-sm leading-relaxed ${msg.sender === "user" ? "text-white font-semibold" : "text-slate-200"}`}>
                  {msg.text}
                </Text>
                <Text className={`text-[9px] font-bold mt-1.5 self-end ${msg.sender === "user" ? "text-white/70" : "text-slate-400"}`}>
                  {msg.timestamp}
                </Text>
              </View>

              {/* Suggestions chips underneath AI messages */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-1 max-w-[95%]">
                  {msg.suggestions.map((chip, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSend(chip)}
                      className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 active:scale-95"
                    >
                      <Text className="text-xs font-extrabold text-emerald-400">{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View className="flex-row items-center gap-2 bg-[#1C1C1E] border border-white/15 rounded-2xl px-4 py-3 self-start">
              <ActivityIndicator size="small" color="#10B981" />
              <Text className="text-xs font-bold text-slate-300">CrickAI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* INPUT BAR */}
        <View className="flex-row items-center gap-2 pt-2 border-t border-white/10">
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            placeholder="Ask CrickAI about rules, tactics, DLS..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="flex-1 bg-[#1C1C1E] border border-white/15 rounded-2xl px-4 py-3 text-white text-sm font-semibold"
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim()}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${input.trim() ? "bg-emerald-500 active:scale-95" : "bg-white/10 opacity-50"
              }`}
          >
            <Text className="text-black font-black text-lg">➔</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
