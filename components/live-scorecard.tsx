/**
 * Live Scorecard Component
 * Comprehensive cricket scoring interface with:
 * - Real-time score display (both teams)
 * - Batter/Bowler stats panels
 * - Run rate, required run rate, projected score
 * - Powerplay indicator
 * - Free hit indicator
 * - Recent balls display
 * - Fall of wickets
 * - Full scoring controls (runs, extras, dismissals)
 * - Animations for boundaries and wickets
 */
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useResponsive } from "@/hooks/use-responsive";
import { useState, useEffect, useRef, useMemo } from "react";
import * as Haptics from "expo-haptics";

import { BoundaryCelebration } from "./animations/boundary-celebration";
import { WicketAnimation } from "./animations/wicket-animation";
import { ConfettiBurst } from "./animations/confetti-burst";
import { CelebrationPopperModal } from "./animations/celebration-popper-modal";
import type {
  BallRecord,
  FallOfWicket,
  Partnership,
  PowerplayPhase,
  MatchFormat,
} from "@/lib/cricket/advanced-rules-engine";
import { DISMISSAL_CREDITED_TO_BOWLER } from "@/lib/cricket/advanced-rules-engine";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { ChaseCalculator } from "@/components/chase-calculator";
import { CommentaryFeed, buildCommentaryFromBall } from "@/components/commentary-feed";
import { useSafeBottomPadding } from "@/hooks/use-scroll-padding";

export interface LiveScorecardProps {
  team1Name: string;
  team2Name: string;
  team1Captain?: string;
  team1Keeper?: string;
  team2Captain?: string;
  team2Keeper?: string;
  currentRuns: number;
  currentWickets: number;
  oversString: string;
  isSecondInnings: boolean;
  firstInningsScore?: string;
  striker: {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
  } | null;
  nonStriker: {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
  } | null;
  currentBowler: {
    name: string;
    overs: number;
    runs: number;
    wickets: number;
    economyRate: number;
  } | null;
  runRate: number;
  requiredRunRate?: number;
  requiredRuns?: number;
  projectedScore?: number;
  powerplayPhase: PowerplayPhase | null;
  isFreeHit: boolean;
  recentDeliveries: BallRecord[];
  battingOrder: { name: string; runs: number; balls: number; status: string }[];
  fallOfWickets: FallOfWicket[];
  bowlersFigures: { name: string; overs: number; maidens: number; runs: number; wickets: number; economy: number }[];
  /** Current partnership stats between the two batters */
  currentPartnership: Partnership | null;
  /** Name of the bowler who bowled the previous over */
  lastOverBowlerName?: string;
  onRun: (runs: number) => void;
  onExtra: (type: string, runsOffBat?: number, extraRuns?: number) => void;
  onWicket: (type: string, batterOut?: string, fielderInvolved?: string) => void;
  onChangeBowler: (bowlerName: string) => void;
  onSelectNextBatter?: (batterName: string) => void;
  onUndo: () => void;
  onEndInnings: () => void;
  onEndMatch: () => void;
  format: MatchFormat;
  tossInfo?: string;
  matchResult?: { description: string; winner?: string; margin?: string; team1Score?: string; team2Score?: string };
  /** Chase calculator data (second innings only) */
  chaseTarget?: number;
  chaseTotalLegalDeliveries?: number;
  chaseMaxOvers?: number;
  chaseBallsPerOver?: number;
  chaseIsInningsComplete?: boolean;
  chaseIsAllOut?: boolean;
}

type AnimationType = "boundary-4" | "boundary-6" | "wicket" | null;

// Dismissal options by category
const DISMISSAL_OPTIONS = [
  { type: "Bowled", icon: "🏏" },
  { type: "Caught", icon: "✋" },
  { type: "LBW", icon: "🦵" },
  { type: "Run Out", icon: "🏃" },
  { type: "Stumped", icon: "🧤" },
  { type: "Hit Wicket", icon: "💥" },
  { type: "Handled Ball", icon: "🤚" },
  { type: "Obstructing Field", icon: "🚫" },
  { type: "Hit Ball Twice", icon: "⚡" },
  { type: "Timed Out", icon: "⏰" },
];

/** Format a bowler's overs decimal (e.g. 0.1 → "0.1", 1.5 → "1.5", 4.0 → "4.0") */
const formatOvers = (overs: number): string => {
  const completed = Math.floor(overs);
  const balls = Math.round((overs % 1) * 10);
  return `${completed}.${balls}`;
};

