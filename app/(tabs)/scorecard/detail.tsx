/**
 * Scorecard Detail View — Full innings-by-innings match breakdown
 *
 * Displays a comprehensive match summary for completed matches:
 * - Match result header with team scores
 * - Toss and match info
 * - Innings 1 & 2 batting order with player stats
 * - Full bowling figures
 * - Fall of wickets timeline
 * - Extras breakdown
 */
import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/glass-card";
import { useThemeContext } from "@/lib/theme-provider";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { matchStore } from "@/lib/stores/match-store";
import type { InningsState, Partnership, BallRecord } from "@/lib/cricket/advanced-rules-engine";
import { DISMISSAL_CREDITED_TO_BOWLER } from "@/lib/cricket/advanced-rules-engine";

type DetailData = {
  matchState: any;
  summary: {
    id: string;
    team1: string;
    team2: string;
    format: string;
    status: string;
    score1?: string;
    score2?: string;
    overs?: string;
    result?: string;
    tossInfo?: string;
    venue?: string;
    date?: string;
    team1Captain?: string;
    team1Keeper?: string;
    team2Captain?: string;
    team2Keeper?: string;
    team1Lineup?: string[];
    team2Lineup?: string[];
  };
};

type FoWShape = {
  wicketNumber: number;
  batterName: string;
  dismissalType: string;
  runsAtDismissal: number;
  oversAtDismissal: number;
  ballsAtDismissal: number;
  fielderInvolved?: string;
  bowlerAtDelivery?: string;
};

