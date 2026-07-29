/**
 * Cricket Community Screen - Scorers, Umpires, Grounds & Box Nets
 * 
 * Design Architecture:
 * - Pitch Dark Emerald Charcoal Palette matching exact user image 2
 * - Active pill in Warm Yellow Gold (#FBBF24) with dark text
 * - Book & Hire buttons in Warm Yellow Gold (#FBBF24) with dark text
 * - Verified badge in Mint Green (#10B981)
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSearchBar } from "@/components/ui/glass-search-bar";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

type CommunityRole = "all" | "scorers" | "umpires" | "commentators" | "streamers" | "organisers" | "academies" | "grounds" | "box_nets";

interface CommunityMember {
  id: string;
  name: string;
  role: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  location: string;
  experience: string;
  priceRate: string;
  description: string;
  icon: string;
}

export default function CommunityScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<CommunityRole>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const mockMembers: CommunityMember[] = [
    {
      id: "m1",
      name: "Rahul Sharma",
      role: "OFFICIAL SCORER",
      verified: true,
      rating: 4.9,
      reviewsCount: 48,
      location: "Central Park Stadium",
      experience: "5+ yrs exp",
      priceRate: "₹800/match",
      description: "Certified ball-by-ball live digital scorer with 100% accuracy.",
      icon: "📊",
    },
    {
      id: "m2",
      name: "David Shepherd",
      role: "CERTIFIED UMPIRE",
      verified: true,
      rating: 4.95,
      reviewsCount: 62,
      location: "Riverside Oval",
      experience: "10+ yrs exp",
      priceRate: "₹1,500/match",
      description: "BCCI Level-2 certified match umpire for tournaments & T20s.",
      icon: "⚖️",
    },
    {
      id: "m3",
      name: "Voice of Cricket Studio",
      role: "LIVE COMMENTARY",
      verified: true,
      rating: 4.85,
      reviewsCount: 36,
      location: "City Sports Club",
      experience: "Hindi & English",
      priceRate: "₹2,000/match",
      description: "Energetic ball-by-ball Hindi & English commentary for live streams.",
      icon: "🎙️",
    },
    {
      id: "m4",
      name: "Green Turf Box Nets",
      role: "BOX CRICKET & NETS",
      verified: true,
      rating: 4.8,
      reviewsCount: 120,
      location: "Downtown Arena",
      experience: "Floodlights • Jugs machine",
      priceRate: "₹1,200/hr",
      description: "FIFA approved astro turf box cricket & bowling machine nets.",
      icon: "🏏",
    },
  ];

  const filteredMembers = useMemo(() => {
    let result = mockMembers;
    if (searchQuery.trim()) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [mockMembers, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  return (
    <ScreenContainer gradient>
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10B981" />}
      >
        <View className="flex-1 gap-5 pt-2">
          
          {/* HEADER (Exact User Image 2 Layout) */}
          <View className="flex-row items-center justify-between px-1">
            <View className="gap-0.5">
              <Text className="text-3xl font-black text-white tracking-tight">Cricket Community</Text>
              <Text className="text-xs font-bold text-slate-400">Scorers, Umpires, Grounds & Box Nets</Text>
            </View>
            <TouchableOpacity
              onPress={() => alert("Join Cricket Community Network!")}
              className="bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-lg shadow-amber-500/20"
            >
              <Text className="text-[#050B08] text-xs font-black">+ Join Network</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR (Exact User Image 2 Layout) */}
          <GlassSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search umpires, grounds, box cricket..."
          />

          {/* NETWORK CATEGORY PILLS (Exact User Image 2 Layout) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            {[
              { id: "all", label: "⭐ All Network" },
              { id: "scorers", label: "📊 Scorers" },
              { id: "umpires", label: "⚖️ Umpires" },
              { id: "commentators", label: "🎙️ Commentators" },
              { id: "streamers", label: "📺 Streamers" },
              { id: "organisers", label: "🏆 Organisers" },
              { id: "academies", label: "🏟️ Academies" },
              { id: "grounds", label: "🏛️ Grounds" },
              { id: "box_nets", label: "🏏 Box Cricket & Nets" },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRoleFilter(tab.id as any);
                  }}
                  className={`px-4 py-2.5 rounded-xl border flex-row items-center transition-all active:scale-95 ${
                    active
                      ? "bg-[#F59E0B] border-[#F59E0B] shadow-md shadow-amber-500/30"
                      : "bg-[#0B1712] border-[#142820]"
                  }`}
                >
                  <Text className={`text-xs font-black ${active ? "text-[#050B08]" : "text-[#CBD5E1]"}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* MEMBER CARDS LIST (Exact User Image 2 Layout) */}
          <View className="gap-3.5">
            {filteredMembers.map((member) => (
              <GlassCard
                key={member.id}
                intensity="heavy"
                radius="xl"
                padding="md"
                className="bg-[#0B1511]/95 border-[#10B981]/20 gap-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-[#060D0A] border border-[#10B981]/30 items-center justify-center">
                      <Text className="text-lg">{member.icon}</Text>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-black text-white">{member.name}</Text>
                        {member.verified && (
                          <View className="bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                            <Text className="text-[10px] font-black text-[#10B981]">✓ VERIFIED</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] font-black text-[#F59E0B] uppercase tracking-wider">{member.role}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1 bg-[#060D0A] px-2.5 py-1 rounded-lg border border-white/10">
                    <Text className="text-xs font-black text-[#FBBF24]">★ {member.rating}</Text>
                    <Text className="text-[10px] font-bold text-slate-400">({member.reviewsCount} reviews)</Text>
                  </View>
                </View>

                <Text className="text-xs font-semibold text-slate-300 leading-relaxed">
                  {member.description}
                </Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                  <View>
                    <Text className="text-[11px] font-bold text-slate-400">{member.location} • {member.experience}</Text>
                    <Text className="text-sm font-black text-white">{member.priceRate}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => alert(`Booking request sent to ${member.name}!`)}
                    className="bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 rounded-xl active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <Text className="text-[#050B08] text-xs font-black uppercase tracking-wider">BOOK & HIRE →</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
