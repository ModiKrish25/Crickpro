/**
 * Community Screen - CrickPro Network Hub (Apple Phone OLED UI)
 * 
 * Directory & booking network for:
 * - Scorers, Umpires, Commentators, Streamers, Organisers, Academies, Grounds, Box Cricket & Nets
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { GlassCard } from "@/components/ui/glass-card";
import { GlassSearchBar } from "@/components/ui/glass-search-bar";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

type CommunityCategory = "all" | "scorers" | "umpires" | "commentators" | "streamers" | "organisers" | "academies" | "grounds" | "nets";

interface CommunityMember {
  id: string;
  name: string;
  category: CommunityCategory;
  categoryLabel: string;
  icon: string;
  rating: number;
  reviews: number;
  experience: string;
  location: string;
  tagline: string;
  priceTag: string;
  isVerified: boolean;
  status: "Available" | "Booked" | "Open";
}

const CATEGORIES: { id: CommunityCategory; label: string; icon: string }[] = [
  { id: "all", label: "🌟 All Network", icon: "🌐" },
  { id: "scorers", label: "📊 Scorers", icon: "📊" },
  { id: "umpires", label: "⚖️ Umpires", icon: "⚖️" },
  { id: "commentators", label: "🎙️ Commentators", icon: "🎙️" },
  { id: "streamers", label: "📹 Streamers", icon: "📹" },
  { id: "organisers", label: "🏆 Organisers", icon: "🏆" },
  { id: "academies", label: "🏫 Academies", icon: "🏫" },
  { id: "grounds", label: "🏟️ Grounds", icon: "🏟️" },
  { id: "nets", label: "🏏 Box Cricket & Nets", icon: "🏏" },
];

const COMMUNITY_DATA: CommunityMember[] = [
  { id: "c1", name: "Rahul Sharma", category: "scorers", categoryLabel: "OFFICIAL SCORER", icon: "📊", rating: 4.9, reviews: 48, experience: "5+ yrs exp", location: "Central Park Stadium", tagline: "Certified ball-by-ball live digital scorer with 100% accuracy.", priceTag: "₹800/match", isVerified: true, status: "Available" },
  { id: "c2", name: "David Shepherd", category: "umpires", categoryLabel: "CERTIFIED UMPIRE", icon: "⚖️", rating: 4.95, reviews: 82, experience: "10+ yrs exp", location: "Riverside Oval", tagline: "BCCI Level-2 certified match umpire for tournaments & T20s.", priceTag: "₹1,500/match", isVerified: true, status: "Available" },
  { id: "c3", name: "Voice of Cricket Studio", category: "commentators", categoryLabel: "LIVE COMMENTARY", icon: "🎙️", rating: 4.85, reviews: 36, experience: "3+ yrs exp", location: "City Stadium", tagline: "Energetic ball-by-ball Hindi & English commentary for live streams.", priceTag: "₹2,000/match", isVerified: true, status: "Available" },
  { id: "c4", name: "ProStream Media", category: "streamers", categoryLabel: "HD STREAMING", icon: "📹", rating: 4.9, reviews: 64, experience: "4K Dual Cam", location: "All Venues", tagline: "Multi-camera YouTube live broadcast with real-time score overlays.", priceTag: "₹4,500/match", isVerified: true, status: "Available" },
  { id: "c5", name: "Apex Cricket Events", category: "organisers", categoryLabel: "EVENT ORGANISER", icon: "🏆", rating: 4.92, reviews: 110, experience: "50+ Tournaments", location: "Metro Region", tagline: "Full tournament management: grounds, umpires, balls & trophies.", priceTag: "Custom Packages", isVerified: true, status: "Open" },
  { id: "c6", name: "National Cricket Academy", category: "academies", categoryLabel: "CRICKET ACADEMY", icon: "🏫", rating: 4.88, reviews: 140, experience: "State Coaches", location: "Sports Complex", tagline: "Professional coaching for Under-14, Under-19 and senior players.", priceTag: "₹3,000/month", isVerified: true, status: "Open" },
  { id: "c7", name: "Royal Green Cricket Ground", category: "grounds", categoryLabel: "MATCH GROUND", icon: "🏟️", rating: 4.95, reviews: 95, experience: "Turf Pitch", location: "Green Valley", tagline: "Floodlit turf ground with pavilion, dressing rooms & scoreboard.", priceTag: "₹8,000/slot", isVerified: true, status: "Available" },
  { id: "c8", name: "PowerStrike Box Cricket & Nets", category: "nets", categoryLabel: "BOX & NET PRACTICE", icon: "🏏", rating: 4.82, reviews: 75, experience: "Bowling Machine", location: "Central Avenue", tagline: "Indoor turf box cricket court & automated RoboArm net practice.", priceTag: "₹1,200/hour", isVerified: true, status: "Available" },
];

export default function CommunityScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
  const responsive = useResponsive();
  const [activeCategory, setActiveCategory] = useState<CommunityCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filteredMembers = useMemo(() => {
    let result = COMMUNITY_DATA;
    if (activeCategory !== "all") {
      result = result.filter((m) => m.category === activeCategory);
    }
    if (searchQuery.trim()) {
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const handleNav = useCallback(async (path: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, [router]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF9F0A" />}
      >
        <View className="flex-1 gap-5 pt-2">
          
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-1">
            <View className="gap-0.5">
              <Text className="text-3xl font-black text-white tracking-tight">Cricket Community</Text>
              <Text className="text-xs font-semibold text-slate-400">Scorers, Umpires, Grounds & Box Nets</Text>
            </View>
            <TouchableOpacity
              onPress={() => alert("Registration form coming in next update!")}
              className="bg-[#FF9F0A] rounded-xl px-3.5 py-2 flex-row items-center gap-1.5 active:opacity-80"
            >
              <Text className="text-black text-xs font-black">+ Join Network</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <GlassSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search umpires, grounds, box cricket..."
          />

          {/* CATEGORY SELECTOR CAROUSEL */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-xl border ${active ? 'bg-[#FF9F0A] border-[#FF9F0A]' : 'bg-[#1C1C1E] border-white/10'}`}
                >
                  <Text className={`text-xs font-black ${active ? 'text-black' : 'text-slate-300'}`}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* COMMUNITY DIRECTORY CARDS */}
          <View className="gap-3">
            {filteredMembers.map((item) => (
              <GlassCard
                key={item.id}
                intensity="heavy"
                radius="xl"
                padding="md"
                className="bg-[#1C1C1E] border-white/15 gap-3"
              >
                {/* Header */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/40 items-center justify-center">
                      <Text className="text-xl">{item.icon}</Text>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-base font-black text-white">{item.name}</Text>
                        {item.isVerified && (
                          <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                            <Text className="text-[9px] font-black text-emerald-400">✓ VERIFIED</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] font-extrabold text-[#FF9F0A] tracking-wider">{item.categoryLabel}</Text>
                    </View>
                  </View>

                  <View className="bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 items-end">
                    <Text className="text-xs font-black text-amber-400">⭐ {item.rating}</Text>
                    <Text className="text-[9px] font-semibold text-slate-400">({item.reviews} reviews)</Text>
                  </View>
                </View>

                {/* Tagline */}
                <Text className="text-xs font-semibold text-slate-300 leading-snug">
                  {item.tagline}
                </Text>

                {/* Footer Details & Action Button */}
                <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                  <View className="gap-0.5">
                    <Text className="text-[10px] font-extrabold text-slate-400">{item.location} • {item.experience}</Text>
                    <Text className="text-xs font-black text-white">{item.priceTag}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      alert(`Contacting ${item.name}... Phone & booking details ready!`);
                    }}
                    className="bg-[#FF9F0A] hover:bg-amber-400 px-4 py-2 rounded-xl active:scale-95 shadow-md shadow-[#FF9F0A]/30"
                  >
                    <Text className="text-black font-black text-xs uppercase">Book & Hire →</Text>
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