export default function ScorecardDetailScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const [data, setData] = useState<DetailData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (matchId) {
      const details = matchStore.getMatchDetails(matchId);
      if (details) {
        setData(details as DetailData);
      } else {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [matchId]);

  const handleBack = useCallback(async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  if (!data) {
    return (
      <ScreenContainer className="px-4 pt-2" gradient glass>
        <View className="flex-1 items-center justify-center gap-4">
          <TouchableOpacity onPress={handleBack} className="mb-4">
            <Text className="text-[#0066FF] font-semibold">← Back to Scorecard</Text>
          </TouchableOpacity>
          <Text className="text-muted text-lg">
            {notFound ? "Match details not found" : "Loading match details..."}
          </Text>
          {notFound && (
            <TouchableOpacity
              className="bg-[#0066FF] rounded-full px-6 py-3 mt-4"
              onPress={handleBack}
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenContainer>
    );
  }

  const { matchState, summary } = data;
  const innings1: InningsState | undefined = matchState?.innings?.[0];
  const innings2: InningsState | undefined = matchState?.innings?.[1];
  const ballsPerOver = matchState?.ballsPerOver || 6;

  const formatOvers = (totalBalls: number) => {
    const completed = Math.floor(totalBalls / ballsPerOver);
    const balls = totalBalls % ballsPerOver;
    return `${completed}.${balls}`;
  };

  const getScoreStr = (inn: InningsState | undefined) => {
    if (!inn) return "—";
    return `${inn.totalRuns}/${inn.totalWickets} (${formatOvers(inn.totalBalls)} ov)`;
  };

  return (
    <ScreenContainer className="px-0 pt-0" gradient glass>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== RESULT HEADER ===== */}
        <View
          className="px-5 pt-14 pb-6 gap-2"
          style={{ backgroundColor: isDark ? "#0D1B2A" : "#0066FF" }}
        >
          <TouchableOpacity onPress={handleBack} className="mb-2">
            <Text className="text-white/70 font-semibold">← Back to Scorecard</Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-semibold">{summary.team1}</Text>
              <Text className="text-white text-4xl font-bold tracking-tight mt-1">
                {getScoreStr(innings1)}
              </Text>
            </View>
            <View className="items-center px-4">
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                <Text className="text-white font-bold text-xs">VS</Text>
              </View>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-white/80 text-sm font-semibold">{summary.team2}</Text>
              <Text className="text-white text-4xl font-bold tracking-tight mt-1">
                {getScoreStr(innings2)}
              </Text>
            </View>
          </View>

          {/* Result banner */}
          {summary.result && (
            <View className="bg-white/15 rounded-2xl px-4 py-3 mt-2">
              <Text className="text-white font-bold text-lg text-center">
                {summary.result}
              </Text>
            </View>
          )}

          {/* Match info chips */}
          <View className="flex-row flex-wrap gap-2 mt-1">
            <View className="bg-white/10 rounded-full px-3 py-1">
              <Text className="text-[11px] font-semibold text-white/90">{summary.format}</Text>
            </View>
            {summary.tossInfo && (
              <View className="bg-white/10 rounded-full px-3 py-1">
                <Text className="text-[11px] font-semibold text-white/90">{summary.tossInfo}</Text>
              </View>
            )}
            {summary.venue && (
              <View className="bg-white/10 rounded-full px-3 py-1">
                <Text className="text-[11px] font-semibold text-white/90">📍 {summary.venue}</Text>
              </View>
            )}
            {summary.date && (
              <View className="bg-white/10 rounded-full px-3 py-1">
                <Text className="text-[11px] font-semibold text-white/90">📅 {summary.date}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ===== INNINGS 1 DETAILS ===== */}
        {innings1 && (
          <View className="px-4 mt-4 gap-3">
            <Text className="text-lg font-bold text-foreground tracking-tight">
              🏏 1st Innings — {innings1.battingTeam}
            </Text>
            <InningsBattingCard innings={innings1} ballsPerOver={ballsPerOver} staggerIndex={0} />
            <InningsBowlingCard innings={innings1} ballsPerOver={ballsPerOver} staggerIndex={1} />
            {innings1.partnershipHistory.length > 0 && (
              <PartnershipHistoryCard partnerships={innings1.partnershipHistory} ballsPerOver={ballsPerOver} staggerIndex={2} />
            )}
            {innings1.deliveries.length > 0 && (
              <OverByOverChart deliveries={innings1.deliveries} ballsPerOver={ballsPerOver} staggerIndex={3} />
            )}
            {innings1.fallOfWickets.length > 0 && (
              <FallOfWicketsCard wickets={innings1.fallOfWickets as unknown as FoWShape[]} ballsPerOver={ballsPerOver} staggerIndex={4} />
            )}
            <ExtrasBreakdownCard extras={innings1.extras} staggerIndex={5} />
          </View>
        )}

        {/* ===== INNINGS 2 DETAILS ===== */}
        {innings2 && (
          <View className="px-4 mt-5 gap-3">
            <View className="h-px bg-border mx-1 mb-1" />
            <Text className="text-lg font-bold text-foreground tracking-tight">
              ⚾ 2nd Innings — {innings2.battingTeam}
            </Text>
            <InningsBattingCard innings={innings2} ballsPerOver={ballsPerOver} staggerIndex={4} />
            <InningsBowlingCard innings={innings2} ballsPerOver={ballsPerOver} staggerIndex={5} />
            {innings2.partnershipHistory.length > 0 && (
              <PartnershipHistoryCard partnerships={innings2.partnershipHistory} ballsPerOver={ballsPerOver} staggerIndex={6} />
            )}
            {innings2.deliveries.length > 0 && (
              <OverByOverChart deliveries={innings2.deliveries} ballsPerOver={ballsPerOver} staggerIndex={7} />
            )}
            {innings2.fallOfWickets.length > 0 && (
              <FallOfWicketsCard wickets={innings2.fallOfWickets as unknown as FoWShape[]} ballsPerOver={ballsPerOver} staggerIndex={8} />
            )}
            <ExtrasBreakdownCard extras={innings2.extras} staggerIndex={9} />
          </View>
        )}

        {!innings1 && !innings2 && (
          <View className="flex-1 items-center justify-center px-4 py-20">
            <Text className="text-muted text-lg">No innings data available</Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function InningsBattingCard({
  innings,
  ballsPerOver,
  staggerIndex,
}: {
  innings: InningsState;
  ballsPerOver: number;
  staggerIndex: number;
}) {
  const batters = innings.battingOrder;
  const runRate = innings.totalBalls > 0
    ? (innings.totalRuns / (innings.totalBalls / ballsPerOver)).toFixed(2)
    : "0.00";

  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24} staggerIndex={staggerIndex}>
      <View className="bg-[#0066FF]/10 px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">🏏 Batting</Text>
        <View className="bg-[#0066FF]/10 rounded-full px-2.5 py-0.5">
          <Text className="text-[10px] font-bold text-[#0066FF]">
            Total: {innings.totalRuns}/{innings.totalWickets} • RR: {runRate}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center px-4 py-2 border-b border-border/30">
        <View className="flex-1" />
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">R</Text>
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">B</Text>
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">4s</Text>
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">6s</Text>
        <Text className="w-12 text-right text-[10px] text-muted font-semibold">SR</Text>
      </View>
      <View className="px-4 py-1">
        {batters.length > 0 ? (
          batters.map((b, idx) => {
            const sr = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : "0.0";
            const isOut = b.isOut || b.status === "out";
            return (
              <View key={idx} className={`flex-row items-center py-2 ${idx < batters.length - 1 ? "border-b border-border/10" : ""}`}>
                <View className="flex-1 flex-row items-center gap-1.5">
                  <Text className={`text-xs font-semibold ${isOut ? "text-muted" : "text-foreground"}`}>{b.name}</Text>
                  {!isOut && b.status === "batting" && (
                    <View className="bg-green-500/10 rounded px-1 py-0.5">
                      <Text className="text-[8px] font-bold text-green-600">NOT OUT</Text>
                    </View>
                  )}
                  {isOut && b.dismissalType && (
                    <Text className="text-[9px] text-muted italic">{b.dismissalType.replace(/_/g, " ")}</Text>
                  )}
                </View>
                <Text className="w-8 text-right text-sm font-bold text-foreground">{b.runs}</Text>
                <Text className="w-8 text-right text-xs text-muted">{b.ballsFaced}</Text>
                <Text className="w-8 text-right text-xs text-muted">{b.fours}</Text>
                <Text className="w-8 text-right text-xs text-muted">{b.sixes}</Text>
                <Text className="w-12 text-right text-xs font-semibold text-foreground">{sr}</Text>
              </View>
            );
          })
        ) : (
          <Text className="text-xs text-muted italic py-4 text-center">No batters recorded</Text>
        )}
      </View>
    </GlassCard>
  );
}

function InningsBowlingCard({
  innings,
  ballsPerOver,
  staggerIndex,
}: {
  innings: InningsState;
  ballsPerOver: number;
  staggerIndex: number;
}) {
  const bowlers = innings.bowlers;

  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24} staggerIndex={staggerIndex}>
      <View className="bg-[#0066FF]/10 px-4 py-3">
        <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">⚾ Bowling</Text>
      </View>
      <View className="flex-row items-center px-4 py-2 border-b border-border/30">
        <View className="flex-1" />
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">O</Text>
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">M</Text>
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">R</Text>
        <Text className="w-8 text-right text-[10px] text-muted font-semibold">W</Text>
        <Text className="w-10 text-right text-[10px] text-muted font-semibold">Econ</Text>
      </View>
      <View className="px-4 py-1">
        {bowlers.length > 0 ? (
          bowlers.map((b, idx) => {
            const oversFormatted = `${Math.floor(b.legalBalls / ballsPerOver)}.${b.legalBalls % ballsPerOver}`;
            const econ = b.legalBalls > 0 ? (b.runsConceded / (b.legalBalls / ballsPerOver)).toFixed(1) : "0.0";
            return (
              <View key={idx} className={`flex-row items-center py-2 ${idx < bowlers.length - 1 ? "border-b border-border/10" : ""}`}>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground">{b.name}</Text>
                </View>
                <Text className="w-8 text-right text-xs text-foreground">{oversFormatted}</Text>
                <Text className="w-8 text-right text-xs text-foreground">{b.maidens}</Text>
                <Text className="w-8 text-right text-xs text-foreground">{b.runsConceded}</Text>
                <Text className="w-8 text-right text-sm font-bold text-foreground">{b.wickets}</Text>
                <Text className="w-10 text-right text-xs text-foreground">{econ}</Text>
              </View>
            );
          })
        ) : (
          <Text className="text-xs text-muted italic py-4 text-center">No bowlers recorded</Text>
        )}
      </View>
    </GlassCard>
  );
}

function PartnershipHistoryCard({
  partnerships,
  ballsPerOver,
  staggerIndex,
}: {
  partnerships: Partnership[];
  ballsPerOver: number;
  staggerIndex: number;
}) {
  if (partnerships.length === 0) return null;

  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24} staggerIndex={staggerIndex}>
      <View className="px-4 py-3">
        <Text className="text-xs font-bold text-[#5E5CE6] uppercase tracking-wider mb-3">🤝 Partnerships</Text>
        {partnerships.map((p, idx) => {
          const oversFormatted = `${Math.floor(p.balls / ballsPerOver)}.${p.balls % ballsPerOver}`;
          return (
            <View key={idx} className={`py-2.5 ${idx < partnerships.length - 1 ? "border-b border-border/10" : ""}`}>
              <View className="flex-row items-center gap-2">
                {/* Batter 1 */}
                <View className="flex-1 items-start">
                  <Text className="text-xs font-semibold text-foreground">{p.batter1Name}</Text>
                </View>
                {/* Partnership badge */}
                <View className="bg-[#5E5CE6]/10 rounded-lg px-3 py-1 items-center min-w-[64px]">
                  <Text className="text-sm font-bold text-[#5E5CE6]">+{p.runs}</Text>
                  <Text className="text-[9px] text-muted">{oversFormatted} ov</Text>
                </View>
                {/* Batter 2 */}
                <View className="flex-1 items-end">
                  <Text className="text-xs font-semibold text-foreground">{p.batter2Name}</Text>
                </View>
              </View>
              {/* Stats row */}
              <View className="flex-row justify-center gap-3 mt-1.5">
                <Text className="text-[10px] text-muted">
                  <Text className="font-semibold text-foreground">{p.runs}</Text> runs
                </Text>
                <Text className="text-[10px] text-muted">
                  <Text className="font-semibold text-foreground">{p.balls}</Text> balls
                </Text>
                {p.fours > 0 && (
                  <Text className="text-[10px] text-muted">
                    <Text className="font-semibold text-[#34C759]">{p.fours}</Text> 4s
                  </Text>
                )}
                {p.sixes > 0 && (
                  <Text className="text-[10px] text-muted">
                    <Text className="font-semibold text-[#FF9F0A]">{p.sixes}</Text> 6s
                  </Text>
                )}
                <Text className="text-[10px] text-muted">
                  RR <Text className="font-semibold text-foreground">{p.runRate.toFixed(1)}</Text>
                </Text>
              </View>
              {/* Partnership consequence hint */}
              {!p.startedAtInnings && (
                <Text className="text-[9px] text-muted italic text-center mt-1 opacity-60">
                  Started at wicket fall
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

/** Compute over-by-over stats from raw ball records */
function computeOverByOver(
  deliveries: BallRecord[]
): { overNumber: number; runs: number; wickets: number }[] {
  const overMap = new Map<number, { runs: number; wickets: number }>();

  for (const ball of deliveries) {
    const over = ball.overNumber;
    const current = overMap.get(over) ?? { runs: 0, wickets: 0 };
    current.runs += ball.totalRunsFromBall;
    if (ball.isWicket) current.wickets += 1;
    overMap.set(over, current);
  }

  // Convert to sorted array using over numbers from the deliveries
  const overs = Array.from(overMap.entries())
    .map(([overNumber, data]) => ({ overNumber, ...data }))
    .sort((a, b) => a.overNumber - b.overNumber);

  return overs;
}

function OverByOverChart({
  deliveries,
  ballsPerOver,
  staggerIndex,
}: {
  deliveries: BallRecord[];
  ballsPerOver: number;
  staggerIndex: number;
}) {
  const overs = computeOverByOver(deliveries);
  const maxRuns = Math.max(1, ...overs.map((o) => o.runs));

  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24} staggerIndex={staggerIndex}>
      <View className="px-4 py-3">
        <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-3">
          📊 Over-by-Over — Runs per Over
        </Text>

        {/* Column header summary */}
        <View className="flex-row items-center justify-end mb-2 gap-2">
          <Text className="text-[9px] text-muted font-semibold uppercase tracking-wider">Runs</Text>
          <View className="w-8" />
        </View>

        {overs.map((over) => {
          const barWidth = (over.runs / maxRuns) * 100;
          const hasWicket = over.wickets > 0;
          const overLabel = over.overNumber + 1; // Display as 1-based

          return (
            <View key={over.overNumber} className="flex-row items-center py-1.5 gap-2">
              {/* Over label */}
              <View className="w-10 items-center">
                <Text className="text-[10px] font-semibold text-muted">
                  Ov {overLabel}
                </Text>
              </View>

              {/* Bar track */}
              <View className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: "rgba(0,102,255,0.06)" }}>
                <View
                  className="h-full rounded-md flex-row items-center justify-end pr-1.5"
                  style={{
                    width: `${Math.max(barWidth, hasWicket ? 8 : 4)}%`,
                    backgroundColor: hasWicket
                      ? "rgba(255,59,48,0.75)"
                      : "rgba(0,102,255,0.5)",
                  }}
                >
                  {hasWicket && (
                    <View className="w-4 h-4 rounded-full bg-white/30 items-center justify-center">
                      <Text className="text-[8px] font-bold text-white">W</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Runs count */}
              <View className="w-8 items-end">
                <Text className="text-xs font-bold text-foreground">{over.runs}</Text>
              </View>
            </View>
          );
        })}

        {/* Legend */}
        <View className="flex-row items-center gap-3 mt-2 pt-2 border-t border-border/20">
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(0,102,255,0.5)" }} />
            <Text className="text-[9px] text-muted">Normal over</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(255,59,48,0.75)" }} />
            <Text className="text-[9px] text-muted">Wicket fell</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-full bg-white/50 items-center justify-center border border-[#FF3B30]">
              <Text className="text-[7px] font-bold text-[#FF3B30]">W</Text>
            </View>
            <Text className="text-[9px] text-muted">Wicket</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

function FallOfWicketsCard({
  wickets,
  ballsPerOver,
  staggerIndex,
}: {
  wickets: FoWShape[];
  ballsPerOver: number;
  staggerIndex: number;
}) {
  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24} staggerIndex={staggerIndex}>
      <View className="px-4 py-3">
        <Text className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider mb-3">📉 Fall of Wickets</Text>
        {wickets.map((w, idx) => {
          const isCreditedToBowler = (DISMISSAL_CREDITED_TO_BOWLER as string[]).includes(w.dismissalType);
          return (
            <View key={idx} className={`flex-row items-start py-2.5 ${idx < wickets.length - 1 ? "border-b border-border/10" : ""} gap-2`}>
              <View className="w-7 h-7 rounded-full bg-[#FF3B30]/15 items-center justify-center mt-0.5">
                <Text className="text-xs font-bold text-[#FF3B30]">{w.wicketNumber}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-semibold text-foreground">{w.batterName}</Text>
                  <Text className="text-xs text-muted">{w.runsAtDismissal} runs</Text>
                </View>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Text className="text-[11px] text-muted italic capitalize">{w.dismissalType.replace(/_/g, " ")}</Text>
                  {w.bowlerAtDelivery && isCreditedToBowler && (
                    <Text className="text-[11px] text-muted">b <Text className="font-semibold text-foreground">{w.bowlerAtDelivery}</Text></Text>
                  )}
                </View>
                {w.fielderInvolved && (
                  <Text className="text-[10px] text-muted mt-0.5">✋ {w.fielderInvolved}</Text>
                )}
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-foreground">{w.runsAtDismissal}</Text>
                <View className="bg-[#FF3B30]/10 rounded px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-[#FF3B30]">{w.oversAtDismissal}.{w.ballsAtDismissal} ov</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

function ExtrasBreakdownCard({
  extras,
  staggerIndex,
}: {
  extras: { wides: number; noBalls: number; byes: number; legByes: number; penalty: number };
  staggerIndex: number;
}) {
  const total = extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;
  if (total === 0) return null;

  const extrasList = [
    { label: "Wides", value: extras.wides, color: "#FF9F0A" },
    { label: "No Balls", value: extras.noBalls, color: "#FF3B30" },
    { label: "Byes", value: extras.byes, color: "#5E5CE6" },
    { label: "Leg Byes", value: extras.legByes, color: "#34C759" },
    { label: "Penalty", value: extras.penalty, color: "#86868B" },
  ].filter((e) => e.value > 0);

  return (
    <GlassCard intensity="subtle" padding="md" radius="lg" glowColor="#FF9F0A" staggerIndex={staggerIndex}>
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold text-[#FF9F0A] uppercase tracking-wider">📋 Extras</Text>
          <Text className="text-sm font-bold text-foreground">Total: {total}</Text>
        </View>
        {extrasList.map((e) => (
          <View key={e.label} className="flex-row justify-between items-center py-0.5">
            <Text className="text-xs text-muted">{e.label}</Text>
            <Text className="text-xs font-bold text-foreground" style={{ color: e.color }}>{e.value}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
