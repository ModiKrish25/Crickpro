/**
 * League Teams & Rosters - Team management for tournaments
 * 
 * Manages team rosters, player assignments, roles (captain, vice-captain, wicketkeeper),
 * and join requests for league/tournament management.
 * 
 * Design: Premium glassmorphism with clean roster lists
 */
import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";

export interface TeamPlayer {
  id: string;
  name: string;
  role: "batsman" | "bowler" | "all-rounder" | "wicket-keeper";
  battingStyle?: string;
  bowlingStyle?: string;
  jerseyNumber?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isKeeper?: boolean;
  status: "active" | "pending" | "declined";
}

export interface LeagueTeam {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  players: TeamPlayer[];
  captainName?: string;
  viceCaptainName?: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

interface LeagueTeamsProps {
  teams: LeagueTeam[];
  onAddPlayer?: (teamId: string) => void;
  onRemovePlayer?: (teamId: string, playerId: string) => void;
  onAssignCaptain?: (teamId: string, playerId: string) => void;
  onAssignViceCaptain?: (teamId: string, playerId: string) => void;
  onAssignKeeper?: (teamId: string, playerId: string) => void;
  onApproveJoin?: (teamId: string, playerId: string) => void;
  onRejectJoin?: (teamId: string, playerId: string) => void;
  organizerMode?: boolean;
}

export function LeagueTeams({
  teams,
  onAddPlayer,
  onRemovePlayer,
  onAssignCaptain,
  onAssignViceCaptain,
  onAssignKeeper,
  onApproveJoin,
  onRejectJoin,
  organizerMode = false,
}: LeagueTeamsProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAction = async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  };

  const pendingRequests = useMemo(() => {
    return teams.reduce((acc, team) => {
      const pending = team.players.filter(p => p.status === "pending");
      if (pending.length > 0) {
        acc.push({ teamId: team.id, teamName: team.name, players: pending });
      }
      return acc;
    }, [] as { teamId: string; teamName: string; players: TeamPlayer[] }[]);
  }, [teams]);