export function LiveScorecard({
  team1Name,
  team2Name,
  team1Captain,
  team1Keeper,
  team2Captain,
  team2Keeper,
  currentRuns,
  currentWickets,
  oversString,
  isSecondInnings,
  firstInningsScore,
  striker,
  nonStriker,
  currentBowler,
  runRate,
  requiredRunRate,
  requiredRuns,
  projectedScore,
  powerplayPhase,
  isFreeHit,
  recentDeliveries,
  battingOrder,
  fallOfWickets,
  bowlersFigures,
  currentPartnership,
  lastOverBowlerName,
  onRun,
  onExtra,
  onWicket,
  onChangeBowler,
  onSelectNextBatter,
  onUndo,
  onEndInnings,
  onEndMatch,
  format,
  tossInfo,
  matchResult,
  chaseTarget,
  chaseTotalLegalDeliveries,
  chaseMaxOvers,
  chaseBallsPerOver,
  chaseIsInningsComplete,
  chaseIsAllOut,
}: LiveScorecardProps) {
  const bottomPadding = useSafeBottomPadding();
  const colors = useColors();
  const [activeAnimation, setActiveAnimation] = useState<AnimationType>(null);
  const [showDismissalPicker, setShowDismissalPicker] = useState(false);
  const [showExtrasPicker, setShowExtrasPicker] = useState(false);
  const [activeExtraType, setActiveExtraType] = useState<"wide" | "no_ball" | "bye" | "leg_bye" | null>(null);
  const [showFullScorecard, setShowFullScorecard] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);
  const [showBatterPicker, setShowBatterPicker] = useState(false);
  const [pendingDismissalType, setPendingDismissalType] = useState<string | null>(null);
  const [dismissedBatterName, setDismissedBatterName] = useState<string | null>(null);
  const [showBowlerPicker, setShowBowlerPicker] = useState(false);
  const [showNextBatterPicker, setShowNextBatterPicker] = useState(false);
  const [showFielderPicker, setShowFielderPicker] = useState(false);
  const [pendingFielderName, setPendingFielderName] = useState<string | null>(null);
  const responsive = useResponsive();

  // Auto-prompt bowler change modal when an over finishes (e.g. 1.0, 2.0, 3.0)
  const prevOversRef = useRef(oversString);
  useEffect(() => {
    if (oversString && oversString !== prevOversRef.current) {
      const isEnd = oversString.endsWith(".0") && oversString !== "0.0";
      if (isEnd && !matchResult) {
        setShowBowlerPicker(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      prevOversRef.current = oversString;
    }
  }, [oversString, matchResult]);

  // Auto-prompt Next Batter Selection Popup when a wicket falls
  const prevWicketsRef = useRef(currentWickets);
  useEffect(() => {
    if (currentWickets > prevWicketsRef.current) {
      if (!matchResult && !chaseIsAllOut) {
        setShowNextBatterPicker(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }
    prevWicketsRef.current = currentWickets;
  }, [currentWickets, matchResult, chaseIsAllOut]);

  // Build commentary entries from recent deliveries
  const commentaryEntries = useMemo(() => {
    let cumulativeScore = 0;
    let cumulativeWickets = 0;
    return recentDeliveries.slice().reverse().map((ball) => {
      cumulativeScore += ball.totalRunsFromBall;
      if (ball.isWicket) cumulativeWickets += 1;
      const overStr = `${ball.overNumber + 1}.${ball.ballNumberInOver}`;
      const entry = buildCommentaryFromBall(ball, cumulativeScore, cumulativeWickets, overStr);
      return entry;
    });
  }, [recentDeliveries]);

  const handleRunPress = async (runs: number) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(
        runs === 6 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onRun(runs);

    if (runs === 4) setActiveAnimation("boundary-4");
    if (runs === 6) setActiveAnimation("boundary-6");
  };

  const handleExtraPress = async (type: string, runsOffBat = 0, extraRuns = 1) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onExtra(type, runsOffBat, extraRuns);
    setShowExtrasPicker(false);
    setActiveExtraType(null);
  };

  // Dismissal types that require a fielder to be credited
  const DISMISSALS_NEEDING_FIELDER = ["Caught", "Run Out", "Stumped"];

  // First step: select dismissal type
  const handleDismissalTypeSelect = async (type: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPendingDismissalType(type);
    setPendingFielderName(null);
    setShowDismissalPicker(false);

    // If this dismissal type needs a fielder, show fielder picker first
    if (DISMISSALS_NEEDING_FIELDER.includes(type)) {
      setShowFielderPicker(true);
    } else {
      setShowBatterPicker(true);
    }
  };

  // Second step: select the fielder involved (for catches, run-outs, stumpings)
  const handleFielderSelect = async (fielderName: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPendingFielderName(fielderName);
    setShowFielderPicker(false);
    setShowBatterPicker(true);
  };

  // Skip fielder selection (for catches where fielder is unknown)
  const handleFielderSkip = async () => {
    setShowFielderPicker(false);
    setShowBatterPicker(true);
  };

  // Third step: choose which batter is out
  const handleBatterSelect = async (batterName: string) => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    if (pendingDismissalType) {
      setDismissedBatterName(batterName);
      onWicket(pendingDismissalType, batterName, pendingFielderName || undefined);
      setShowBatterPicker(false);
      // Don't reset pendingDismissalType yet — the animation needs it to show the dismissal type
      // It gets reset in the animation's onAnimationComplete callback
      setActiveAnimation("wicket");
    }
  };

  const getBallDisplay = (ball: BallRecord) => {
    if (ball.isWicket) return "W";
    const typeStr = String(ball.extraType || "");
    if (typeStr === "wide") {
      const extraRuns = ball.extraRuns || 1;
      return extraRuns > 1 ? `Wd+${extraRuns - 1}` : "Wd";
    }
    if (typeStr === "no_ball" || typeStr === "no-ball") {
      const batRuns = ball.runsOffBat || 0;
      return `Nb+${batRuns}`;
    }
    if (typeStr === "bye") {
      return `${ball.extraRuns || ball.totalRunsFromBall}B`;
    }
    if (typeStr === "leg_bye" || typeStr === "leg-bye") {
      return `${ball.extraRuns || ball.totalRunsFromBall}LB`;
    }
    if (ball.totalRunsFromBall === 0) return "0";
    return String(ball.totalRunsFromBall);
  };

  const getBallStyle = (ball: BallRecord) => {
    if (ball.isWicket) return { bg: "#EF4444", text: "#FFFFFF" }; // Red with white text
    if (ball.totalRunsFromBall >= 6) return { bg: "#10B981", text: "#FFFFFF" }; // Green with white text
    if (ball.totalRunsFromBall === 4) return { bg: "#3B82F6", text: "#FFFFFF" }; // Blue with white text
    if (ball.totalRunsFromBall === 0) return { bg: "#475569", text: "#FFFFFF" }; // Slate gray with white text
    // Regular runs (1, 2, 3, 5) and extras (1B, 2B, Wd, etc.) -> White circle with BLACK text
    return { bg: "#FFFFFF", text: "#000000" };
  };

  const renderBallStrip = () => (
    <View className="flex-row gap-1.5 items-center justify-center py-2">
      {recentDeliveries.slice(0, 6).map((ball, idx) => {
        const style = getBallStyle(ball);
        return (
          <View
            key={`${ball.ballIndex}-${idx}`}
            className="w-7 h-7 rounded-full items-center justify-center shadow-sm"
            style={{ backgroundColor: style.bg }}
          >
            <Text className="text-[10px] font-black" style={{ color: style.text }}>
              {getBallDisplay(ball)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderExtraOptions = () => {
    const type = activeExtraType || "no_ball";

    if (type === "no_ball") {
      return (
        <View className="bg-surface rounded-2xl p-4 gap-3 border border-orange-500/40 shadow-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-black text-orange-500 uppercase tracking-wider">
              ⚡ No Ball Runs (NB + Runs)
            </Text>
            <View className="bg-orange-500/20 rounded-full px-2.5 py-0.5 border border-orange-500/30">
              <Text className="text-[10px] font-bold text-orange-500">+1 Penalty Run</Text>
            </View>
          </View>

          <Text className="text-xs text-muted">
            Select runs scored off the bat for this No Ball:
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
              <TouchableOpacity
                key={`nb-${runs}`}
                className={`flex-1 min-w-[28%] rounded-xl py-3 items-center active:opacity-80 border ${
                  runs === 6
                    ? "bg-green-600/20 border-green-500"
                    : runs === 4
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-orange-500/20 border-orange-500"
                }`}
                onPress={() => handleExtraPress("no_ball", runs, 1)}
              >
                <Text className="text-lg font-black text-foreground">
                  nb+{runs}
                </Text>
                <Text className="text-[9px] font-semibold text-muted">
                  {runs + 1} run{runs + 1 !== 1 ? "s" : ""} total
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="py-2.5 items-center active:opacity-80 border-t border-border/20 mt-1"
            onPress={() => {
              setShowExtrasPicker(false);
              setActiveExtraType(null);
            }}
          >
            <Text className="text-xs font-bold text-muted">Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (type === "wide") {
      return (
        <View className="bg-surface rounded-2xl p-4 gap-3 border border-amber-500/40 shadow-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-black text-amber-500 uppercase tracking-wider">
              ⚠️ Wide Ball Runs (WD + Runs)
            </Text>
            <View className="bg-amber-500/20 rounded-full px-2.5 py-0.5 border border-amber-500/30">
              <Text className="text-[10px] font-bold text-amber-500">Wide Delivery</Text>
            </View>
          </View>

          <Text className="text-xs text-muted">
            Select total wide runs (including penalty):
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {[
              { label: "wd+0", runs: 1, sub: "1 run" },
              { label: "wd+1", runs: 2, sub: "2 runs" },
              { label: "wd+2", runs: 3, sub: "3 runs" },
              { label: "wd+3", runs: 4, sub: "4 runs" },
              { label: "wd+4", runs: 5, sub: "5 runs (Bdr)" },
              { label: "wd+5", runs: 6, sub: "6 runs" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                className="flex-1 min-w-[28%] bg-amber-500/20 border border-amber-500 rounded-xl py-3 items-center active:opacity-80"
                onPress={() => handleExtraPress("wide", 0, item.runs)}
              >
                <Text className="text-lg font-black text-foreground">{item.label}</Text>
                <Text className="text-[9px] font-semibold text-muted">{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="py-2.5 items-center active:opacity-80 border-t border-border/20 mt-1"
            onPress={() => {
              setShowExtrasPicker(false);
              setActiveExtraType(null);
            }}
          >
            <Text className="text-xs font-bold text-muted">Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (type === "bye" || type === "leg_bye") {
      const isLegBye = type === "leg_bye";
      const labelPrefix = isLegBye ? "Leg Bye" : "Bye";
      const codePrefix = isLegBye ? "LB" : "B";
      const color = isLegBye ? "text-indigo-500" : "text-purple-500";
      const borderColor = isLegBye ? "border-indigo-500/40" : "border-purple-500/40";
      const bgAccent = isLegBye ? "bg-indigo-500/20 border-indigo-500" : "bg-purple-500/20 border-purple-500";

      return (
        <View className={`bg-surface rounded-2xl p-4 gap-3 border ${borderColor} shadow-xl`}>
          <View className="flex-row items-center justify-between">
            <Text className={`text-sm font-black ${color} uppercase tracking-wider`}>
              🏏 {labelPrefix} Runs
            </Text>
            <View className="bg-primary/10 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-primary">Uncredited to Batter</Text>
            </View>
          </View>

          <Text className="text-xs text-muted">
            Select runs taken as {labelPrefix.toLowerCase()}s:
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((runs) => (
              <TouchableOpacity
                key={`${codePrefix}-${runs}`}
                className={`flex-1 min-w-[28%] ${bgAccent} rounded-xl py-3 items-center active:opacity-80 border`}
                onPress={() => handleExtraPress(type, 0, runs)}
              >
                <Text className="text-lg font-black text-foreground">
                  {runs} {codePrefix}
                </Text>
                <Text className="text-[9px] font-semibold text-muted">
                  {runs} run{runs !== 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="py-2.5 items-center active:opacity-80 border-t border-border/20 mt-1"
            onPress={() => {
              setShowExtrasPicker(false);
              setActiveExtraType(null);
            }}
          >
            <Text className="text-xs font-bold text-muted">Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="bg-surface rounded-2xl p-4 gap-3">
        <Text className="text-sm font-semibold text-muted uppercase">Select Extra</Text>
        <View className="flex-row gap-2 flex-wrap">
          <TouchableOpacity
            className="bg-orange-500/20 border border-orange-500 rounded-xl px-4 py-2.5 active:opacity-80"
            onPress={() => setActiveExtraType("no_ball")}
          >
            <Text className="text-sm font-bold text-orange-500">No Ball (NB)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-amber-500/20 border border-amber-500 rounded-xl px-4 py-2.5 active:opacity-80"
            onPress={() => setActiveExtraType("wide")}
          >
            <Text className="text-sm font-bold text-amber-500">Wide (WD)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-purple-500/20 border border-purple-500 rounded-xl px-4 py-2.5 active:opacity-80"
            onPress={() => setActiveExtraType("bye")}
          >
            <Text className="text-sm font-bold text-purple-500">Bye (B)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-indigo-500/20 border border-indigo-500 rounded-xl px-4 py-2.5 active:opacity-80"
            onPress={() => setActiveExtraType("leg_bye")}
          >
            <Text className="text-sm font-bold text-indigo-500">Leg Bye (LB)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          className="py-2 items-center active:opacity-80"
          onPress={() => {
            setShowExtrasPicker(false);
            setActiveExtraType(null);
          }}
        >
          <Text className="text-sm text-muted">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDismissalOptions = () => (
    <View className="bg-surface rounded-xl p-4 gap-3">
      <Text className="text-sm font-semibold text-muted uppercase">Dismissal Type</Text>
      <View className="flex-row gap-2 flex-wrap">
        {DISMISSAL_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.type}
            className="bg-error/10 border border-error rounded-lg px-4 py-2.5 active:opacity-80 flex-row items-center gap-2"
            onPress={() => handleDismissalTypeSelect(item.type)}
          >
            <Text className="text-sm">{item.icon}</Text>
            <Text className="text-sm font-semibold text-error">{item.type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        className="py-2 items-center active:opacity-80"
        onPress={() => setShowDismissalPicker(false)}
      >
        <Text className="text-sm text-muted">Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBatterPicker = () => (
    <View className="bg-surface rounded-xl p-4 gap-3">
      <Text className="text-sm font-semibold text-muted uppercase">Who is out?</Text>
      <Text className="text-xs text-muted mb-1 capitalize">
        Dismissal: {pendingDismissalType}
      </Text>
      
      {/* Striker option */}
      {striker && (
        <TouchableOpacity
          className="bg-error/10 border-2 border-error rounded-xl p-4 active:opacity-80 flex-row items-center gap-3"
          onPress={() => handleBatterSelect(striker.name)}
        >
          <View className="w-8 h-8 rounded-full bg-error/20 items-center justify-center">
            <Text className="text-sm font-bold text-error">S</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-foreground">{striker.name}</Text>
              <View className="bg-primary/20 rounded px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-primary">ON STRIKE</Text>
              </View>
            </View>
            <Text className="text-xs text-muted mt-0.5">
              {striker.runs} runs • {striker.balls} balls • SR {striker.strikeRate.toFixed(1)}
            </Text>
          </View>
          <Text className="text-lg font-bold text-error">OUT</Text>
        </TouchableOpacity>
      )}

      {/* Separator */}
      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-px bg-border" />
        <Text className="text-xs font-semibold text-muted">OR</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      {/* Non-striker option */}
      {nonStriker && (
        <TouchableOpacity
          className="bg-orange-500/10 border-2 border-orange-500 rounded-xl p-4 active:opacity-80 flex-row items-center gap-3"
          onPress={() => handleBatterSelect(nonStriker.name)}
        >
          <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center">
            <Text className="text-sm font-bold text-orange-500">N</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-foreground">{nonStriker.name}</Text>
              <View className="bg-orange-500/20 rounded px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-orange-500">NON-STRIKER</Text>
              </View>
            </View>
            <Text className="text-xs text-muted mt-0.5">
              {nonStriker.runs} runs • {nonStriker.balls} balls • SR {nonStriker.strikeRate.toFixed(1)}
            </Text>
          </View>
          <Text className="text-lg font-bold text-orange-500">OUT</Text>
        </TouchableOpacity>
      )}

      {/* Cancel */}
      <TouchableOpacity
        className="py-2 items-center active:opacity-80"
        onPress={() => {
          setShowBatterPicker(false);
          setPendingDismissalType(null);
        }}
      >
        <Text className="text-sm text-muted">Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNextBatterPicker = () => {
    // Filter batters from battingOrder who are not out and not currently at the crease
    const availableNextBatters = battingOrder.filter((b) => {
      if (b.status === "out") return false;
      if (b.status === "batting") return false;
      if (striker && b.name === striker.name) return false;
      if (nonStriker && b.name === nonStriker.name) return false;
      return true;
    });

    return (
      <View className="bg-surface rounded-2xl p-4 gap-3 border border-primary/30 shadow-xl">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground uppercase tracking-wide">
            🏏 Select Next Batter
          </Text>
          <View className="bg-rose-500/10 rounded-full px-2.5 py-0.5 border border-rose-500/20">
            <Text className="text-[10px] font-bold text-rose-500">WICKET FALLEN</Text>
          </View>
        </View>

        <Text className="text-xs text-muted">
          Select who comes in to bat next for <Text className="font-bold text-foreground">{isSecondInnings ? team2Name : team1Name}</Text> after {dismissedBatterName || "wicket"}.
        </Text>

        {availableNextBatters.length === 0 ? (
          <View className="bg-background rounded-xl p-4 items-center gap-2">
            <Text className="text-sm text-muted italic">All squad batters have already batted or team is all out.</Text>
          </View>
        ) : (
          <View className="gap-2 mt-1">
            {availableNextBatters.map((batter, idx) => (
              <TouchableOpacity
                key={batter.name}
                className="bg-background border border-border rounded-xl p-3.5 flex-row items-center gap-3 active:opacity-80"
                onPress={async () => {
                  if (Platform.OS !== "web") {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onSelectNextBatter) {
                    onSelectNextBatter(batter.name);
                  }
                  setShowNextBatterPicker(false);
                }}
              >
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-sm font-bold text-primary">#{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{batter.name}</Text>
                  <Text className="text-xs text-muted mt-0.5">Yet to bat • Batter</Text>
                </View>
                <View className="bg-primary/10 rounded-lg px-2.5 py-1.5 border border-primary/20">
                  <Text className="text-xs font-bold text-primary">SELECT</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          className="py-2.5 items-center active:opacity-80 border-t border-border/20 mt-1"
          onPress={() => setShowNextBatterPicker(false)}
        >
          <Text className="text-xs font-bold text-muted">Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFielderPicker = () => {
    // Use the bowler figures as the known set of fielding team players
    const fielders = bowlersFigures;

    return (
      <View className="bg-surface rounded-xl p-4 gap-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-semibold text-muted uppercase">Who fielded?</Text>
          <Text className="text-xs text-primary capitalize">
            {pendingDismissalType}
          </Text>
        </View>
        <Text className="text-xs text-muted mb-1">
          Select the fielder who made the play
        </Text>

        {fielders.length === 0 ? (
          <View className="bg-background rounded-xl p-4 items-center">
            <Text className="text-sm text-muted italic">No fielders available</Text>
          </View>
        ) : (
          fielders.map((fielder) => {
            // Use different icons based on role context
            const isCurrentBowler = fielder.name === currentBowler?.name;
            return (
              <TouchableOpacity
                key={fielder.name}
                className="bg-background border border-border rounded-xl p-3.5 active:opacity-80 flex-row items-center gap-3"
                onPress={() => handleFielderSelect(fielder.name)}
              >
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-base">{isCurrentBowler ? "⚾" : "✋"}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{fielder.name}</Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {isCurrentBowler ? "Current bowler" : `${formatOvers(fielder.overs)} ov • ${fielder.wickets} wkts`}
                  </Text>
                </View>
                <View className="bg-primary/10 rounded-lg px-2.5 py-1.5">
                  <Text className="text-xs font-bold text-primary">FIELD</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Skip option */}
        <TouchableOpacity
          className="py-2 items-center active:opacity-80 border-t border-border/30 pt-3"
          onPress={handleFielderSkip}
        >
          <Text className="text-sm text-muted">Skip — fielder unknown</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBowlerPicker = () => {
    const ballsInCurrentOver = parseInt((oversString || "0.0").split(".")[1] || "0", 10);
    const isMiddleOfOver = ballsInCurrentOver > 0;
    const lastBowler = lastOverBowlerName || (isMiddleOfOver ? null : currentBowler?.name);

    return (
      <View className="bg-surface rounded-2xl p-4 gap-3 border border-primary/30 shadow-xl">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground uppercase tracking-wide">
            ⚾ Select Next Bowler
          </Text>
          <View className="bg-primary/10 rounded-full px-2.5 py-0.5 border border-primary/20">
            <Text className="text-[10px] font-bold text-primary">OVER COMPLETED</Text>
          </View>
        </View>

        <Text className="text-xs text-muted">
          Select bowler for the next over. <Text className="font-bold text-[#0066FF]">(MCC Law 17.2: Same bowler cannot bowl consecutive overs)</Text>
        </Text>

        {lastBowler && bowlersFigures.length > 1 && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-1 flex-row items-center gap-2">
            <Text className="text-sm">🚫</Text>
            <Text className="text-xs font-semibold text-red-500 flex-1">
              <Text className="font-bold">{lastBowler}</Text> bowled the previous over and CANNOT be selected for this over.
            </Text>
          </View>
        )}

        <View className="gap-2 mt-1">
          {bowlersFigures.map((bowler) => {
            const isLastOverBowler = bowler.name === lastBowler;
            const isCurrentBowler = bowler.name === currentBowler?.name;
            const isDisabled = isMiddleOfOver ? !isCurrentBowler : (isLastOverBowler && bowlersFigures.length > 1);

            return (
              <TouchableOpacity
                key={bowler.name}
                disabled={isDisabled}
                className={`border rounded-xl p-3.5 flex-row items-center gap-3 ${
                  isDisabled
                    ? "bg-background/40 border-border/20 opacity-40"
                    : "bg-background border-border active:opacity-80"
                }`}
                onPress={async () => {
                  if (isDisabled) return;
                  if (Platform.OS !== "web") {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onChangeBowler(bowler.name);
                  setShowBowlerPicker(false);
                }}
              >
                <View className={`w-9 h-9 rounded-full items-center justify-center ${isDisabled ? "bg-muted/10" : "bg-primary/10"}`}>
                  <Text className="text-base">{isDisabled ? "🚫" : "⚾"}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-sm font-bold ${isDisabled ? "text-muted" : "text-foreground"}`}>
                    {bowler.name}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {formatOvers(bowler.overs)} ov • {bowler.runs} runs • {bowler.wickets} wkts • econ {bowler.economy.toFixed(1)}
                  </Text>
                </View>

                <View className={`rounded-lg px-2.5 py-1.5 ${
                  isDisabled ? "bg-red-500/10 border border-red-500/20" : "bg-primary/10 border border-primary/20"
                }`}>
                  <Text className={`text-xs font-bold ${isDisabled ? "text-red-500" : "text-primary"}`}>
                    {isMiddleOfOver ? "MID-OVER" : isLastOverBowler ? "RESTRICTED" : "SELECT"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cancel */}
        <TouchableOpacity
          className="py-2.5 items-center active:opacity-80 border-t border-border/20 mt-1"
          onPress={() => setShowBowlerPicker(false)}
        >
          <Text className="text-xs font-bold text-muted">Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /** Get milestone badge for a batter's score */
  const getBatterBadge = (runs: number, isOut: boolean) => {
    if (isOut && runs === 0) return { label: "🦆", color: "#FF3B30", bg: "bg-[#FF3B30]/15" };
    if (runs >= 100) return { label: "🏆 100", color: "#FFD700", bg: "bg-yellow-400/15" };
    if (runs >= 50) return { label: "🎯 50", color: "#34C759", bg: "bg-green-500/15" };
    return null;
  };

  // Batter stats row component
  const BatterRow = ({ batter, isOnStrike, isOut }: { batter: { name: string; runs: number; balls: number; fours: number; sixes: number; strikeRate: number } | null; isOnStrike: boolean; isOut?: boolean }) => {
    if (!batter) return null;
    const badge = getBatterBadge(batter.runs, isOut ?? false);
    return (
      <View className={`flex-row items-center py-1.5 ${isOnStrike ? "opacity-100" : "opacity-70"}`}>
        <View className="flex-1 flex-row items-center gap-1">
          {isOnStrike && <View className="w-1.5 h-1.5 rounded-full bg-primary" />}
          <Text className={`text-sm font-semibold ${isOnStrike ? "text-foreground" : "text-muted"}`}>
            {batter.name}
          </Text>
          {badge && (
            <View className={`${badge.bg} rounded-md px-1.5 py-0.5`}>
              <Text className="text-[8px] font-bold" style={{ color: badge.color }}>{badge.label}</Text>
            </View>
          )}
        </View>
        <Text className="w-10 text-right text-sm font-bold text-foreground">{batter.runs}</Text>
        <Text className="w-8 text-right text-xs text-muted">{batter.balls}</Text>
        <Text className="w-8 text-right text-xs text-muted">{batter.fours}</Text>
        <Text className="w-8 text-right text-xs text-muted">{batter.sixes}</Text>
        <Text className="w-14 text-right text-xs font-semibold text-foreground">
          {batter.strikeRate.toFixed(1)}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, position: "relative", width: "100%", height: "100%" }}>
      {/* Celebration Popper Modal Overlay for 4, 6 and Wicket */}
      <CelebrationPopperModal
        type={
          activeAnimation === "boundary-4"
            ? "four"
            : activeAnimation === "boundary-6"
              ? "six"
              : activeAnimation === "wicket"
                ? "wicket"
                : null
        }
        playerName={dismissedBatterName || striker?.name || "Batter"}
        dismissalType={pendingDismissalType || "Wicket"}
        onClose={() => {
          setActiveAnimation(null);
          setDismissedBatterName(null);
          setPendingDismissalType(null);
        }}
      />

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >

      {/* ===== PREMIUM MATCH HEADER with Pitch Dark Emerald Aesthetics ===== */}
      <View style={{ backgroundColor: "#0B1511" }} className="px-5 pt-4 pb-5 gap-3 border-b border-[#10B981]/20">
        <LiquidGlassOverlay color="#10B981" variant="sheen" speed={0.6} intensity={0.2} />
        
        {/* Top status bar */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2">
            <View className="bg-[#10B981]/20 border border-[#10B981]/40 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-black text-[#10B981] tracking-wider">
                {format.toUpperCase()}
              </Text>
            </View>
            {tossInfo && (
              <View className="bg-white/10 rounded-full px-2.5 py-0.5 border border-white/15">
                <Text className="text-[9px] font-bold text-slate-200">{tossInfo}</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            {powerplayPhase && powerplayPhase.isActive && (
              <View className="bg-amber-500/20 border border-amber-400/40 rounded-full px-2.5 py-0.5">
                <Text className="text-[9px] font-black text-amber-300">{powerplayPhase.phaseName}</Text>
              </View>
            )}
            {isFreeHit && (
              <View className="bg-[#10B981]/30 border border-[#10B981]/60 rounded-full px-2 py-0.5">
                <Text className="text-[9px] font-black text-[#10B981]">FREE HIT</Text>
              </View>
            )}
          </View>
        </View>

        {/* Two-team score display */}
        <View className="flex-row items-center justify-between">
          {/* Team 1 (Batting/batted first) */}
          <View className="flex-1 min-w-0 pr-2">
            <View className="flex-row items-center gap-1.5">
              <View className="w-6 h-6 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                <Text className="text-[10px] font-black text-[#10B981]">1</Text>
              </View>
              <Text className="text-sm font-black text-white flex-1" numberOfLines={1}>
                {team1Name}
              </Text>
            </View>
            {(team1Captain || team1Keeper) && (
              <View className="flex-row flex-wrap items-center gap-1 mt-1">
                {team1Captain && (
                  <View className="bg-amber-500/20 border border-amber-400/30 rounded-md px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold text-amber-300" numberOfLines={1}>👑 {team1Captain}</Text>
                  </View>
                )}
                {team1Keeper && (
                  <View className="bg-blue-500/20 border border-blue-400/30 rounded-md px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold text-blue-300" numberOfLines={1}>🧤 {team1Keeper}</Text>
                  </View>
                )}
              </View>
            )}
            <Text className="text-3xl font-black text-white mt-1.5 tracking-tight tabular-nums">
              {isSecondInnings ? (firstInningsScore || "—") : `${currentRuns}/${currentWickets}`}
            </Text>
          </View>

          {/* VS Divider */}
          <View className="px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center shadow-md">
              <Text className="text-xs font-black text-[#10B981]">VS</Text>
            </View>
          </View>

          {/* Team 2 (Current batting/batted second) */}
          <View className="flex-1 min-w-0 pl-2 items-end">
            <View className="flex-row items-center gap-1.5 justify-end">
              <Text className="text-sm font-black text-white flex-1 text-right" numberOfLines={1}>
                {team2Name}
              </Text>
              <View className="w-6 h-6 rounded-full bg-white/10 border border-white/20 items-center justify-center">
                <Text className="text-[10px] font-black text-slate-300">{isSecondInnings ? "2" : "1"}</Text>
              </View>
            </View>
            {(team2Captain || team2Keeper) && (
              <View className="flex-row flex-wrap items-center gap-1 mt-1 justify-end">
                {team2Captain && (
                  <View className="bg-amber-500/20 border border-amber-400/30 rounded-md px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold text-amber-300" numberOfLines={1}>👑 {team2Captain}</Text>
                  </View>
                )}
                {team2Keeper && (
                  <View className="bg-blue-500/20 border border-blue-400/30 rounded-md px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold text-blue-300" numberOfLines={1}>🧤 {team2Keeper}</Text>
                  </View>
                )}
              </View>
            )}
            <Text className="text-3xl font-black text-white mt-1.5 tracking-tight tabular-nums">
              {isSecondInnings ? `${currentRuns}/${currentWickets}` : (firstInningsScore || "—")}
            </Text>
          </View>
        </View>

        {/* Team Milestones — displayed when score crosses 50/100/150/200/250/300 */}
        {(() => {
          const score = currentRuns;
          const milestones = [50, 100, 150, 200, 250, 300];
          const reached = milestones.filter(m => score >= m);
          if (reached.length === 0) return null;
          return (
            <View className="flex-row items-center gap-1.5 mb-1">
              {reached.map(m => (
                <View key={m} className="bg-amber-400/20 rounded-full px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-amber-300">🎯 {m}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        {/* Stats Bar - Overs, CRR, PRJ, RRR */}
        <View className="bg-white/8 rounded-2xl px-4 py-2.5 mt-1">
          <View className="flex-row items-center justify-between">
            {/* Overs */}
            <View className="items-center">
              <Text className="text-[9px] text-white/50 font-semibold tracking-wider">OVERS</Text>
              <Text className="text-sm font-bold text-white mt-0.5">{oversString}</Text>
            </View>

            {/* Divider */}
            <View className="w-px h-8 bg-white/10" />

            {/* Current Run Rate */}
            <View className="items-center">
              <Text className="text-[9px] text-white/50 font-semibold tracking-wider">CRR</Text>
              <Text className="text-sm font-bold text-white mt-0.5">{runRate.toFixed(2)}</Text>
            </View>

            {/* Divider */}
            <View className="w-px h-8 bg-white/10" />

            {/* Projected Score */}
            <View className="items-center">
              <Text className="text-[9px] text-white/50 font-semibold tracking-wider">PROJECTED</Text>
              <Text className="text-sm font-bold text-amber-300 mt-0.5">{projectedScore ?? "—"}</Text>
            </View>

            {/* Divider - only if second innings */}
            {isSecondInnings && <View className="w-px h-8 bg-white/10" />}

            {/* Required Run Rate */}
            {isSecondInnings && requiredRunRate !== undefined && (
              <View className="items-center">
                <Text className="text-[9px] text-white/50 font-semibold tracking-wider">RQRD RATE</Text>
                <Text className="text-sm font-bold text-yellow-300 mt-0.5">{requiredRunRate.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Required runs & Recent balls */}
        <View className="gap-2">
          {isSecondInnings && requiredRuns !== undefined && requiredRuns > 0 && (
            <View className="flex-row items-center gap-2">
              <View className="bg-white/10 rounded-full px-3 py-1">
                <Text className="text-xs font-bold text-white">
                  Need {requiredRuns} run{requiredRuns !== 1 ? 's' : ''} from {oversString} ov
                </Text>
              </View>
            </View>
          )}

          {/* Recent balls strip */}
          {recentDeliveries.length > 0 && (
            <View className="bg-white/10 rounded-xl py-2 px-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[9px] font-semibold text-white/50 tracking-wider">RECENT</Text>
              </View>
              {renderBallStrip()}
            </View>
          )}
        </View>
      </View>

      {/* ===== CHASE CALCULATOR (Second Innings) ===== */}
      {/* Stays visible after match ends — result banner inside handles win/loss/tie display */}
      {isSecondInnings && chaseTarget !== undefined && (
        <View className="mx-5 mt-4">
          <ChaseCalculator
            teamName={team2Name}
            target={chaseTarget}
            currentRuns={currentRuns}
            currentWickets={currentWickets}
            totalLegalDeliveries={chaseTotalLegalDeliveries ?? 0}
            maxOvers={chaseMaxOvers ?? 20}
            ballsPerOver={chaseBallsPerOver ?? 6}
            currentRunRate={runRate}
            requiredRunRate={requiredRunRate ?? 0}
            projectedScore={projectedScore}
            isComplete={chaseIsInningsComplete ?? false}
            isAllOut={chaseIsAllOut ?? false}
            staggerIndex={0}
          />
        </View>
      )}

      {matchResult ? (
        /* ===== MATCH RESULT DISPLAY ===== */
        <View className="mx-5 mt-4">
          <GlassCard intensity="high" glowColor="#34C759" padding="lg" radius="xl" className="items-center gap-3" staggerIndex={0}>
            <LiquidGlassOverlay color="#34C759" variant="pulse" speed={0.7} intensity={0.6} />
            <Text className="text-lg font-bold text-primary text-center">
              {matchResult.description}
            </Text>
            <Text className="text-sm text-muted text-center">
              {team1Name}: {firstInningsScore || `${currentRuns}/${currentWickets} (${oversString})`}
              {matchResult.team1Score && ` • ${matchResult.team1Score}`}
            </Text>
            {isSecondInnings && matchResult.team2Score && (
              <Text className="text-sm text-muted text-center">
                {team2Name}: {matchResult.team2Score}
              </Text>
            )}
            <TouchableOpacity
              className="mt-2 bg-[#0066FF] rounded-2xl px-6 py-3 active:opacity-80"
              style={{ shadowColor: "#0066FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
              onPress={onEndMatch}
            >
              <Text className="text-white font-bold text-sm">Finish Match</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      ) : showFielderPicker ? (
        <View className="mx-5 mt-4">
          {renderFielderPicker()}
        </View>
      ) : showBatterPicker ? (
        <View className="mx-5 mt-4">
          {renderBatterPicker()}
        </View>
      ) : showNextBatterPicker ? (
        <View className="mx-5 mt-4">
          {renderNextBatterPicker()}
        </View>
      ) : showBowlerPicker ? (
        <View className="mx-5 mt-4">
          {renderBowlerPicker()}
        </View>
      ) : (!showExtrasPicker && !activeExtraType && !showDismissalPicker) ? (
        <>
          <View className={responsive.orientation === "landscape" ? "flex-row gap-3 mx-3 mt-2" : "flex-col"}>
          <View className={responsive.orientation === "landscape" ? "flex-1" : "mx-5 mt-4"}>
            <GlassCard intensity="medium" padding="none" radius="xl" className="overflow-hidden" staggerIndex={0}>
            <LiquidGlassOverlay variant="sheen" speed={0.5} />
            <View className="bg-[#0066FF]/10 px-5 py-3 flex-row items-center justify-between">
              <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">🏏 Batting</Text>
              {currentPartnership && currentPartnership.runs > 0 && (
                <View className="bg-amber-500/15 rounded-full px-2.5 py-0.5">
                  <Text className="text-[10px] font-semibold text-amber-600">
                    🤝 +{currentPartnership.runs}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Header */}
            <View className="flex-row items-center px-5 py-1.5 border-b border-border/30">
              <View className="flex-1" />
              <Text className="w-10 text-right text-[10px] text-muted font-semibold">R</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">B</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">4s</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">6s</Text>
              <Text className="w-14 text-right text-[10px] text-muted font-semibold">SR</Text>
            </View>

            <View className="px-5 py-1">
              <BatterRow batter={striker} isOnStrike={true} isOut={false} />
              <BatterRow batter={nonStriker} isOnStrike={false} isOut={false} />
            </View>

            {/* Quick stats footer */}
            {(striker || nonStriker) && (
              <View className="border-t border-border/30 mx-5 py-2 flex-row justify-between">
                <View className="items-center">
                  <Text className="text-[10px] text-muted">Total Runs</Text>
                  <Text className="text-sm font-bold text-foreground">{(striker?.runs || 0) + (nonStriker?.runs || 0)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-[10px] text-muted">Total Balls</Text>
                  <Text className="text-sm font-bold text-foreground">{(striker?.balls || 0) + (nonStriker?.balls || 0)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-[10px] text-muted">Fours</Text>
                  <Text className="text-sm font-bold text-[#3B82F6]">{(striker?.fours || 0) + (nonStriker?.fours || 0)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-[10px] text-muted">Sixes</Text>
                  <Text className="text-sm font-bold text-[#10B981]">{(striker?.sixes || 0) + (nonStriker?.sixes || 0)}</Text>
                </View>
              </View>
            )}
          </GlassCard>
          </View>

          {/* ===== PARTNERSHIP PANEL ===== */}
          {currentPartnership && currentPartnership.balls > 0 && (
            <View className="mx-5 mt-3">
              <GlassCard intensity="medium" padding="none" radius="xl" className="overflow-hidden" staggerIndex={1}>
              <View className="px-4 py-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    🤝 Partnership
                  </Text>
                  <View className="bg-amber-500/15 rounded-full px-2.5 py-0.5 border border-amber-500/30">
                    <Text className="text-[10px] font-bold text-amber-500">
                      +{currentPartnership.runs} runs ({currentPartnership.balls}b)
                    </Text>
                  </View>
                </View>

                {/* Partnership stat summary */}
                <View className="flex-row items-center justify-between my-2 bg-amber-500/5 rounded-xl p-2.5 border border-amber-500/10">
                  <View className="items-center flex-1">
                    <Text className="text-lg sm:text-2xl font-black text-foreground" numberOfLines={1}>
                      {currentPartnership.runs}
                    </Text>
                    <Text className="text-[9px] uppercase font-semibold text-muted tracking-tight mt-0.5">Runs</Text>
                  </View>
                  <View className="h-6 w-[1px] bg-amber-500/20" />
                  <View className="items-center flex-1">
                    <Text className="text-lg sm:text-2xl font-black text-foreground" numberOfLines={1}>
                      {currentPartnership.balls}
                    </Text>
                    <Text className="text-[9px] uppercase font-semibold text-muted tracking-tight mt-0.5">Balls</Text>
                  </View>
                  <View className="h-6 w-[1px] bg-amber-500/20" />
                  <View className="items-center flex-1">
                    <Text className="text-lg sm:text-2xl font-black text-amber-500" numberOfLines={1}>
                      {isFinite(currentPartnership.runRate) ? currentPartnership.runRate.toFixed(1) : "0.0"}
                    </Text>
                    <Text className="text-[9px] uppercase font-semibold text-muted tracking-tight mt-0.5">Run Rate</Text>
                  </View>
                  {(currentPartnership.fours > 0 || currentPartnership.sixes > 0) && (
                    <>
                      <View className="h-6 w-[1px] bg-amber-500/20" />
                      <View className="items-center flex-1">
                        <Text className="text-lg sm:text-2xl font-black text-foreground" numberOfLines={1}>
                          {currentPartnership.fours}/{currentPartnership.sixes}
                        </Text>
                        <Text className="text-[9px] uppercase font-semibold text-muted tracking-tight mt-0.5">4s/6s</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Batter names in partnership */}
                <View className="flex-row items-center justify-between pt-2 border-t border-amber-500/20">
                  <View className="flex-row items-center gap-1.5 flex-1 mr-1">
                    <View className="w-2 h-2 rounded-full bg-[#0066FF] shrink-0" />
                    <Text className="text-xs font-bold text-foreground truncate" numberOfLines={1}>
                      {currentPartnership.batter1Name}
                    </Text>
                    {striker?.name === currentPartnership.batter1Name && (
                      <View className="bg-[#0066FF]/15 rounded px-1 py-0.2 shrink-0">
                        <Text className="text-[7px] font-extrabold text-[#0066FF]">STRIKE</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-xs font-bold text-amber-500/60 mx-1 shrink-0">+</Text>

                  <View className="flex-row items-center gap-1.5 flex-1 ml-1 justify-end">
                    {striker?.name === currentPartnership.batter2Name && (
                      <View className="bg-[#0066FF]/15 rounded px-1 py-0.2 shrink-0">
                        <Text className="text-[7px] font-extrabold text-[#0066FF]">STRIKE</Text>
                      </View>
                    )}
                    <Text className="text-xs font-bold text-foreground truncate" numberOfLines={1}>
                      {currentPartnership.batter2Name}
                    </Text>
                    <View className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
          )}

          {/* ===== BOWLER PANEL ===== */}
          {(() => {
            const ballsInCurrentOver = parseInt((oversString || "0.0").split(".")[1] || "0", 10);
            const isMiddleOfOver = ballsInCurrentOver > 0;

            return (
              <View className={`${responsive.orientation === "landscape" ? "mx-0 flex-1" : "mx-5 mt-3"}`}>
                <GlassCard intensity="medium" padding="none" radius="xl" className="overflow-hidden" staggerIndex={2}>
                <LiquidGlassOverlay variant="sheen" speed={0.5} />
                <View className="bg-[#0066FF]/10 px-5 py-3 flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">⚾ Bowling</Text>
                  {!showBowlerPicker && (
                    isMiddleOfOver ? (
                      <View className="bg-amber-500/15 rounded-full px-2.5 py-0.5 border border-amber-500/30 flex-row items-center gap-1">
                        <Text className="text-[9px] font-bold text-amber-500">🔒 Mid-Over</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="bg-[#0066FF]/20 rounded-full px-3 py-1 active:opacity-80"
                        onPress={() => setShowBowlerPicker(true)}
                      >
                        <Text className="text-[10px] font-bold text-[#0066FF]">Change</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
                <View className="flex-row items-center px-5 py-1.5 border-b border-border/30">
                  <View className="flex-1" />
                  <Text className="w-8 text-right text-[10px] text-muted font-semibold">O</Text>
                  <Text className="w-8 text-right text-[10px] text-muted font-semibold">R</Text>
                  <Text className="w-8 text-right text-[10px] text-muted font-semibold">W</Text>
                  <Text className="w-8 text-right text-[10px] text-muted font-semibold">E</Text>
                </View>
                <View className="px-5 py-1">
                  {bowlersFigures.map((bowler, idx) => (
                    <TouchableOpacity
                      key={bowler.name}
                      disabled={isMiddleOfOver}
                      className={`flex-row items-center py-2 ${
                        currentBowler?.name === bowler.name ? "" : isMiddleOfOver ? "opacity-40" : "opacity-60"
                      } ${idx < bowlersFigures.length - 1 ? "border-b border-border/20" : ""}`}
                      onPress={() => {
                        if (isMiddleOfOver && bowler.name !== currentBowler?.name) {
                          return;
                        }
                        if (bowler.name !== currentBowler?.name) {
                          onChangeBowler(bowler.name);
                        }
                      }}
                    >
                  <View className="flex-1 flex-row items-center gap-1.5">
                    {currentBowler?.name === bowler.name && (
                      <View className="w-2 h-2 rounded-full bg-[#0066FF]" />
                    )}
                      <Text className={`text-sm ${currentBowler?.name === bowler.name ? "font-bold text-foreground" : "font-semibold text-muted"}`} numberOfLines={1}>
                        {bowler.name}
                      </Text>
                      {bowler.maidens > 0 && (
                        <View className="bg-cyan-400/15 rounded-md px-1.5 py-0.5">
                          <Text className="text-[8px] font-bold text-cyan-400">🔵 M{bowler.maidens}</Text>
                        </View>
                      )}
                      {currentBowler?.name === bowler.name && (
                        <View className="bg-[#0066FF]/10 rounded-md px-1.5 py-0.5">
                          <Text className="text-[8px] font-bold text-[#0066FF]">BOWLING</Text>
                        </View>
                      )}
                  </View>
                  <Text className="w-8 text-right text-xs font-bold text-foreground">
                    {formatOvers(bowler.overs)}
                  </Text>
                  <Text className="w-8 text-right text-xs text-foreground">{bowler.runs}</Text>
                  <Text className="w-8 text-right text-sm font-bold text-foreground">{bowler.wickets}</Text>
                  <Text className="w-8 text-right text-xs text-foreground">{bowler.economy.toFixed(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {currentBowler && (
              <View className="border-t border-border/30 px-5 py-2 bg-[#0066FF]/5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] text-muted">Current: <Text className="font-bold text-foreground">{currentBowler.name}</Text></Text>
                  <Text className="text-[10px] text-muted">
                    {formatOvers(currentBowler.overs)} ov • {currentBowler.wickets}/{currentBowler.runs}
                  </Text>
                </View>
              </View>
            )}
            </GlassCard>
            </View>
            );
          })()}
          </View>

          {/* ===== SCORING CONTROLS (Full-Width Responsive Keypad) ===== */}
          <View className="mx-5 mt-4">
            <GlassCard intensity="heavy" padding="lg" radius="xl" className="gap-3 bg-[#0D121D]/90 border-white/15">
              {/* Header */}
              <View className="flex-row items-center justify-between pb-2 border-b border-white/10">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-black text-white tracking-tight">🎯 SCORING CONTROLS</Text>
                </View>
                <View className="bg-[#10B981]/20 border border-[#10B981]/40 rounded-full px-3 py-1">
                  <Text className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">BALL-BY-BALL</Text>
                </View>
              </View>

              {/* Main Runs Section */}
              <View className="gap-2.5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Runs</Text>
                
                {/* Row 1: 0, 1, 2, 3, 4 */}
                <View className="flex-row gap-2 w-full">
                  {[
                    { runs: 0, label: "DOT", bg: "bg-slate-700/80 border-slate-600" },
                    { runs: 1, label: "1 RUN", bg: "bg-[#0066FF] border-blue-400/30" },
                    { runs: 2, label: "2 RUNS", bg: "bg-[#0066FF] border-blue-400/30" },
                    { runs: 3, label: "3 RUNS", bg: "bg-[#0066FF] border-blue-400/30" },
                    { runs: 4, label: "FOUR ⚡", bg: "bg-blue-600 border-blue-400" },
                  ].map((btn) => (
                    <TouchableOpacity
                      key={btn.runs}
                      activeOpacity={0.75}
                      onPress={() => handleRunPress(btn.runs)}
                      className={`flex-1 py-3.5 items-center justify-center rounded-2xl border ${btn.bg} shadow-lg shadow-black/40 active:scale-95`}
                    >
                      <Text className="text-2xl font-black text-white">{btn.runs}</Text>
                      <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">{btn.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 2: 5, 6, WD, NB */}
                <View className="flex-row gap-2 w-full">
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleRunPress(5)}
                    className="flex-1 py-3.5 items-center justify-center rounded-2xl border bg-[#0066FF] border-blue-400/30 shadow-lg shadow-black/40 active:scale-95"
                  >
                    <Text className="text-2xl font-black text-white">5</Text>
                    <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">5 RUNS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleRunPress(6)}
                    className="flex-1 py-3.5 items-center justify-center rounded-2xl border bg-emerald-600 border-emerald-400 shadow-lg shadow-black/40 active:scale-95"
                  >
                    <Text className="text-2xl font-black text-white">6</Text>
                    <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">SIX! 🔥</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => { setShowExtrasPicker(true); setActiveExtraType("wide"); }}
                    className="flex-1 py-3.5 items-center justify-center rounded-2xl border bg-amber-600 border-amber-400/40 shadow-lg shadow-black/40 active:scale-95"
                  >
                    <Text className="text-xl font-black text-white">WD</Text>
                    <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">WIDE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => { setShowExtrasPicker(true); setActiveExtraType("no_ball"); }}
                    className="flex-1 py-3.5 items-center justify-center rounded-2xl border bg-orange-600 border-orange-400/40 shadow-lg shadow-black/40 active:scale-95"
                  >
                    <Text className="text-xl font-black text-white">NB</Text>
                    <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">NO BALL</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 3: BYE, LB, WICKET */}
                <View className="flex-row gap-2 w-full">
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => { setShowExtrasPicker(true); setActiveExtraType("bye"); }}
                    className="flex-1 py-3.5 items-center justify-center rounded-2xl border bg-purple-700 border-purple-400/30 shadow-lg shadow-black/40 active:scale-95"
                  >
                    <Text className="text-lg font-black text-white">BYE</Text>
                    <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">BYE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => { setShowExtrasPicker(true); setActiveExtraType("leg_bye"); }}
                    className="flex-1 py-3.5 items-center justify-center rounded-2xl border bg-indigo-700 border-indigo-400/30 shadow-lg shadow-black/40 active:scale-95"
                  >
                    <Text className="text-lg font-black text-white">LB</Text>
                    <Text className="text-[9px] font-bold text-white/80 mt-0.5 uppercase tracking-wider">LEG BYE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setShowDismissalPicker(true)}
                    className="flex-[1.5] py-3.5 items-center justify-center rounded-2xl border bg-rose-600 border-rose-400 shadow-lg shadow-rose-600/40 active:scale-95"
                  >
                    <Text className="text-xl font-black text-white">🎯 WICKET</Text>
                    <Text className="text-[9px] font-bold text-white/90 mt-0.5 uppercase tracking-wider">OUT / DISMISSAL</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Match Quick Actions Row */}
              <View className="flex-row gap-2 mt-1 pt-2 border-t border-white/10">
                <TouchableOpacity
                  onPress={onUndo}
                  className="flex-1 py-3 items-center justify-center rounded-xl bg-white/10 border border-white/15 active:opacity-80 flex-row gap-1.5"
                >
                  <Text className="text-sm font-bold text-white">↩ Undo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCommentary(!showCommentary)}
                  className="flex-1 py-3 items-center justify-center rounded-xl bg-[#0066FF]/30 border border-[#0066FF]/50 active:opacity-80 flex-row gap-1.5"
                >
                  <Text className="text-sm font-bold text-white">
                    {showCommentary ? "🔇 Hide Feed" : "🎙️ Commentary"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onEndInnings}
                  className="flex-1 py-3 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-500/40 active:opacity-80 flex-row gap-1.5"
                >
                  <Text className="text-sm font-bold text-rose-300">⏹ End Inns</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

          {/* ===== COMMENTARY FEED ===== */}
          {showCommentary && commentaryEntries.length > 0 && (
            <View className="mx-5 mt-4">
              <CommentaryFeed entries={commentaryEntries} maxEntries={30} />
            </View>
          )}

          {/* ===== FULL SCORECARD DETAILS (collapsible) ===== */}
          {showFullScorecard && (
            <View className="mx-5 mt-4 gap-3">
              {/* Full Batting Card - Premium Glass */}
              <GlassCard intensity="medium" padding="none" radius="xl" className="overflow-hidden" staggerIndex={3}>
                <View className="bg-[#0066FF]/10 px-5 py-3">
                  <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">🏏 Full Batting Order</Text>
                </View>
                <View className="px-5 py-2">
                  {battingOrder.length > 0 ? (
                    <>
                      <View className="flex-row items-center pb-2 border-b border-border/30 mb-1">
                        <View className="flex-1"><Text className="text-[10px] text-muted font-semibold">Batter</Text></View>
                        <Text className="w-10 text-right text-[10px] text-muted font-semibold">R</Text>
                        <Text className="w-10 text-right text-[10px] text-muted font-semibold">B</Text>
                        <Text className="w-12 text-right text-[10px] text-muted font-semibold">Status</Text>
                      </View>
                      {battingOrder.map((b, idx) => (
                        <View key={idx} className={`flex-row items-center py-2 ${idx < battingOrder.length - 1 ? "border-b border-border/10" : ""}`}>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1">
                              <Text className="text-xs font-semibold text-foreground">{b.name}</Text>
                              {b.status === "batting" && (
                                <View className="bg-green-500/10 rounded-md px-1 py-0.5">
                                  <Text className="text-[8px] font-bold text-green-600">ACTIVE</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text className="w-10 text-right text-sm font-bold text-foreground">{b.runs}</Text>
                          <Text className="w-10 text-right text-xs text-muted">{b.balls}</Text>
                          <View className="w-12 items-end">
                            <Text className="text-[10px] text-muted capitalize">{b.status.replace("_", " ")}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text className="text-xs text-muted italic py-4 text-center">No batters added yet</Text>
                  )}
                </View>
              </GlassCard>

              {/* Full Bowling Card - Premium Glass */}
              <GlassCard intensity="medium" padding="none" radius="xl" className="overflow-hidden" staggerIndex={4}>
                <View className="bg-[#0066FF]/10 px-5 py-3">
                  <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">⚾ Full Bowling Figures</Text>
                </View>
                <View className="px-5 py-2">
                  {bowlersFigures.length > 0 ? (
                    <>
                      <View className="flex-row items-center pb-2 border-b border-border/30 mb-1">
                        <View className="flex-1"><Text className="text-[10px] text-muted font-semibold">Bowler</Text></View>
                        <Text className="w-8 text-right text-[10px] text-muted font-semibold">O</Text>
                        <Text className="w-8 text-right text-[10px] text-muted font-semibold">M</Text>
                        <Text className="w-8 text-right text-[10px] text-muted font-semibold">R</Text>
                        <Text className="w-8 text-right text-[10px] text-muted font-semibold">W</Text>
                        <Text className="w-10 text-right text-[10px] text-muted font-semibold">Econ</Text>
                      </View>
                      {bowlersFigures.map((b, idx) => (
                        <View key={idx} className={`flex-row items-center py-2 ${idx < bowlersFigures.length - 1 ? "border-b border-border/10" : ""}`}>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1">
                              <Text className="text-xs font-semibold text-foreground">{b.name}</Text>
                              {currentBowler?.name === b.name && (
                                <View className="bg-[#0066FF]/10 rounded-md px-1 py-0.5">
                                  <Text className="text-[8px] font-bold text-[#0066FF]">BOWLING</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text className="w-8 text-right text-xs text-foreground">{formatOvers(b.overs)}</Text>
                          <Text className="w-8 text-right text-xs text-foreground">{b.maidens}</Text>
                          <Text className="w-8 text-right text-xs text-foreground">{b.runs}</Text>
                          <Text className="w-8 text-right text-sm font-bold text-foreground">{b.wickets}</Text>
                          <Text className="w-10 text-right text-xs text-foreground">{b.economy.toFixed(1)}</Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text className="text-xs text-muted italic py-4 text-center">No bowlers added yet</Text>
                  )}
                </View>
              </GlassCard>

              {/* Fall of Wickets - Premium Glass */}
              {fallOfWickets.length > 0 && (
                <GlassCard intensity="medium" padding="none" radius="xl" className="overflow-hidden" staggerIndex={5}>
                  <View className="px-5 py-3">
                    <Text className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider mb-3">📉 Fall of Wickets</Text>
                    {fallOfWickets.map((w, idx) => {
                      const hasBowler = !!w.bowlerAtDelivery;
                      const hasFielder = !!w.fielderInvolved;
                      const isCreditedToBowler = (DISMISSAL_CREDITED_TO_BOWLER as string[]).includes(w.dismissalType);
                      
                      return (
                        <View key={idx} className={`flex-row items-start py-2.5 ${idx < fallOfWickets.length - 1 ? "border-b border-border/10" : ""} gap-2`}>
                          {/* Wicket number badge */}
                          <View className="w-7 h-7 rounded-full bg-[#FF3B30]/15 items-center justify-center mt-0.5">
                            <Text className="text-xs font-bold text-[#FF3B30]">{w.wicketNumber}</Text>
                          </View>
                          
                          {/* Batter and dismissal details */}
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1.5">
                              <Text className="text-sm font-semibold text-foreground">{w.batterName}</Text>
                              <Text className="text-xs text-muted">
                                {w.runsAtDismissal} ({w.oversAtDismissal}.{w.ballsAtDismissal})
                              </Text>
                            </View>
                            
                            {/* Dismissal type and bowler */}
                            <View className="flex-row items-center gap-1 mt-0.5">
                              <Text className="text-[11px] text-muted italic capitalize">{w.dismissalType.replace(/_/g, ' ')}</Text>
                              {hasBowler && isCreditedToBowler && (
                                <Text className="text-[11px] text-muted">
                                  b <Text className="font-semibold text-foreground">{w.bowlerAtDelivery}</Text>
                                </Text>
                              )}
                            </View>
                            
                            {/* Fielder involved */}
                            {hasFielder && (
                              <Text className="text-[10px] text-muted mt-0.5 flex-row items-center gap-1">
                                ✋ <Text className="font-semibold text-foreground">{w.fielderInvolved}</Text>
                              </Text>
                            )}
                          </View>
                          
                          {/* Score at dismissal */}
                          <View className="items-end justify-center">
                            <Text className="text-lg font-bold text-foreground">{w.runsAtDismissal}</Text>
                            <View className="bg-[#FF3B30]/10 rounded-md px-2 py-0.5">
                              <Text className="text-[9px] font-bold text-[#FF3B30]">
                                {w.oversAtDismissal}.{w.ballsAtDismissal} ov
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    
                    {/* Summary note */}
                    <View className="border-t border-border/20 mt-2 pt-2">
                      <Text className="text-[10px] text-muted text-center">
                        {fallOfWickets.length} wicket{fallOfWickets.length !== 1 ? 's' : ''} fallen
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              )}
            </View>
          )}
        </>
      ) : (showExtrasPicker || activeExtraType) ? (
        <View className="mx-5 mt-4">
          {renderExtraOptions()}
        </View>
      ) : (
        <View className="mx-5 mt-4">
          {renderDismissalOptions()}
        </View>
      )}

      {/* Bottom padding for safe area */}
      <View className="h-8" />
    </ScrollView>
    </View>
  );
}


