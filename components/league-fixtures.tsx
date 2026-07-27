/**
 * League Fixtures & Results View
 * 
 * Comprehensive fixtures and results view for league/tournament management.
 * Shows all matches in a league with their status, scores, and results.
 * Supports filtering by round/status and viewing match details.
 * 
 * Design: Premium glassmorphism with timeline layout for matches
 */
import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";

export interface LeagueFixture {
  id: string;
  round: number;
  team1: string;
  team2: string;
  date?: string;
  time?: string;
  venue?: string;
  status: "scheduled" | "live" | "completed" | "abandoned";
  score1?: string;
  score2?: string;
  result?: string;
  manOfTheMatch?: string;
  umpire?: string;
}

interface LeagueFixturesProps {
  fixtures: LeagueFixture[];
  leagueName?: string;
  onMatchPress?: (fixture: LeagueFixture) => void;
  onAddFixture?: () => void;
  maxRounds?: number;
  organizerMode?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#86868B",
  live: "#34C759",
  completed: "#0066FF",
  abandoned: "#FF3B30",
};

export function LeagueFixtures({
  fixtures,
  leagueName,
  onMatchPress,
  onAddFixture,
  maxRounds = 5,
  organizerMode = false,
}: LeagueFixturesProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = fixtures;
    if (filterStatus) {
      items = items.filter(f => f.status === filterStatus);
    }
    // Group by round
    const grouped: Record<number, LeagueFixture[]> = {};
    items.forEach(f => {
      if (!grouped[f.round]) grouped[f.round] = [];
      grouped[f.round].push(f);
    });
    return grouped;
  }, [fixtures, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: fixtures.length,
      completed: fixtures.filter(f => f.status === "completed").length,
      live: fixtures.filter(f => f.status === "live").length,
      scheduled: fixtures.filter(f => f.status === "scheduled").length,
    };
  }, [fixtures]);

  const handleFilter = (status: string | null) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterStatus(status);
  };

  const getRoundLabel = (roundNum: number) => {
    if (roundNum === 0) return "Final";
    if (roundNum === 1) return "Round 1";
    if (roundNum === 2) return "Round 2";
    return `Round ${roundNum}`;
  };

  return (
    <View className="gap-4">
      {/* Stats bar */}
      <View className="flex-row gap-2">
        {[
          { id: null as string | null, label: "All", count: stats.total },
          { id: "live", label: "Live", count: stats.live },
          { id: "completed", label: "Completed", count: stats.completed },
          { id: "scheduled", label: "Scheduled", count: stats.scheduled },
        ].map(s => (
          <TouchableOpacity
            key={s.label}
            className={`flex-1 rounded-2xl p-3 items-center ${
              filterStatus === s.id
                ? "bg-[#0066FF]"
                : "bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"
            }`}
            onPress={() => handleFilter(s.id)}
          >
            <Text className={`text-lg font-bold ${filterStatus === s.id ? "text-white" : "text-foreground"}`}>
              {s.count}
            </Text>
            <Text className={`text-[10px] ${filterStatus === s.id ? "text-white/70" : "text-muted"}`}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Fixture button (organizer mode) */}
      {organizerMode && onAddFixture && (
        <TouchableOpacity
          className="rounded-2xl py-3.5 items-center flex-row justify-center gap-2 border-2 border-dashed border-[#0066FF]/30"
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddFixture();
          }}
        >
          <Text className="text-lg">➕</Text>
          <Text className="text-[#0066FF] font-semibold">Add Fixture</Text>
        </TouchableOpacity>
      )}

      {/* No fixtures state */}
      {fixtures.length === 0 ? (
        <GlassCard intensity="subtle" padding="xl" radius="xl" className="items-center gap-3 py-8">
          <Text className="text-3xl">📅</Text>
          <Text className="text-base font-semibold text-foreground">No Fixtures Yet</Text>
          <Text className="text-sm text-muted text-center max-w-[240px] leading-5">
            {organizerMode
              ? "Add matches to the league schedule to get started"
              : "Fixtures will appear here once the organizer adds them"}
          </Text>
          {organizerMode && onAddFixture && (
            <TouchableOpacity className="mt-2 bg-[#0066FF] rounded-full px-6 py-3" onPress={onAddFixture}>
              <Text className="text-white font-semibold text-sm">Add First Fixture</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            {Object.entries(filtered).map(([roundStr, roundFixtures]) => {
              const roundNum = parseInt(roundStr);
              return (
                <View key={roundNum} className="gap-2">
                  <View className="flex-row items-center gap-2 px-1">
                    <View className="flex-1 h-px bg-white/20 dark:bg-white/[0.08]" />
                    <Text className="text-xs font-bold text-muted uppercase tracking-wider">
                      {getRoundLabel(roundNum)}
                    </Text>
                    <View className="flex-1 h-px bg-white/20 dark:bg-white/[0.08]" />
                  </View>

                  {roundFixtures.map((fixture, idx) => {
                    const statusColor = STATUS_COLORS[fixture.status] || "#86868B";
                    return (
                      <GlassCard
                        key={fixture.id}
                        intensity="medium"
                        glowColor={fixture.status === "live" ? "#34C759" : "#0066FF"}
                        padding="md"
                        radius="xl"
                        className="gap-3"
                        onPress={() => onMatchPress?.(fixture)}
                        staggerIndex={idx}
                      >
                        {fixture.status === "live" && (
                          <LiquidGlassOverlay color="#34C759" variant="pulse" speed={1.2} intensity={0.4} />
                        )}

                        {/* Status badge */}
                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center gap-1.5">
                            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: statusColor }}>
                              {fixture.status}
                            </Text>
                          </View>
                          {fixture.date && (
                            <Text className="text-[10px] text-muted">{fixture.date} {fixture.time || ""}</Text>
                          )}
                        </View>

                        {/* Teams & Score */}
                        <View className="flex-row items-center gap-3">
                          <View className="flex-1 items-start">
                            <Text className="text-sm font-bold text-foreground">{fixture.team1}</Text>
                            {fixture.score1 && (
                              <Text className="text-2xl font-bold text-[#0066FF] tracking-tight">{fixture.score1}</Text>
                            )}
                          </View>

                          <View className="items-center">
                            <View className="w-9 h-9 rounded-full bg-white/10 dark:bg-white/[0.06] items-center justify-center border border-white/20 dark:border-white/10">
                              <Text className="text-[10px] font-bold text-muted">VS</Text>
                            </View>
                            {fixture.venue && (
                              <Text className="text-[9px] text-muted mt-1 text-center" numberOfLines={1}>{fixture.venue}</Text>
                            )}
                          </View>

                          <View className="flex-1 items-end">
                            <Text className="text-sm font-bold text-foreground">{fixture.team2}</Text>
                            {fixture.score2 && (
                              <Text className="text-2xl font-bold text-[#0066FF] tracking-tight">{fixture.score2}</Text>
                            )}
                          </View>
                        </View>

                        {/* Result / MOTM */}
                        {fixture.result && (
                          <View className="bg-[#34C759]/10 rounded-xl px-3 py-2">
                            <Text className="text-xs font-semibold text-[#34C759] text-center">{fixture.result}</Text>
                          </View>
                        )}
                        {fixture.manOfTheMatch && (
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[10px]">⭐</Text>
                            <Text className="text-[10px] text-muted">Player of the Match: <Text className="font-semibold text-foreground">{fixture.manOfTheMatch}</Text></Text>
                          </View>
                        )}
                        {fixture.umpire && (
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[10px]">⚖️</Text>
                            <Text className="text-[10px] text-muted">Umpire: {fixture.umpire}</Text>
                          </View>
                        )}
                      </GlassCard>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default LeagueFixtures;