  return (
    <View className="gap-4">
      {/* Pending Join Requests */}
      {pendingRequests.length > 0 && organizerMode && (
        <GlassCard intensity="high" padding="lg" radius="xl" glowColor="#FF9F0A" className="gap-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg">🕐</Text>
            <Text className="text-sm font-bold text-foreground">Pending Join Requests</Text>
            <View className="bg-[#FF9F0A]/15 rounded-full px-2 py-0.5">
              <Text className="text-[10px] font-bold text-[#FF9F0A]">{pendingRequests.length}</Text>
            </View>
          </View>
          {pendingRequests.map((req) =>
            req.players.map((player) => (
              <View key={player.id} className="flex-row items-center gap-3 py-2 border-b border-white/10 dark:border-white/[0.06] last:border-b-0">
                <View className="w-8 h-8 rounded-full bg-[#FF9F0A]/10 items-center justify-center">
                  <Text className="text-xs font-bold text-[#FF9F0A]">{player.name[0]}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{player.name}</Text>
                  <Text className="text-[10px] text-muted">Wants to join {req.teamName}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="bg-[#34C759] rounded-xl px-3 py-2"
                    onPress={() => handleAction(() => onApproveJoin?.(req.teamId, player.id))}
                  >
                    <Text className="text-white text-[10px] font-bold">Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-[#FF3B30] rounded-xl px-3 py-2"
                    onPress={() => handleAction(() => onRejectJoin?.(req.teamId, player.id))}
                  >
                    <Text className="text-white text-[10px] font-bold">Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      )}

      {/* Team Cards */}
      {teams.length === 0 ? (
        <GlassCard intensity="subtle" padding="xl" radius="xl" className="items-center gap-3 py-8">
          <Text className="text-3xl">👥</Text>
          <Text className="text-base font-semibold text-foreground">No Teams Yet</Text>
          <Text className="text-sm text-muted text-center max-w-[240px] leading-5">
            {organizerMode
              ? "Add teams to the league to get started"
              : "Teams will appear here once the organizer adds them"}
          </Text>
        </GlassCard>
      ) : (
        teams.map((team) => {
          const expanded = expandedTeam === team.id;
          const activePlayers = team.players.filter(p => p.status === "active");
          const pendingPlayers = team.players.filter(p => p.status === "pending");
          return (
            <GlassCard
              key={team.id}
              intensity="medium"
              padding="md"
              radius="xl"
              className="gap-3"
            >
              {/* Team Header */}
              <TouchableOpacity
                className="flex-row items-center gap-3"
                onPress={() => handleAction(() => setExpandedTeam(expanded ? null : team.id))}
              >
                <View className="w-12 h-12 rounded-full bg-[#0066FF]/10 items-center justify-center">
                  <Text className="text-lg font-bold text-[#0066FF]">{team.shortName || team.name[0]}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{team.name}</Text>
                  <Text className="text-[10px] text-muted">
                    {activePlayers.length} players • {team.matchesPlayed} matches • {team.wins}W/{team.losses}L
                  </Text>
                </View>
                <Text className="text-lg text-muted">{expanded ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {/* Expanded Roster */}
              {expanded && (
                <View className="gap-3 pt-1">
                  {/* Captain/Vice-Captain */}
                  {(team.captainName || team.viceCaptainName) && (
                    <View className="flex-row gap-2">
                      {team.captainName && (
                        <View className="flex-1 bg-[#FF9F0A]/10 rounded-xl p-3">
                          <Text className="text-[9px] font-bold text-[#FF9F0A] uppercase">👑 Captain</Text>
                          <Text className="text-sm font-bold text-foreground">{team.captainName}</Text>
                        </View>
                      )}
                      {team.viceCaptainName && (
                        <View className="flex-1 bg-[#5E5CE6]/10 rounded-xl p-3">
                          <Text className="text-[9px] font-bold text-[#5E5CE6] uppercase">⭐ Vice-Captain</Text>
                          <Text className="text-sm font-bold text-foreground">{team.viceCaptainName}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Roster List */}
                  <View className="bg-white/30 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
                    <View className="px-4 py-2 flex-row items-center border-b border-white/10 dark:border-white/[0.06]">
                      <Text className="flex-1 text-[10px] font-bold text-muted uppercase">Player</Text>
                      <Text className="w-16 text-right text-[10px] font-bold text-muted uppercase">Role</Text>
                      {organizerMode && <View className="w-24" />}
                    </View>
                    {activePlayers.map((player, idx) => (
                      <View
                        key={player.id}
                        className={`flex-row items-center px-4 py-2.5 ${
                          idx < activePlayers.length - 1 ? "border-b border-white/10 dark:border-white/[0.06]" : ""
                        }`}
                      >
                        <View className="flex-1 flex-row items-center gap-2">
                          <Text className="text-xs font-semibold text-foreground">{player.name}</Text>
                          {player.isCaptain && <Text className="text-[10px]">👑</Text>}
                          {player.isViceCaptain && <Text className="text-[10px]">⭐</Text>}
                          {player.isKeeper && <Text className="text-[10px]">🧤</Text>}
                        </View>
                        <View className="w-16 items-end">
                          <Text className="text-[10px] text-muted capitalize">{player.role.replace("-", " ")}</Text>
                        </View>
                        {organizerMode && (
                          <View className="w-24 flex-row gap-1 justify-end">
                            <TouchableOpacity
                              className="w-7 h-7 rounded-lg bg-[#FF9F0A]/10 items-center justify-center"
                              onPress={() => handleAction(() => onAssignCaptain?.(team.id, player.id))}
                            >
                              <Text className="text-[9px]">👑</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="w-7 h-7 rounded-lg bg-[#5E5CE6]/10 items-center justify-center"
                              onPress={() => handleAction(() => onAssignViceCaptain?.(team.id, player.id))}
                            >
                              <Text className="text-[9px]">⭐</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="w-7 h-7 rounded-lg bg-[#0066FF]/10 items-center justify-center"
                              onPress={() => handleAction(() => onAssignKeeper?.(team.id, player.id))}
                            >
                              <Text className="text-[9px]">🧤</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="w-7 h-7 rounded-lg bg-[#FF3B30]/10 items-center justify-center"
                              onPress={() => handleAction(() => onRemovePlayer?.(team.id, player.id))}
                            >
                              <Text className="text-[9px]">✕</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Pending players */}
                  {pendingPlayers.length > 0 && organizerMode && (
                    <View className="bg-[#FF9F0A]/5 rounded-2xl p-3 border border-[#FF9F0A]/20">
                      <Text className="text-[10px] font-bold text-[#FF9F0A] mb-2">🕐 Pending ({pendingPlayers.length})</Text>
                      {pendingPlayers.map(p => (
                        <View key={p.id} className="flex-row items-center gap-2 py-1">
                          <Text className="text-xs text-muted flex-1">{p.name}</Text>
                          <TouchableOpacity className="bg-[#34C759] rounded-lg px-2 py-1" onPress={() => handleAction(() => onApproveJoin?.(team.id, p.id))}>
                            <Text className="text-white text-[9px] font-bold">Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity className="bg-[#FF3B30] rounded-lg px-2 py-1" onPress={() => handleAction(() => onRejectJoin?.(team.id, p.id))}>
                            <Text className="text-white text-[9px] font-bold">Reject</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Add Player */}
                  {organizerMode && onAddPlayer && (
                    <TouchableOpacity
                      className="border-2 border-dashed border-[#0066FF]/20 rounded-2xl py-3 items-center"
                      onPress={() => handleAction(() => {
                        setShowAddPlayer(team.id);
                        setNewPlayerName("");
                      })}
                    >
                      <Text className="text-[#0066FF] text-sm font-semibold">+ Add Player</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </GlassCard>
          );
        })
      )}

      {/* Add Player Modal */}
      {showAddPlayer && (
        <View className="absolute inset-0 z-50 justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            className="rounded-3xl p-6 gap-5"
            style={{
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 16,
              ...(Platform.OS === "web" ? {
                backdropFilter: "blur(32px) saturate(180%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%)",
              } as any : {}),
            }}
          >
            <Text className="text-lg font-bold text-foreground tracking-tight">➕ Add Player</Text>
            <Text className="text-xs text-muted">Enter the player&apos;s name to add them to the roster</Text>
            <TextInput
              className="text-base font-semibold text-foreground px-4 py-3 rounded-2xl border"
              style={{
                backgroundColor: isDark ? "rgba(28,28,30,0.8)" : "rgba(242,242,247,0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              }}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Enter player name"
              placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
              autoFocus
              maxLength={30}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center border"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" }}
                onPress={() => setShowAddPlayer(null)}
              >
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center bg-[#0066FF]"
                onPress={() => {
                  if (newPlayerName.trim() && showAddPlayer) {
                    onAddPlayer?.(showAddPlayer);
                    setNewPlayerName("");
                    setShowAddPlayer(null);
                  }
                }}
              >
                <Text className="text-sm font-bold text-white">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default LeagueTeams;
