/**
 * FullScorecardView — Ultra-Premium Cricbuzz / CricHeroes Style Dark Scorecard
 * 
 * Features:
 * - Pitch Dark Emerald Palette (#050B08 background, #0B1511 glass cards, #10B981 mint green accents)
 * - Collapsible Innings Accordion Cards (Team 1 & Team 2 scores)
 * - Batters Table with dismissal info under player name (R, B, 4s, 6s, SR, Min)
 * - Extras breakdown line & Total line
 * - To Bat list for unbatted squad members
 * - Bowlers Table with overs, maidens, runs, wickets & economy
 * - Fall of Wickets numbered list with score and over
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import type { InningsState, MatchState } from "@/lib/cricket/advanced-rules-engine";

export interface FullScorecardViewProps {
  matchState: MatchState;
  onClose?: () => void;
}

export function FullScorecardView({ matchState, onClose }: FullScorecardViewProps) {
  const [expandedInnings, setExpandedInnings] = useState<number>(1);

  const formatOvers = (balls: number, ballsPerOver = 6): string => {
    const ov = Math.floor(balls / ballsPerOver);
    const b = balls % ballsPerOver;
    return `${ov}.${b}`;
  };

  return (
    <ScrollView className="flex-1 bg-[#050B08] p-4" showsVerticalScrollIndicator={false}>
      {/* Header Tabs Navigation */}
      <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-[#10B981]/20">
        <View className="flex-row items-center gap-4">
          <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Info</Text>
          <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Summary</Text>
          <View className="border-b-2 border-[#10B981] pb-1">
            <Text className="text-xs font-black text-[#10B981] uppercase tracking-widest">Scorecard</Text>
          </View>
          <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Insights</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} className="bg-[#10B981]/20 px-3 py-1 rounded-lg">
            <Text className="text-xs font-bold text-[#10B981]">Close ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Innings Accordions */}
      {matchState.innings.map((inns, idx) => {
        const inningsNumber = idx + 1;
        const isExpanded = expandedInnings === inningsNumber;
        const isTeam1 = inningsNumber === 1;
        const teamName = inns.battingTeam;
        const oversStr = formatOvers(inns.totalBalls, matchState.ballsPerOver);

        // Calculate Extras Breakdown
        const wideRuns = inns.deliveries.filter(d => (d.extraType as any) === "wide").reduce((a, d) => a + (d.extraRuns || 1), 0);
        const noBallRuns = inns.deliveries.filter(d => (d.extraType as any) === "no_ball" || (d.extraType as any) === "no-ball").reduce((a, d) => a + 1, 0);
        const legByeRuns = inns.deliveries.filter(d => (d.extraType as any) === "leg_bye" || (d.extraType as any) === "leg-bye").reduce((a, d) => a + (d.extraRuns || 1), 0);
        const byeRuns = inns.deliveries.filter(d => (d.extraType as any) === "bye").reduce((a, d) => a + (d.extraRuns || 1), 0);
        const totalExtras = wideRuns + noBallRuns + legByeRuns + byeRuns;

        // Unbatted players
        const toBatPlayers = inns.battingOrder.filter(b => !b.isOut && b.status !== "batting" && b.ballsFaced === 0);

        return (
          <View key={`inns-${inningsNumber}`} className="mb-4">
            {/* Accordion Bar Header */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setExpandedInnings(isExpanded ? 0 : inningsNumber)}
              className="bg-[#0B1511] border border-[#10B981]/30 rounded-2xl px-4 py-3 flex-row items-center justify-between shadow-lg"
            >
              <Text className="text-base font-black text-white">{teamName}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-black text-[#10B981]">
                  {inns.totalRuns}/{inns.totalWickets} <Text className="text-xs text-slate-400 font-bold">({oversStr} Ov)</Text>
                </Text>
                <Text className="text-sm text-[#10B981] font-bold">{isExpanded ? "▲" : "▼"}</Text>
              </View>
            </TouchableOpacity>

            {/* Accordion Body Content */}
            {isExpanded && (
              <GlassCard intensity="heavy" radius="xl" padding="none" className="bg-[#0B1511] border-[#10B981]/20 mt-2 overflow-hidden">
                
                {/* Batters Table Header */}
                <View className="flex-row items-center px-4 py-2 bg-[#060D0A] border-b border-white/10">
                  <Text className="flex-1 text-[11px] font-black text-slate-400 uppercase">Batters</Text>
                  <Text className="w-8 text-right text-[11px] font-black text-slate-400">R</Text>
                  <Text className="w-8 text-right text-[11px] font-black text-slate-400">B</Text>
                  <Text className="w-7 text-right text-[11px] font-black text-slate-400">4s</Text>
                  <Text className="w-7 text-right text-[11px] font-black text-slate-400">6s</Text>
                  <Text className="w-12 text-right text-[11px] font-black text-slate-400">SR</Text>
                  <Text className="w-9 text-right text-[11px] font-black text-slate-400">Min</Text>
                </View>

                {/* Batters List */}
                <View className="px-4 py-1">
                  {inns.battingOrder.map((b) => {
                    const sr = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : "0.0";
                    const dismissalStr = b.isOut
                      ? (b.dismissalFielder ? `c ${b.dismissalFielder} b ${b.dismissalBowler || ""}` : b.dismissalType || "out")
                      : b.status === "batting"
                        ? "not out *"
                        : "not out";

                    return (
                      <View key={b.name} className="py-2.5 border-b border-white/5">
                        <View className="flex-row items-center">
                          <Text className="flex-1 text-sm font-extrabold text-[#10B981]" numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text className="w-8 text-right text-sm font-black text-white">{b.runs}</Text>
                          <Text className="w-8 text-right text-xs font-semibold text-slate-300">{b.ballsFaced}</Text>
                          <Text className="w-7 text-right text-xs font-semibold text-slate-400">{b.fours}</Text>
                          <Text className="w-7 text-right text-xs font-semibold text-slate-400">{b.sixes}</Text>
                          <Text className="w-12 text-right text-xs font-bold text-white">{sr}</Text>
                          <Text className="w-9 text-right text-xs font-semibold text-slate-400">{Math.max(1, Math.round(b.ballsFaced * 1.5))}</Text>
                        </View>
                        {/* Dismissal Description */}
                        <Text className="text-[10px] font-medium text-slate-400 mt-0.5" numberOfLines={1}>
                          {dismissalStr}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Extras & Total Lines */}
                <View className="px-4 py-3 bg-[#060D0A] border-t border-white/10 gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-300">Extras</Text>
                    <Text className="text-xs font-black text-white">
                      {totalExtras} <Text className="text-[10px] font-normal text-slate-400">(wd {wideRuns}, lb {legByeRuns}, nb {noBallRuns}, b {byeRuns})</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between pt-1 border-t border-white/10">
                    <Text className="text-sm font-black text-white">Total</Text>
                    <Text className="text-sm font-black text-[#10B981]">
                      {inns.totalRuns}/{inns.totalWickets} <Text className="text-xs text-slate-300">({oversStr} Ov)</Text> <Text className="text-xs text-amber-300 ml-2">RR {inns.totalBalls > 0 ? ((inns.totalRuns / inns.totalBalls) * matchState.ballsPerOver).toFixed(2) : "0.00"}</Text>
                    </Text>
                  </View>
                </View>

                {/* To Bat Section */}
                {toBatPlayers.length > 0 && (
                  <View className="px-4 py-2.5 border-t border-white/10 bg-[#0B1511]">
                    <Text className="text-[11px] font-bold text-slate-400">
                      <Text className="font-black text-white">To bat: </Text>
                      {toBatPlayers.map(b => b.name).join(", ")}
                    </Text>
                  </View>
                )}

                {/* Bowlers Table Header */}
                <View className="flex-row items-center px-4 py-2 bg-[#060D0A] border-t border-b border-white/10 mt-2">
                  <Text className="flex-1 text-[11px] font-black text-slate-400 uppercase">Bowlers</Text>
                  <Text className="w-8 text-right text-[11px] font-black text-slate-400">O</Text>
                  <Text className="w-7 text-right text-[11px] font-black text-slate-400">M</Text>
                  <Text className="w-8 text-right text-[11px] font-black text-slate-400">R</Text>
                  <Text className="w-7 text-right text-[11px] font-black text-slate-400">W</Text>
                  <Text className="w-12 text-right text-[11px] font-black text-slate-400">Eco</Text>
                </View>

                {/* Bowlers List */}
                <View className="px-4 py-1">
                  {inns.bowlers.map((bw) => {
                    const bCount = (bw as any).ballsBowled ?? (bw as any).balls ?? 0;
                    const overs = formatOvers(bCount, matchState.ballsPerOver);
                    const eco = bCount > 0 ? (((bw as any).runsConceded ?? (bw as any).runs ?? 0) / bCount * matchState.ballsPerOver).toFixed(2) : "0.00";
                    return (
                      <View key={bw.name} className="flex-row items-center py-2 border-b border-white/5">
                        <Text className="flex-1 text-sm font-extrabold text-[#10B981]" numberOfLines={1}>
                          {bw.name}
                        </Text>
                        <Text className="w-8 text-right text-xs font-semibold text-slate-300">{overs}</Text>
                        <Text className="w-7 text-right text-xs font-semibold text-slate-400">{bw.maidens}</Text>
                        <Text className="w-8 text-right text-xs font-semibold text-slate-300">{bw.runsConceded}</Text>
                        <Text className="w-7 text-right text-sm font-black text-white">{bw.wickets}</Text>
                        <Text className="w-12 text-right text-xs font-bold text-slate-200">{eco}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Fall of Wickets Section */}
                {inns.fallOfWickets.length > 0 && (
                  <View className="px-4 py-3 bg-[#060D0A] border-t border-white/10 gap-2">
                    <View className="flex-row items-center justify-between pb-1 border-b border-white/10">
                      <Text className="text-[11px] font-black text-slate-400 uppercase">Fall of Wickets</Text>
                      <Text className="text-[11px] font-black text-slate-400 uppercase">Score(Over)</Text>
                    </View>

                    {inns.fallOfWickets.map((fow) => (
                      <View key={`fow-${fow.wicketNumber}`} className="flex-row items-center justify-between py-1">
                        <View className="flex-row items-center gap-2 flex-1 mr-2">
                          <Text className="text-xs font-black text-[#10B981]">{fow.wicketNumber}</Text>
                          <Text className="text-xs font-bold text-white" numberOfLines={1}>{fow.batterName}</Text>
                        </View>
                        <Text className="text-xs font-black text-slate-200">
                          {fow.runsAtDismissal} <Text className="text-[10px] font-semibold text-slate-400">({fow.oversAtDismissal}.{fow.ballsAtDismissal} Ov)</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

              </GlassCard>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
