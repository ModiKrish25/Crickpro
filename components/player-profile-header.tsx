import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

type PlayerRole = "batsman" | "bowler" | "all-rounder";

const ROLE_ORDER: PlayerRole[] = ["batsman", "bowler", "all-rounder"];

const ROLE_LABELS: Record<PlayerRole, string> = {
  batsman: "Batsman",
  bowler: "Bowler",
  "all-rounder": "All-Rounder",
};

export interface PlayerProfileHeaderProps {
  playerName: string;
  role: "batsman" | "bowler" | "all-rounder";
  teamName: string;
  jerseyNumber: number;
  matchesPlayed: number;
  onNameSave?: (newName: string) => void;
  onRoleSave?: (newRole: PlayerRole) => void;
  onJerseySave?: (newJersey: number) => void;
}

/**
 * Player Profile Header - Premium glass design
 * Supports inline editing of player name, role, and jersey number.
 */
export function PlayerProfileHeader({
  playerName,
  role,
  teamName,
  jerseyNumber,
  matchesPlayed,
  onNameSave,
  onRoleSave,
  onJerseySave,
}: PlayerProfileHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(playerName);

  const [isEditingJersey, setIsEditingJersey] = useState(false);
  const [editJersey, setEditJersey] = useState(String(jerseyNumber));

  // Name editing
  const handleStartEditingName = () => {
    setEditName(playerName);
    setIsEditingName(true);
  };

  const handleFinishEditingName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== playerName) {
      onNameSave?.(trimmed);
    }
    setIsEditingName(false);
  };

  // Role cycling
  const handleRoleCycle = () => {
    const currentIndex = ROLE_ORDER.indexOf(role);
    const nextRole = ROLE_ORDER[(currentIndex + 1) % ROLE_ORDER.length];
    if (nextRole !== role) {
      onRoleSave?.(nextRole);
    }
  };

  // Jersey editing
  const handleStartEditingJersey = () => {
    setEditJersey(String(jerseyNumber));
    setIsEditingJersey(true);
  };

  const handleFinishEditingJersey = () => {
    const parsed = parseInt(editJersey, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed !== jerseyNumber) {
      onJerseySave?.(parsed);
    }
    setIsEditingJersey(false);
  };

  return (
    <View className="p-6 gap-4" style={{ backgroundColor: "#0066FF" }}>
      <View className="flex-row items-end gap-4">
        {/* Jersey Number - tappable to edit */}
        <TouchableOpacity
          onPress={handleStartEditingJersey}
          activeOpacity={0.6}
          className="w-16"
        >
          {isEditingJersey ? (
            <TextInput
              className="w-16 h-16 rounded-full bg-white/20 items-center justify-center text-center text-2xl font-bold text-white px-0 py-0"
              value={editJersey}
              onChangeText={setEditJersey}
              onBlur={handleFinishEditingJersey}
              onSubmitEditing={handleFinishEditingJersey}
              placeholderTextColor="rgba(255,255,255,0.5)"
              placeholder="#"
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="done"
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-2xl font-bold text-white">{jerseyNumber}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name + Team */}
        <View className="flex-1">
          {isEditingName ? (
            <TextInput
              className="text-3xl font-bold text-white tracking-tight bg-white/15 rounded-lg px-3 py-1 -ml-3 -mb-1"
              value={editName}
              onChangeText={setEditName}
              onBlur={handleFinishEditingName}
              onSubmitEditing={handleFinishEditingName}
              placeholderTextColor="rgba(255,255,255,0.5)"
              placeholder="Player name"
              maxLength={50}
              returnKeyType="done"
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity onPress={handleStartEditingName} activeOpacity={0.6}>
              <Text className="text-3xl font-bold text-white tracking-tight">
                {playerName}
              </Text>
            </TouchableOpacity>
          )}
          <Text className="text-sm text-white/70">{teamName}</Text>
        </View>
      </View>

      {/* Role + Matches row */}
      <View className="flex-row gap-4">
        <TouchableOpacity
          className="flex-1"
          onPress={handleRoleCycle}
          activeOpacity={0.6}
        >
          <Text className="text-xs text-white/60">Role (tap to cycle)</Text>
          <Text className="text-lg font-semibold text-white capitalize">
            {ROLE_LABELS[role]}
          </Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xs text-white/60">Matches</Text>
          <Text className="text-lg font-semibold text-white">{matchesPlayed}</Text>
        </View>
      </View>
    </View>
  );
}
