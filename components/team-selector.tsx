/**
 * TeamSelector — Selection component for picking a team with search and accent colors.
 *
 * Design: Glass modal with team color swatch, logo preview, and search filtering.
 * Used in match creation and league management.
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar } from "@/components/ui/avatar";

export interface TeamItem {
  id: string;
  name: string;
  shortName?: string;
  color?: string;
  logoUrl?: string | null;
  homeGround?: string;
}

interface TeamSelectorProps {
  /** List of available teams */
  teams: TeamItem[];
  /** Currently selected team ID */
  value?: string;
  /** Called when a team is selected */
  onSelect: (team: TeamItem) => void;
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Label above the selector */
  label?: string;
  /** Whether to show team color swatch */
  showColor?: boolean;
  /** Whether to show home ground info */
  showGround?: boolean;
  /** Additional styling */
  className?: string;
}

export function TeamSelector({
  teams,
  value,
  onSelect,
  placeholder = "Select team...",
  label,
  showColor = true,
  showGround = false,
  className,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = teams.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.shortName?.toLowerCase().includes(q) ?? false) ||
      (t.homeGround?.toLowerCase().includes(q) ?? false)
    );
  });

  const selected = teams.find((t) => t.id === value);

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
            {showColor && (
              <View
                className="w-5 h-5 rounded-full border border-white/30"
                style={{ backgroundColor: selected.color || "#0066FF" }}
              />
            )}
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {selected.shortName ? `${selected.name} (${selected.shortName})` : selected.name}
              </Text>
              {showGround && selected.homeGround && (
                <Text className="text-[10px] text-muted">🏟️ {selected.homeGround}</Text>
              )}
            </View>
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
                  {label ?? "Select Team"}
                </Text>

                <View className="px-2 pb-2">
                  <TextInput
                    className="text-sm text-foreground bg-white/30 dark:bg-white/[0.05] rounded-xl px-3 py-2.5 border border-white/30 dark:border-white/10"
                    placeholder="Search teams..."
                    placeholderTextColor="rgba(128,128,128,0.6)"
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                  />
                </View>

                <ScrollView className="max-h-80">
                  {filtered.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      className={cn(
                        "flex-row items-center gap-3 px-3 py-2.5 rounded-xl",
                        team.id === value && "bg-[#0066FF]/10",
                      )}
                      onPress={() => {
                        onSelect(team);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      {team.logoUrl ? (
                        <Avatar name={team.name} size="sm" source={{ uri: team.logoUrl }} />
                      ) : (
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: (team.color || "#0066FF") + "20" }}
                        >
                          <Text className="text-xs font-bold" style={{ color: team.color || "#0066FF" }}>
                            {team.shortName?.[0] ?? team.name[0]}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text
                          className={cn(
                            "text-sm font-semibold",
                            team.id === value ? "text-[#0066FF]" : "text-foreground",
                          )}
                        >
                          {team.name}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          {team.shortName && (
                            <Text className="text-[10px] text-muted">{team.shortName}</Text>
                          )}
                          {showGround && team.homeGround && (
                            <Text className="text-[10px] text-muted">🏟️ {team.homeGround}</Text>
                          )}
                        </View>
                      </View>
                      {showColor && (
                        <View
                          className="w-3 h-3 rounded-full border border-white/30"
                          style={{ backgroundColor: team.color || "#0066FF" }}
                        />
                      )}
                      {team.id === value && (
                        <Text className="text-[#0066FF] font-bold">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {filtered.length === 0 && (
                    <View className="py-8 items-center">
                      <Text className="text-sm text-muted">No teams found</Text>
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

export default TeamSelector;
