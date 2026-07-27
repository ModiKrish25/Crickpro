/**
 * PlayerSelector — Selection component for picking a player from a team.
 *
 * Design: Glass modal with search, player role icons, and selected state.
 * Used in live scoring to select batsman/bowler/fielder.
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar } from "@/components/ui/avatar";

export interface PlayerItem {
  id: string;
  name: string;
  role?: "batsman" | "bowler" | "all-rounder" | "wicket-keeper";
  jerseyNumber?: number;
  isCaptain?: boolean;
  isKeeper?: boolean;
}

interface PlayerSelectorProps {
  /** List of available players */
  players: PlayerItem[];
  /** Currently selected player ID */
  value?: string;
  /** Called when a player is selected */
  onSelect: (player: PlayerItem) => void;
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Label above the selector */
  label?: string;
  /** Filter by role */
  filterRole?: PlayerItem["role"];
  /** Whether to show the role badge */
  showRole?: boolean;
  /** Additional class names */
  className?: string;
}

const ROLE_ICONS: Record<string, string> = {
  batsman: "🏏",
  bowler: "⚾",
  "all-rounder": "🌟",
  "wicket-keeper": "🧤",
};

export function PlayerSelector({
  players,
  value,
  onSelect,
  placeholder = "Select player...",
  label,
  filterRole,
  showRole = true,
  className,
}: PlayerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = players.filter((p) => {
    if (filterRole && p.role !== filterRole) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = players.find((p) => p.id === value);

  return (
    <View className={cn("gap-1", className)}>
      {label && (
        <Text className="text-sm font-semibold text-foreground mb-0.5">{label}</Text>
      )}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 rounded-xl px-3 py-2.5 border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/[0.05]"
      >
        {selected ? (
          <>
            <Avatar name={selected.name} size="sm" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {selected.name}
              </Text>
              {selected.jerseyNumber && (
                <Text className="text-[10px] text-muted">#{selected.jerseyNumber}</Text>
              )}
            </View>
            {showRole && selected.role && (
              <Text className="text-sm">{ROLE_ICONS[selected.role] ?? ""}</Text>
            )}
          </>
        ) : (
          <Text className="text-sm text-muted flex-1">{placeholder}</Text>
        )}
        <Text className="text-muted text-xs">▼</Text>
      </TouchableOpacity>

      {/* Selection modal */}
      {open && (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <TouchableOpacity
            className="flex-1 justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <GlassCard intensity="high" padding="md" radius="xl" className="max-h-[70%]" blurAmount={30}>
                <Text className="text-base font-bold text-foreground mb-2 px-2">
                  {label ?? "Select Player"}
                </Text>

                <View className="px-2 pb-2">
                  <TextInput
                    className="text-sm text-foreground bg-white/30 dark:bg-white/[0.05] rounded-xl px-3 py-2.5 border border-white/30 dark:border-white/10"
                    placeholder="Search players..."
                    placeholderTextColor="rgba(128,128,128,0.6)"
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                  />
                </View>

                <ScrollView className="max-h-80">
                  {filtered.map((player) => (
                    <TouchableOpacity
                      key={player.id}
                      className={cn(
                        "flex-row items-center gap-3 px-3 py-2.5 rounded-xl",
                        player.id === value && "bg-[#0066FF]/10",
                      )}
                      onPress={() => {
                        onSelect(player);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Avatar name={player.name} size="sm" />
                      <View className="flex-1">
                        <Text
                          className={cn(
                            "text-sm font-semibold",
                            player.id === value ? "text-[#0066FF]" : "text-foreground",
                          )}
                        >
                          {player.name}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          {player.jerseyNumber && (
                            <Text className="text-[10px] text-muted">#{player.jerseyNumber}</Text>
                          )}
                          {player.isCaptain && <Text className="text-[10px] text-[#FF9F0A]">👑 C</Text>}
                          {player.isKeeper && <Text className="text-[10px] text-[#0066FF]">🧤 WK</Text>}
                        </View>
                      </View>
                      {showRole && player.role && (
                        <Text className="text-base">{ROLE_ICONS[player.role]}</Text>
                      )}
                      {player.id === value && (
                        <Text className="text-[#0066FF] font-bold">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {filtered.length === 0 && (
                    <View className="py-8 items-center">
                      <Text className="text-sm text-muted">No players found</Text>
                    </View>
                  )}
                </ScrollView>
              </GlassCard>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

export default PlayerSelector;
