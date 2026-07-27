/**
 * Commentary Feed - Ball-by-ball live commentary component
 * 
 * Displays a live feed of ball-by-ball commentary for the current match.
 * Shows each delivery with batter, bowler, runs, and key moments.
 * Supports filtering by over and auto-scrolling to latest ball.
 * 
 * Design: Premium glassmorphism with timeline-style layout
 */
import { useRef, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";
import type { BallRecord } from "@/lib/cricket/advanced-rules-engine";

export interface CommentaryEntry {
  overNumber: number;
  ballNumber: number;
  batterOnStrike: string;
  batterNonStrike: string;
  bowler: string;
  runsOffBat: number;
  extraType: string;
  extraRuns: number;
  totalRuns: number;
  isWicket: boolean;
  dismissalType?: string;
  batterOut?: string;
  fielderInvolved?: string;
  isFreeHit: boolean;
  isLegal: boolean;
  commentary: string;
  timestamp: number;
  cumulativeScore: string;
  cumulativeWickets: number;
  cumulativeOvers: string;
}

interface CommentaryFeedProps {
  entries: CommentaryEntry[];
  compact?: boolean;
  maxEntries?: number;
  autoScroll?: boolean;
  battingTeamName?: string;
  bowlingTeamName?: string;
}

function buildCommentary(ball: BallRecord): string {
  const parts: string[] = [];

  if (ball.isFreeHit) parts.push("Free Hit:");

  if (ball.extraType === "wide") {
    if (ball.runsOffBat > 0) {
      parts.push(`${ball.bowler} to ${ball.batterOnStrike}, wide, ${ball.batterOnStrike} slices it for ${ball.runsOffBat} run${ball.runsOffBat > 1 ? 's' : ''}!`);
    } else {
      parts.push(`${ball.bowler} to ${ball.batterOnStrike}, wide ball, called wide.`);
    }
  } else if (ball.extraType === "no_ball") {
    if (ball.runsOffBat > 0) {
      parts.push(`${ball.bowler} to ${ball.batterOnStrike}, no-ball! Free hit coming up. ${ball.batterOnStrike} smashes it for ${ball.runsOffBat} run${ball.runsOffBat > 1 ? 's' : ''}!`);
    } else {
      parts.push(`${ball.bowler} to ${ball.batterOnStrike}, no-ball called. Free hit next delivery.`);
    }
  } else if (ball.isWicket) {
    const typeLabel = ball.dismissalType?.replace(/_/g, " ") || "dismissed";
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, WICKET! ${ball.batterOut || ball.batterOnStrike} is ${typeLabel}.`);
    if (ball.fielderInvolved) {
      parts.push(`Fielder: ${ball.fielderInvolved}.`);
    }
  } else if (ball.totalRunsFromBall === 0) {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, no run, dot ball. Good bowling.`);
  } else if (ball.runsOffBat === 4) {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, FOUR! ${ball.batterOnStrike} cracks it through the gap and finds the boundary!`);
  } else if (ball.runsOffBat === 6) {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, SIX! ${ball.batterOnStrike} launches it over the ropes for a maximum!`);
  } else if (ball.extraType === "bye") {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, ${ball.totalRunsFromBall} bye${ball.totalRunsFromBall > 1 ? 's' : ''}, misses the bat and the keeper.`);
  } else if (ball.extraType === "leg_bye") {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, ${ball.totalRunsFromBall} leg bye${ball.totalRunsFromBall > 1 ? 's' : ''}, off the pads.`);
  } else if (ball.runsOffBat === 1) {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, ${ball.batterOnStrike} pushes it for a single.`);
  } else if (ball.runsOffBat === 2) {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, ${ball.batterOnStrike} tucks it away for two runs. Good running.`);
  } else if (ball.runsOffBat === 3) {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, ${ball.batterOnStrike} works it for three runs. Excellent running between the wickets.`);
  } else {
    parts.push(`${ball.bowler} to ${ball.batterOnStrike}, ${ball.runsOffBat} run${ball.runsOffBat > 1 ? 's' : ''}.`);
  }

  return parts.join(" ");
}

export function buildCommentaryFromBall(
  ball: BallRecord,
  cumulativeScore: number,
  cumulativeWickets: number,
  cumulativeOvers: string,
): CommentaryEntry {
  return {
    overNumber: ball.overNumber + 1,
    ballNumber: ball.ballNumberInOver,
    batterOnStrike: ball.batterOnStrike,
    batterNonStrike: ball.batterNonStrike,
    bowler: ball.bowler,
    runsOffBat: ball.runsOffBat,
    extraType: ball.extraType,
    extraRuns: ball.extraRuns,
    totalRuns: ball.totalRunsFromBall,
    isWicket: ball.isWicket,
    dismissalType: ball.dismissalType,
    batterOut: ball.batterOut,
    fielderInvolved: ball.fielderInvolved,
    isFreeHit: ball.isFreeHit,
    isLegal: ball.isLegal,
    commentary: buildCommentary(ball),
    timestamp: ball.timestamp,
    cumulativeScore: `${cumulativeScore}`,
    cumulativeWickets,
    cumulativeOvers,
  };
}

function getBallStyle(totalRuns: number, isWicket: boolean): string {
  if (isWicket) return "bg-[#FF3B30]";
  if (totalRuns >= 6) return "bg-[#34C759]";
  if (totalRuns === 4) return "bg-[#0066FF]";
  if (totalRuns === 0) return "bg-[#86868B]";
  return "bg-[#FF9F0A]";
}

function getBallLabel(totalRuns: number, isWicket: boolean, isExtra: boolean, extraType: string): string {
  if (isWicket) return "W";
  if (isExtra) {
    if (extraType === "wide") return "WD";
    if (extraType === "no_ball") return "NB";
    if (extraType === "bye") return "B";
    if (extraType === "leg_bye") return "LB";
    return "EXT";
  }
  if (totalRuns === 0) return "•";
  return String(totalRuns);
}

export function CommentaryFeed({
  entries,
  compact = false,
  maxEntries = 50,
  autoScroll = true,
  battingTeamName,
  bowlingTeamName,
}: CommentaryFeedProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const scrollRef = useRef<ScrollView>(null);
  const [filterOver, setFilterOver] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let items = entries.slice(-maxEntries);
    if (filterOver !== null) {
      items = items.filter(e => e.overNumber === filterOver);
    }
    return items;
  }, [entries, filterOver, maxEntries]);

  const uniqueOvers = useMemo(() => {
    const overs = new Set(entries.map(e => e.overNumber));
    return Array.from(overs).sort((a, b) => b - a);
  }, [entries]);

  const handleFilterPress = useCallback((over: number | null) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterOver(over);
  }, []);

  if (compact) {
    // Compact view: just show the last N deliveries as a horizontal strip
    const recent = entries.slice(-6).reverse();
    return (
      <View className="flex-row gap-1.5 items-center py-1">
        {recent.map((entry, idx) => (
          <View
            key={`${entry.timestamp}-${idx}`}
            className={`w-8 h-8 rounded-full items-center justify-center ${getBallStyle(entry.totalRuns, entry.isWicket)}`}
          >
            <Text className="text-[10px] font-bold text-white">
              {getBallLabel(entry.totalRuns, entry.isWicket, entry.extraType !== "none", entry.extraType)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-white/10 dark:border-white/[0.06]">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-foreground tracking-tight">🎙️ Commentary</Text>
          <View className="bg-[#0066FF]/10 rounded-full px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-[#0066FF]">{entries.length} balls</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilters(!showFilters);
          }}
          className="bg-white/50 dark:bg-white/[0.08] rounded-full px-3 py-1.5"
        >
          <Text className="text-[10px] font-semibold text-foreground">
            {showFilters ? "Hide Filters" : filterOver ? `Over ${filterOver} ▾` : "All Overs ▾"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Over filters */}
      {showFilters && (
        <View className="px-4 py-2 flex-row flex-wrap gap-1.5 border-b border-white/10 dark:border-white/[0.06]">
          <TouchableOpacity
            className={`rounded-full px-3 py-1.5 ${filterOver === null ? "bg-[#0066FF]" : "bg-white/50 dark:bg-white/[0.08]"}`}
            onPress={() => handleFilterPress(null)}
          >
            <Text className={`text-[10px] font-semibold ${filterOver === null ? "text-white" : "text-foreground"}`}>All</Text>
          </TouchableOpacity>
          {uniqueOvers.map(over => (
            <TouchableOpacity
              key={over}
              className={`rounded-full px-3 py-1.5 ${filterOver === over ? "bg-[#0066FF]" : "bg-white/50 dark:bg-white/[0.08]"}`}
              onPress={() => handleFilterPress(over)}
            >
              <Text className={`text-[10px] font-semibold ${filterOver === over ? "text-white" : "text-foreground"}`}>
                Over {over}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Commentary list */}
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: compact ? 200 : 400 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => autoScroll && scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {filtered.length === 0 ? (
          <View className="py-8 items-center gap-2">
            <Text className="text-2xl">🎙️</Text>
            <Text className="text-sm text-muted">No deliveries yet</Text>
            <Text className="text-xs text-muted">Start scoring to see ball-by-ball commentary</Text>
          </View>
        ) : (
          <View className="px-4 py-2 gap-1">
            {filtered.map((entry, idx) => {
              const isFirstInOver = entry.ballNumber === 1;
              return (
                <View key={`${entry.timestamp}-${idx}`} className="flex-row gap-3 py-2.5">
                  {/* Timeline dot + line */}
                  <View className="items-center" style={{ width: 28 }}>
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${getBallStyle(entry.totalRuns, entry.isWicket)}`}
                    >
                      <Text className="text-[9px] font-bold text-white">
                        {getBallLabel(entry.totalRuns, entry.isWicket, entry.extraType !== "none", entry.extraType)}
                      </Text>
                    </View>
                    {idx < filtered.length - 1 && (
                      <View
                        className="w-px flex-1 mt-1"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                      />
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    {isFirstInOver && (
                      <Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
                        Over {entry.overNumber}
                      </Text>
                    )}
                    <Text className="text-xs text-foreground leading-5">{entry.commentary}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-[9px] font-semibold text-[#0066FF]">
                        Score: {entry.cumulativeScore}/{entry.cumulativeWickets} ({entry.cumulativeOvers})
                      </Text>
                      <Text className="text-[9px] text-muted">
                        {entry.batterNonStrike} (non-strike)
                      </Text>
                    </View>
                    {entry.isFreeHit && (
                      <View className="bg-[#FF9F0A]/10 rounded-md px-2 py-0.5 mt-1 self-start">
                        <Text className="text-[9px] font-bold text-[#FF9F0A]">⚠️ Free Hit</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {entries.length > maxEntries && (
        <View className="px-4 py-2 border-t border-white/10 dark:border-white/[0.06] items-center">
          <Text className="text-[10px] text-muted">
            Showing last {maxEntries} of {entries.length} deliveries
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

export default CommentaryFeed;
