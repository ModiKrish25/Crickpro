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
  Dimensions,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";

import { BoundaryCelebration } from "./animations/boundary-celebration";
import { WicketAnimation } from "./animations/wicket-animation";
import { ConfettiBurst } from "./animations/confetti-burst";
import type {
  BallRecord,
  BatterStats,
  BowlerStats,
  FallOfWicket,
  Partnership,
  PowerplayPhase,
  MatchFormat,
} from "@/lib/cricket/advanced-rules-engine";
import { DISMISSAL_CREDITED_TO_BOWLER } from "@/lib/cricket/advanced-rules-engine";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";

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
  onRun: (runs: number) => void;
  onExtra: (type: string, runsOffBat?: number, extraRuns?: number) => void;
  onWicket: (type: string, batterOut?: string, fielderInvolved?: string) => void;
  onChangeBowler: (bowlerName: string) => void;
  onUndo: () => void;
  onEndInnings: () => void;
  onEndMatch: () => void;
  format: MatchFormat;
  tossInfo?: string;
  matchResult?: { description: string; winner?: string; margin?: string };
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
];

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
  onRun,
  onExtra,
  onWicket,
  onChangeBowler,
  onUndo,
  onEndInnings,
  onEndMatch,
  format,
  tossInfo,
  matchResult,
}: LiveScorecardProps) {
  const colors = useColors();
  const [activeAnimation, setActiveAnimation] = useState<AnimationType>(null);
  const [showDismissalPicker, setShowDismissalPicker] = useState(false);
  const [showExtrasPicker, setShowExtrasPicker] = useState(false);
  const [showFullScorecard, setShowFullScorecard] = useState(false);
  const [showBatterPicker, setShowBatterPicker] = useState(false);
  const [pendingDismissalType, setPendingDismissalType] = useState<string | null>(null);
  const [dismissedBatterName, setDismissedBatterName] = useState<string | null>(null);
  const [showBowlerPicker, setShowBowlerPicker] = useState(false);
  const [showFielderPicker, setShowFielderPicker] = useState(false);
  const [pendingFielderName, setPendingFielderName] = useState<string | null>(null);
  const windowWidth = Dimensions.get("window").width;

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

  const handleExtraPress = async (type: string, runsOffBat = 0) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onExtra(type, runsOffBat);
    setShowExtrasPicker(false);
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
    if (ball.extraType === "wide") return "Wd";
    if (ball.extraType === "no_ball") return "Nb";
    if (ball.totalRunsFromBall === 0) return "•";
    return String(ball.totalRunsFromBall);
  };

  const getBallColor = (ball: BallRecord) => {
    if (ball.isWicket) return colors.error;
    if (ball.totalRunsFromBall >= 6) return "#10B981";
    if (ball.totalRunsFromBall === 4) return "#3B82F6";
    if (ball.totalRunsFromBall === 0) return colors.muted;
    return colors.foreground;
  };

  const renderBallStrip = () => (
    <View className="flex-row gap-1.5 items-center justify-center py-2">
      {recentDeliveries.slice(0, 6).map((ball, idx) => (
        <View
          key={`${ball.ballIndex}-${idx}`}
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ backgroundColor: getBallColor(ball) }}
        >
          <Text className="text-[10px] font-bold text-white">{getBallDisplay(ball)}</Text>
        </View>
      ))}
    </View>
  );

  const renderExtraOptions = () => (
    <View className="bg-surface rounded-xl p-4 gap-3">
      <Text className="text-sm font-semibold text-muted uppercase">Select Extra</Text>
      <View className="flex-row gap-2 flex-wrap">
        {[
          { label: "Wide", type: "wide" },
          { label: "No Ball", type: "no-ball" },
          { label: "No Ball + Run", type: "no-ball", runs: 1 },
          { label: "Bye", type: "bye" },
          { label: "Leg Bye", type: "leg-bye" },
          { label: "Penalty", type: "penalty" },
        ].map((item) => (
          <TouchableOpacity
            key={`${item.type}-${item.runs || 0}`}
            className="bg-primary/10 border border-primary rounded-lg px-4 py-2.5 active:opacity-80"
            onPress={() => handleExtraPress(item.type, item.runs || 0)}
          >
            <Text className="text-sm font-semibold text-primary">
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        className="py-2 items-center active:opacity-80"
        onPress={() => setShowExtrasPicker(false)}
      >
        <Text className="text-sm text-muted">Cancel</Text>
      </TouchableOpacity>
    </View>
  );

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
                    {isCurrentBowler ? "Current bowler" : `${fielder.overs}.${String(Math.round((fielder.overs % 1) * 10))} ov • ${fielder.wickets} wkts`}
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
    // Filter out bowlers with same name as current to avoid recommending same bowler
    const availableBowlers = bowlersFigures.filter(
      b => b.name !== currentBowler?.name
    );

    return (
      <View className="bg-surface rounded-xl p-4 gap-3">
        <Text className="text-sm font-semibold text-muted uppercase">Change Bowler</Text>
        <Text className="text-xs text-muted mb-1">
          Current: <Text className="font-bold text-foreground">{currentBowler?.name || "None"}</Text>
        </Text>

        {availableBowlers.length === 0 ? (
          <View className="bg-background rounded-xl p-4 items-center">
            <Text className="text-sm text-muted italic">No other bowlers available</Text>
          </View>
        ) : (
          availableBowlers.map((bowler) => (
            <TouchableOpacity
              key={bowler.name}
              className="bg-background border border-border rounded-xl p-3.5 active:opacity-80 flex-row items-center gap-3"
              onPress={async () => {
                if (Platform.OS !== "web") {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onChangeBowler(bowler.name);
                setShowBowlerPicker(false);
              }}
            >
              <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-base">⚾</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">{bowler.name}</Text>
                <Text className="text-xs text-muted mt-0.5">
                  {bowler.overs}.{String(Math.round((bowler.overs % 1) * 10))} ov • {bowler.runs} runs • {bowler.wickets} wkts • econ {bowler.economy.toFixed(1)}
                </Text>
              </View>
              <View className="bg-primary/10 rounded-lg px-2.5 py-1.5">
                <Text className="text-xs font-bold text-primary">SELECT</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Cancel */}
        <TouchableOpacity
          className="py-2 items-center active:opacity-80"
          onPress={() => setShowBowlerPicker(false)}
        >
          <Text className="text-sm text-muted">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Batter stats row component
  const BatterRow = ({ batter, isOnStrike }: { batter: { name: string; runs: number; balls: number; fours: number; sixes: number; strikeRate: number } | null; isOnStrike: boolean }) => {
    if (!batter) return null;
    return (
      <View className={`flex-row items-center py-1.5 ${isOnStrike ? "opacity-100" : "opacity-70"}`}>
        <View className="flex-1 flex-row items-center gap-1">
          {isOnStrike && <View className="w-1.5 h-1.5 rounded-full bg-primary" />}
          <Text className={`text-sm font-semibold ${isOnStrike ? "text-foreground" : "text-muted"}`}>
            {batter.name}
          </Text>
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Animation Overlays */}
      {activeAnimation === "boundary-4" && (
        <BoundaryCelebration runs={4} onAnimationComplete={() => setActiveAnimation(null)} />
      )}
      {activeAnimation === "boundary-6" && (
        <>
          <BoundaryCelebration runs={6} onAnimationComplete={() => setActiveAnimation(null)} />
          <ConfettiBurst isVisible={true} color="#FFD700" />
        </>
      )}
      {activeAnimation === "wicket" && (
        <WicketAnimation
          playerName={dismissedBatterName || striker?.name || "Batter"}
          dismissalType={pendingDismissalType || "Wicket"}
          onAnimationComplete={() => {
            setActiveAnimation(null);
            setDismissedBatterName(null);
            setPendingDismissalType(null);
          }}
        />
      )}

      {/* ===== MATCH HEADER ===== */}
      <View style={{ backgroundColor: colors.primary }} className="px-5 pt-4 pb-5 gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              {format.toUpperCase()}
            </Text>
            {tossInfo && (
              <View className="bg-white/10 rounded-full px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-white/90">🪙 {tossInfo}</Text>
              </View>
            )}
          </View>
          {powerplayPhase && powerplayPhase.isActive && (
            <View className="bg-orange-400 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">
                {powerplayPhase.phaseName}
              </Text>
            </View>
          )}
        </View>

        {/* Team 1 Score */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white/90">
              {team1Name}
            </Text>
            {/* Captain & Keeper badges for team 1 */}
            {(team1Captain || team1Keeper) && (
              <View className="flex-row items-center gap-2 mt-0.5">
                {team1Captain && (
                  <View className="bg-amber-400/20 rounded-md px-1.5 py-0.5">
                    <Text className="text-[10px] font-semibold text-amber-200">👑 {team1Captain}</Text>
                  </View>
                )}
                {team1Keeper && (
                  <View className="bg-blue-400/20 rounded-md px-1.5 py-0.5">
                    <Text className="text-[10px] font-semibold text-blue-200">🧤 {team1Keeper}</Text>
                  </View>
                )}
              </View>
            )}
            {isSecondInnings ? (
              <Text className="text-sm text-white/70">{firstInningsScore}</Text>
            ) : (
              <Text className="text-3xl font-bold text-white">
                {currentRuns}/{currentWickets}
              </Text>
            )}
          </View>

          {isSecondInnings && (
            <>
              {/* VS Badge */}
              <View className="mx-4 items-center">
                <Text className="text-xs font-bold text-white/60">VS</Text>
              </View>

              {/* Current Team Score */}
              <View className="flex-1 items-end">
                <Text className="text-sm font-semibold text-white/90">
                  {team2Name}
                </Text>
                {/* Captain & Keeper badges for team 2 */}
                {(team2Captain || team2Keeper) && (
                  <View className="flex-row items-center gap-2 mt-0.5 justify-end">
                    {team2Captain && (
                      <View className="bg-amber-400/20 rounded-md px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-amber-200">👑 {team2Captain}</Text>
                      </View>
                    )}
                    {team2Keeper && (
                      <View className="bg-blue-400/20 rounded-md px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-blue-200">🧤 {team2Keeper}</Text>
                      </View>
                    )}
                  </View>
                )}
                <Text className="text-3xl font-bold text-white">
                  {currentRuns}/{currentWickets}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Overs & Run Rate Row */}
        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px] text-white/60">OVERS</Text>
              <Text className="text-sm font-bold text-white">{oversString}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px] text-white/60">CRR</Text>
              <Text className="text-xs font-semibold text-white">{runRate.toFixed(2)}</Text>
            </View>
            {isSecondInnings && requiredRunRate !== undefined && (
              <View className="flex-row items-center gap-1">
                <Text className="text-[10px] text-white/60">RRR</Text>
                <Text className="text-xs font-semibold text-yellow-300">{requiredRunRate.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Free Hit Indicator */}
          {isFreeHit && (
            <View className="bg-green-400 rounded-full px-2 py-0.5">
              <Text className="text-[10px] font-bold text-green-900">FREE HIT</Text>
            </View>
          )}
        </View>

        {/* Required runs display */}
        {isSecondInnings && requiredRuns !== undefined && requiredRuns > 0 && (
          <Text className="text-xs text-white/80 mt-0.5">
            Need {requiredRuns} run{requiredRuns !== 1 ? 's' : ''} to win
          </Text>
        )}

        {/* Recent balls strip */}
        {recentDeliveries.length > 0 && (
          <View className="bg-white/10 rounded-lg mt-2">
            {renderBallStrip()}
          </View>
        )}
      </View>

      {matchResult ? (
        /* ===== MATCH RESULT DISPLAY ===== */
        <View className="mx-5 mt-4">
          <GlassCard intensity="medium" glowColor="#0a7ea4" padding="md" className="items-center gap-2">
          <LiquidGlassOverlay variant="pulse" speed={0.7} />
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
            className="mt-2 bg-primary rounded-lg px-6 py-2.5 active:opacity-80"
            onPress={onEndMatch}
          >
            <Text className="text-background font-bold text-sm">Finish Match</Text>
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
      ) : showBowlerPicker ? (
        <View className="mx-5 mt-4">
          {renderBowlerPicker()}
        </View>
      ) : !showExtrasPicker && !showDismissalPicker ? (
        <>
          {/* ===== BATSMEN PANEL - Glass Card ===== */}
          <View className="mx-5 mt-4">
            <GlassCard intensity="medium" padding="none" className="overflow-hidden">
            <LiquidGlassOverlay variant="sheen" speed={0.5} />
            <View className="bg-primary/10 px-4 py-2">
              <Text className="text-xs font-bold text-primary uppercase tracking-wider">Batting</Text>
            </View>
            
            {/* Header */}
            <View className="flex-row items-center px-4 py-1.5 border-b border-border/30">
              <View className="flex-1" />
              <Text className="w-10 text-right text-[10px] text-muted font-semibold">R</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">B</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">4s</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">6s</Text>
              <Text className="w-14 text-right text-[10px] text-muted font-semibold">SR</Text>
            </View>

            <View className="px-4 py-1">
              <BatterRow batter={striker} isOnStrike={true} />
              <BatterRow batter={nonStriker} isOnStrike={false} />
            </View>

            {/* Batting order mini display */}
            {battingOrder.filter(b => b.status !== "batting" && b.balls > 0).length > 0 && (
              <View className="border-t border-border/30 px-4 py-2">
                <Text className="text-[10px] text-muted font-semibold mb-1">Fall of Wickets / Dismissed Batters</Text>
                {battingOrder
                  .filter(b => b.status === "out" || b.status === "did_not_bat")
                  .slice(0, 4)
                  .map((b, idx) => (
                    <Text key={idx} className="text-xs text-muted">
                      {b.name}: {b.runs}({b.balls}b)
                    </Text>
                  ))}
              </View>
            )}
          </GlassCard>
          </View>

          {/* ===== PARTNERSHIP PANEL - Glass Card ===== */}
          {currentPartnership && currentPartnership.balls > 0 && (
            <View className="mx-5 mt-3">
              <GlassCard intensity="medium" padding="none" className="overflow-hidden">
              <LiquidGlassOverlay color="#F59E0B" variant="sheen" speed={0.5} />
              <View className="bg-amber-500/10 px-4 py-2">
                <Text className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  🤝 Partnership
                </Text>
              </View>
              <View className="px-4 py-2.5 gap-2">
                {/* Partnership stat summary */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-foreground">
                      {currentPartnership.runs}
                    </Text>
                    <Text className="text-[10px] text-muted">Runs</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-foreground">
                      {currentPartnership.balls}
                    </Text>
                    <Text className="text-[10px] text-muted">Balls</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-amber-600">
                      {currentPartnership.runRate.toFixed(1)}
                    </Text>
                    <Text className="text-[10px] text-muted">Run Rate</Text>
                  </View>
                  {currentPartnership.fours > 0 && (
                    <View className="flex-1 items-end">
                      <Text className="text-2xl font-bold text-blue-500">
                        {currentPartnership.fours}/{currentPartnership.sixes}
                      </Text>
                      <Text className="text-[10px] text-muted">4s/6s</Text>
                    </View>
                  )}
                </View>

                {/* Batter names in partnership */}
                <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-border/30">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                      {currentPartnership.batter1Name}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">+</Text>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-amber-500" />
                    <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                      {currentPartnership.batter2Name}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
          )}

          {/* ===== BOWLER PANEL - Glass Card ===== */}
          <View className="mx-5 mt-3">
            <GlassCard intensity="medium" padding="none" className="overflow-hidden">
            <LiquidGlassOverlay variant="sheen" speed={0.5} />
            <View className="bg-primary/10 px-4 py-2 flex-row items-center justify-between">
              <Text className="text-xs font-bold text-primary uppercase tracking-wider">Bowling</Text>
              {!showBowlerPicker && (
                <TouchableOpacity
                  className="bg-primary/20 rounded-lg px-2.5 py-1 active:opacity-80"
                  onPress={() => setShowBowlerPicker(true)}
                >
                  <Text className="text-[10px] font-bold text-primary">Change</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-center px-4 py-1.5 border-b border-border/30">
              <View className="flex-1" />
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">O</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">R</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">W</Text>
              <Text className="w-8 text-right text-[10px] text-muted font-semibold">E</Text>
            </View>
            <View className="px-4 py-1">
              {bowlersFigures.map((bowler, idx) => (
                <TouchableOpacity
                  key={bowler.name}
                  className={`flex-row items-center py-1.5 ${
                    currentBowler?.name === bowler.name ? "" : "opacity-60"
                  }`}
                  onPress={() => {
                    if (bowler.name !== currentBowler?.name) {
                      onChangeBowler(bowler.name);
                    }
                  }}
                >
                  <View className="flex-1 flex-row items-center gap-1">
                    {currentBowler?.name === bowler.name && (
                      <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <Text className={`text-sm font-semibold ${currentBowler?.name === bowler.name ? "text-foreground" : "text-muted"}`}>
                      {bowler.name}
                    </Text>
                  </View>
                  <Text className="w-8 text-right text-xs font-semibold text-foreground">
                    {bowler.overs}.{String(Math.round((bowler.overs % 1) * 10))}
                  </Text>
                  <Text className="w-8 text-right text-xs text-foreground">{bowler.runs}</Text>
                  <Text className="w-8 text-right text-xs font-bold text-foreground">{bowler.wickets}</Text>
                  <Text className="w-8 text-right text-xs text-foreground">{bowler.economy.toFixed(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
          </View>

          {/* ===== SCORING CONTROLS ===== */}
          <View className="mx-5 mt-4 gap-3">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider">
              Scoring
            </Text>

            {/* Run Buttons */}
            <View className="flex-row gap-2">
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <Pressable
                  key={runs}
                  className={`flex-1 rounded-xl py-3.5 items-center active:opacity-80 ${
                    runs === 6
                      ? "bg-green-500"
                      : runs === 4
                        ? "bg-blue-500"
                        : runs === 0
                          ? "bg-gray-500"
                          : "bg-primary"
                  }`}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.93 : 1 }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  })}
                  onPress={() => handleRunPress(runs)}
                >
                  <Text className="text-xl font-bold text-white">{runs}</Text>
                </Pressable>
              ))}
            </View>

            {/* Extras & Actions Row */}
            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 bg-orange-500 rounded-xl py-3 items-center active:opacity-80"
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
                onPress={() => setShowExtrasPicker(true)}
              >
                <Text className="text-sm font-bold text-white">Extras</Text>
              </Pressable>

              <Pressable
                className="flex-1 bg-red-500 rounded-xl py-3 items-center active:opacity-80"
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
                onPress={() => setShowDismissalPicker(true)}
              >
                <Text className="text-sm font-bold text-white">Wicket</Text>
              </Pressable>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-1">
              <TouchableOpacity
                className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-3 items-center active:opacity-80"
                onPress={onUndo}
              >
                <Text className="text-sm font-semibold text-foreground">↩ Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-purple-500 rounded-xl py-3 items-center active:opacity-80"
                onPress={() => setShowFullScorecard(!showFullScorecard)}
              >
                <Text className="text-sm font-bold text-white">
                  {showFullScorecard ? "Hide" : "Details"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-3 items-center active:opacity-80"
                onPress={onEndInnings}
              >
                <Text className="text-sm font-bold text-white">End Inns</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== FULL SCORECARD DETAILS (collapsible) ===== */}
          {showFullScorecard && (
            <View className="mx-5 mt-4 gap-3">
              {/* Full Batting Card - Glass */}
              <GlassCard intensity="medium" padding="none" className="overflow-hidden">
                <View className="bg-primary/10 px-4 py-2">
                  <Text className="text-xs font-bold text-primary uppercase">Batting - Full Order</Text>
                </View>
                <View className="px-4 py-1">
                  {battingOrder.length > 0 ? (
                    battingOrder.map((b, idx) => (
                      <View key={idx} className="flex-row items-center py-1 border-b border-white/10">
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-foreground">{b.name}</Text>
                          <Text className="text-[10px] text-muted">{b.status.replace("_", " ")}</Text>
                        </View>
                        <Text className="w-12 text-right text-sm font-bold text-foreground">{b.runs}</Text>
                        <Text className="w-10 text-right text-xs text-muted">{b.balls}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-muted italic py-3 text-center">
                      No batters added yet
                    </Text>
                  )}
                </View>
              </GlassCard>

              {/* Full Bowling Card - Glass */}
              <GlassCard intensity="medium" padding="none" className="overflow-hidden">
                <View className="bg-primary/10 px-4 py-2">
                  <Text className="text-xs font-bold text-primary uppercase">Bowling - Full Figures</Text>
                </View>
                <View className="px-4 py-1">
                  {bowlersFigures.map((b, idx) => (
                    <View key={idx} className="flex-row items-center py-1 border-b border-white/10">
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-foreground">{b.name}</Text>
                      </View>
                      <Text className="w-8 text-right text-xs text-foreground">{b.overs}.{String(Math.round((b.overs % 1) * 10))}</Text>
                      <Text className="w-8 text-right text-xs text-foreground">{b.maidens}</Text>
                      <Text className="w-8 text-right text-xs text-foreground">{b.runs}</Text>
                      <Text className="w-8 text-right text-xs font-bold text-foreground">{b.wickets}</Text>
                      <Text className="w-10 text-right text-xs text-foreground">{b.economy.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>

              {/* Fall of Wickets - Glass */}
              {fallOfWickets.length > 0 && (
                <GlassCard intensity="medium" padding="md">
                  <LiquidGlassOverlay variant="sheen" speed={0.5} />
                  <Text className="text-xs font-bold text-primary uppercase mb-2">Fall of Wickets</Text>
                  {fallOfWickets.map((w, idx) => {
                    const hasBowler = !!w.bowlerAtDelivery;
                    const hasFielder = !!w.fielderInvolved;
                    const isCreditedToBowler = (DISMISSAL_CREDITED_TO_BOWLER as string[]).includes(w.dismissalType);
                    
                    return (
                      <View key={idx} className="flex-row items-start py-2 border-b border-white/10 last:border-0 gap-2">
                        {/* Wicket number badge */}
                        <View className="w-6 h-6 rounded-full bg-error/20 items-center justify-center mt-0.5">
                          <Text className="text-xs font-bold text-error">{w.wicketNumber}</Text>
                        </View>
                        
                        {/* Batter and dismissal details */}
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-foreground">{w.batterName}</Text>
                          
                          {/* Dismissal type and bowler */}
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <Text className="text-[11px] text-muted capitalize">{w.dismissalType.replace(/_/g, ' ')}</Text>
                            {hasBowler && isCreditedToBowler && (
                              <Text className="text-[11px] text-muted">
                                b <Text className="font-semibold text-foreground">{w.bowlerAtDelivery}</Text>
                              </Text>
                            )}
                          </View>
                          
                          {/* Fielder involved (caught, run-out, stumped) */}
                          {hasFielder && (
                            <Text className="text-[10px] text-muted mt-0.5">
                              ✋ <Text className="font-semibold text-foreground">{w.fielderInvolved}</Text>
                            </Text>
                          )}
                        </View>
                        
                        {/* Score and over at dismissal */}
                        <View className="items-end">
                          <Text className="text-sm font-bold text-foreground">{w.runsAtDismissal}</Text>
                          <Text className="text-[10px] text-muted">
                            {w.oversAtDismissal}.{w.ballsAtDismissal}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </GlassCard>
              )}
            </View>
          )}
        </>
      ) : showExtrasPicker ? (
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
  );
}


