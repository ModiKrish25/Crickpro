/**
 * Organizer Dashboard - Tournament management command center
 * 
 * Provides tournament organizers with a comprehensive dashboard:
 * - League overview (matches played, teams, progress)
 * - Quick actions (add fixture, manage teams, broadcast)
 * - Recent results / upcoming matches
 * - Venue and umpire management
 * - Points table quick view
 * - Announcements / broadcast to all teams
 * 
 * Design: Premium glassmorphism dashboard layout
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { PillSelector } from "@/components/ui/pill-selector";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";

interface DashboardProps {
  leagueName: string;
  format: string;
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  teams: { name: string; played: number; won: number; lost: number; pts: number; nrr: number }[];
  upcomingMatches: { team1: string; team2: string; date?: string; venue?: string }[];
  recentResults: { team1: string; team2: string; score1: string; score2: string; result: string }[];
  venues: string[];
  umpires: string[];
  onAddFixture?: () => void;
  onManageTeams?: () => void;
  onManageVenues?: () => void;
  onManageUmpires?: () => void;
  onBroadcast?: (message: string) => void;
  onViewFixtures?: () => void;
  onViewStandings?: () => void;
}

type DashboardTab = "overview" | "fixtures" | "teams" | "settings" | "broadcast";

export function OrganizerDashboard({
  leagueName,
  format,
  totalTeams,
  totalMatches,
  completedMatches,
  teams,
  upcomingMatches,
  recentResults,
  venues,
  umpires,
  onAddFixture,
  onManageTeams,
  onManageVenues,
  onManageUmpires,
  onBroadcast,
  onViewFixtures,
  onViewStandings,
}: DashboardProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showVenueInput, setShowVenueInput] = useState(false);
  const [showUmpireInput, setShowUmpireInput] = useState(false);
  const [newVenue, setNewVenue] = useState("");
  const [newUmpire, setNewUmpire] = useState("");

  const handleAction = async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  };

  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const tabs: { id: DashboardTab; icon: string; label: string }[] = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "fixtures", icon: "📅", label: "Fixtures" },
    { id: "teams", icon: "👥", label: "Teams" },
    { id: "broadcast", icon: "📢", label: "Broadcast" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <View className="gap-5">
      {/* Header */}
      <View className="gap-1">
        <Text className="text-xl font-bold text-foreground tracking-tight">🎯 Organizer Dashboard</Text>
        <Text className="text-sm text-muted">Manage {leagueName}</Text>
      </View>

      {/* Tab Bar */}
      <PillSelector
        selected={activeTab}
        onSelect={(val) => handleAction(() => setActiveTab(val))}
        options={tabs}
        horizontal
      />

      {/* ──── OVERVIEW TAB ──── */}
      {activeTab === "overview" && (
        <View className="gap-4">
          {/* Progress Card */}
          <GlassCard intensity="high" padding="lg" radius="xl" glowColor="#0066FF" className="gap-4">
            <LiquidGlassOverlay color="#0066FF" variant="sheen" speed={0.6} intensity={0.3} />
            <Text className="text-lg font-bold text-foreground tracking-tight">League Progress</Text>
            <View className="h-2 rounded-full bg-white/30 dark:bg-white/[0.08] overflow-hidden">
              <View
                className="h-full rounded-full bg-[#0066FF]"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </View>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-sm text-muted">Completed</Text>
                <Text className="text-xl font-bold text-[#0066FF]">{completedMatches}/{totalMatches}</Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-muted">Teams</Text>
                <Text className="text-xl font-bold text-[#34C759]">{totalTeams}</Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-muted">Format</Text>
                <Text className="text-xl font-bold text-[#FF9F0A] capitalize">{format}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Quick Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-[#0066FF] rounded-2xl py-4 items-center gap-1"
              onPress={() => handleAction(() => onAddFixture?.())}
            >
              <Text className="text-2xl">📅</Text>
              <Text className="text-white font-semibold text-sm">Add Fixture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#34C759] rounded-2xl py-4 items-center gap-1"
              onPress={() => handleAction(() => onManageTeams?.())}
            >
              <Text className="text-2xl">👥</Text>
              <Text className="text-white font-semibold text-sm">Manage Teams</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#5E5CE6] rounded-2xl py-4 items-center gap-1"
              onPress={() => handleAction(() => onViewStandings?.())}
            >
              <Text className="text-2xl">🏆</Text>
              <Text className="text-white font-semibold text-sm">Standings</Text>
            </TouchableOpacity>
          </View>

          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-bold text-foreground">📅 Upcoming Matches</Text>
              {upcomingMatches.map((m, idx) => (
                <GlassCard key={idx} intensity="medium" padding="md" radius="xl" staggerIndex={idx}>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 items-start">
                      <Text className="text-xs font-bold text-foreground">{m.team1}</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-[9px] text-muted">VS</Text>
                      {m.date && <Text className="text-[8px] text-muted mt-0.5">{m.date}</Text>}
                    </View>
                    <View className="flex-1 items-end">
                      <Text className="text-xs font-bold text-foreground">{m.team2}</Text>
                    </View>
                  </View>
                  {m.venue && <Text className="text-[10px] text-muted text-center mt-1">📍 {m.venue}</Text>}
                </GlassCard>
              ))}
            </View>
          )}

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-bold text-foreground">📋 Recent Results</Text>
              {recentResults.slice(0, 3).map((r, idx) => (
                <GlassCard key={idx} intensity="medium" padding="md" radius="xl" staggerIndex={idx + 5}>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted">{r.team1}</Text>
                      <Text className="text-base font-bold text-[#0066FF]">{r.score1}</Text>
                    </View>
                    <View className="flex-1 items-end">
                      <Text className="text-[10px] text-muted">{r.team2}</Text>
                      <Text className="text-base font-bold text-[#0066FF]">{r.score2}</Text>
                    </View>
                  </View>
                  <Text className="text-[10px] font-semibold text-[#34C759] text-center mt-1">{r.result}</Text>
                </GlassCard>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ──── FIXTURES TAB ──── */}
      {activeTab === "fixtures" && (
        <View className="gap-4">
          <TouchableOpacity
            className="bg-[#0066FF] rounded-2xl py-4 items-center flex-row justify-center gap-2"
            onPress={() => handleAction(() => onAddFixture?.())}
          >
            <Text className="text-white font-bold">➕ Add New Fixture</Text>
          </TouchableOpacity>

          <Text className="text-sm font-bold text-foreground">Scheduled Matches</Text>
          {upcomingMatches.length === 0 ? (
            <GlassCard intensity="subtle" padding="lg" radius="xl" className="items-center py-6">
              <Text className="text-sm text-muted">No scheduled fixtures yet</Text>
            </GlassCard>
          ) : (
            upcomingMatches.map((m, idx) => (
              <GlassCard key={idx} intensity="medium" padding="md" radius="xl" staggerIndex={idx}>
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{m.team1}</Text>
                  </View>
                  <View className="items-center px-2">
                    <View className="bg-white/20 dark:bg-white/[0.06] rounded-full w-7 h-7 items-center justify-center">
                      <Text className="text-[9px] font-bold text-muted">VS</Text>
                    </View>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-sm font-bold text-foreground">{m.team2}</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-center gap-3 mt-1">
                  {m.date && <Text className="text-[10px] text-muted">📅 {m.date}</Text>}
                  {m.venue && <Text className="text-[10px] text-muted">📍 {m.venue}</Text>}
                </View>
              </GlassCard>
            ))
          )}
        </View>
      )}

      {/* ──── TEAMS TAB ──── */}
      {activeTab === "teams" && (
        <View className="gap-3">
          <Text className="text-sm font-bold text-foreground">Quick Standings</Text>
          <View className="bg-white/30 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
            <View className="flex-row px-4 py-2 border-b border-white/10 dark:border-white/[0.06]">
              <Text className="w-6 text-[10px] font-bold text-muted">#</Text>
              <Text className="flex-1 text-[10px] font-bold text-muted">Team</Text>
              <Text className="w-6 text-[10px] font-bold text-muted text-right">P</Text>
              <Text className="w-6 text-[10px] font-bold text-muted text-right">W</Text>
              <Text className="w-6 text-[10px] font-bold text-muted text-right">L</Text>
              <Text className="w-8 text-[10px] font-bold text-muted text-right">Pts</Text>
              <Text className="w-12 text-[10px] font-bold text-muted text-right">NRR</Text>
            </View>
            {teams.sort((a, b) => b.pts - a.pts || b.nrr - a.nrr).map((t, idx) => (
              <View key={t.name} className={`flex-row items-center px-4 py-2.5 ${idx < teams.length - 1 ? "border-b border-white/10 dark:border-white/[0.06]" : ""}`}>
                <Text className="w-6 text-[10px] font-bold text-muted">{idx + 1}</Text>
                <Text className="flex-1 text-xs font-semibold text-foreground">{t.name}</Text>
                <Text className="w-6 text-xs text-right text-foreground">{t.played}</Text>
                <Text className="w-6 text-xs text-right text-[#34C759]">{t.won}</Text>
                <Text className="w-6 text-xs text-right text-[#FF3B30]">{t.lost}</Text>
                <Text className="w-8 text-xs text-right font-bold text-[#0066FF]">{t.pts}</Text>
                <Text className="w-12 text-[10px] text-right text-muted">{t.nrr > 0 ? "+" : ""}{t.nrr.toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            className="rounded-2xl py-3 items-center border-2 border-dashed border-[#0066FF]/30"
            onPress={() => handleAction(() => onManageTeams?.())}
          >
            <Text className="text-[#0066FF] font-semibold">👥 Manage Team Rosters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ──── BROADCAST TAB ──── */}
      {activeTab === "broadcast" && (
        <View className="gap-4">
          <GlassCard intensity="high" padding="lg" radius="xl" className="gap-4">
            <Text className="text-lg font-bold text-foreground tracking-tight">📢 Send Announcement</Text>
            <Text className="text-xs text-muted">Broadcast a message to all teams in the league</Text>
            <View
              className="rounded-2xl px-4 py-3 border"
              style={{
                backgroundColor: isDark ? "rgba(28,28,30,0.8)" : "rgba(242,242,247,0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                minHeight: 100,
              }}
            >
              <TextInput
                className="text-base text-foreground"
                value={broadcastMessage}
                onChangeText={setBroadcastMessage}
                placeholder="Type your announcement..."
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              className="bg-[#0066FF] rounded-2xl py-4 items-center"
              disabled={!broadcastMessage.trim()}
              style={{ opacity: broadcastMessage.trim() ? 1 : 0.5 }}
              onPress={() => handleAction(() => {
                if (broadcastMessage.trim()) onBroadcast?.(broadcastMessage.trim());
                setBroadcastMessage("");
              })}
            >
              <Text className="text-white font-bold">📢 Send to All Teams</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {/* ──── SETTINGS TAB ──── */}
      {activeTab === "settings" && (
        <View className="gap-4">
          {/* Venues */}
          <GlassCard intensity="high" padding="lg" radius="xl" className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-foreground">🏟️ Venues ({venues.length})</Text>
              <TouchableOpacity
                className="bg-[#0066FF]/10 rounded-full px-3 py-1.5"
                onPress={() => handleAction(() => setShowVenueInput(!showVenueInput))}
              >
                <Text className="text-[#0066FF] text-[10px] font-bold">+ Add</Text>
              </TouchableOpacity>
            </View>
            {showVenueInput && (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-foreground"
                  style={{
                    backgroundColor: isDark ? "rgba(28,28,30,0.8)" : "rgba(242,242,247,0.8)",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                  }}
                  value={newVenue}
                  onChangeText={setNewVenue}
                  placeholder="Venue name"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                  autoFocus
                />
                <TouchableOpacity className="bg-[#0066FF] rounded-xl px-4 py-2.5 items-center justify-center" onPress={() => handleAction(() => { onManageVenues?.(); setNewVenue(""); setShowVenueInput(false); })}>
                  <Text className="text-white text-xs font-bold">Add</Text>
                </TouchableOpacity>
              </View>
            )}
            {venues.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {venues.map((v, idx) => (
                  <View key={idx} className="bg-white/30 dark:bg-white/[0.05] rounded-full px-3 py-1.5">
                    <Text className="text-[10px] text-foreground">📍 {v}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-xs text-muted italic">No venues added yet</Text>
            )}
          </GlassCard>

          {/* Umpires */}
          <GlassCard intensity="high" padding="lg" radius="xl" className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-foreground">⚖️ Umpires ({umpires.length})</Text>
              <TouchableOpacity
                className="bg-[#0066FF]/10 rounded-full px-3 py-1.5"
                onPress={() => handleAction(() => setShowUmpireInput(!showUmpireInput))}
              >
                <Text className="text-[#0066FF] text-[10px] font-bold">+ Add</Text>
              </TouchableOpacity>
            </View>
            {showUmpireInput && (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-foreground"
                  style={{
                    backgroundColor: isDark ? "rgba(28,28,30,0.8)" : "rgba(242,242,247,0.8)",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                  }}
                  value={newUmpire}
                  onChangeText={setNewUmpire}
                  placeholder="Umpire name"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                  autoFocus
                />
                <TouchableOpacity className="bg-[#0066FF] rounded-xl px-4 py-2.5 items-center justify-center" onPress={() => handleAction(() => { onManageUmpires?.(); setNewUmpire(""); setShowUmpireInput(false); })}>
                  <Text className="text-white text-xs font-bold">Add</Text>
                </TouchableOpacity>
              </View>
            )}
            {umpires.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {umpires.map((u, idx) => (
                  <View key={idx} className="bg-white/30 dark:bg-white/[0.05] rounded-full px-3 py-1.5">
                    <Text className="text-[10px] text-foreground">⚖️ {u}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-xs text-muted italic">No umpires added yet</Text>
            )}
          </GlassCard>
        </View>
      )}
    </View>
  );
}

export default OrganizerDashboard;
