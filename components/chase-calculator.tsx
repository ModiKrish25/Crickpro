/**
 * Chase Calculator — Premium real-time chase tracker for the second innings
 *
 * Displays a Cricbuzz/ESPN Cricinfo-style chase equation that updates
 * instantly after every ball. Shows target, runs remaining, balls remaining,
 * CRR vs RRR comparison, a visual progress bar, and win/loss/tie messages.
 *
 * NOTE: Result branches (won/lost/tied) are included for future standalone use.
 * During live scoring, the parent hides this component when matchResult is set
 * and shows the match result card instead.
 */
import { Text, View } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { StatBox, StatGrid } from "@/components/ui/stat-box";
import { useThemeContext } from "@/lib/theme-provider";
import { getChaseMessage } from "@/lib/cricket/chase-utils";


export interface ChaseCalculatorProps {
  /** Name of the team batting second (chasing) */
  teamName: string;
  /** Target score = first innings total + 1 */
  target: number;
  /** Current score of the chasing team */
  currentRuns: number;
  /** Wickets fallen for the chasing team */
  currentWickets: number;
  /** Legal deliveries bowled in the second innings */
  totalLegalDeliveries: number;
  /** Maximum overs for this innings (0 = unlimited) */
  maxOvers: number;
  /** Balls per over (typically 6) */
  ballsPerOver: number;
  /** Current run rate of the chasing team */
  currentRunRate: number;
  /** Required run rate */
  requiredRunRate: number;
  /** Players per side (default 11, used for wickets-in-hand calculation) */
  playersPerSide?: number;
  /** Whether the chasing innings is complete */
  isComplete: boolean;
  /** Whether the chasing team has been all out */
  isAllOut: boolean;
  /** Match result description (if match is complete) */
  resultDescription?: string;
  /** Winner name (if match is complete) */
  resultWinner?: string;
  /** Projected final score based on current run rate */
  projectedScore?: number;
  staggerIndex?: number;
}

export function ChaseCalculator({
  teamName,
  target,
  currentRuns,
  currentWickets,
  totalLegalDeliveries,
  maxOvers,
  ballsPerOver,
  currentRunRate,
  requiredRunRate,
  playersPerSide = 11,
  isComplete,
  isAllOut,
  resultDescription,
  resultWinner,
  projectedScore,
  staggerIndex = 0,
}: ChaseCalculatorProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";

  // For unlimited overs (Test matches), set balls to Infinity so RRR becomes ~0
  const totalLegalBalls = maxOvers > 0 ? maxOvers * ballsPerOver : Infinity;
  const ballsRemaining = Math.max(0, totalLegalBalls - totalLegalDeliveries);
  const runsRemaining = Math.max(0, target - currentRuns);

  const oversRemaining = isFinite(ballsRemaining) ? ballsRemaining / ballsPerOver : Infinity;
  const computedRRR = isFinite(oversRemaining) && oversRemaining > 0
    ? runsRemaining / oversRemaining
    : 0;

  // Derive derived state for the pure function
  const hasWon = isComplete && resultWinner === teamName;
  const hasLost = isComplete && !!resultWinner && resultWinner !== teamName;
  const isTied = isComplete && !resultWinner;
  const isActive = !isComplete && !isAllOut;
  const isAllOutLost = isAllOut && !hasWon;

  // Progress toward target
  const progressPct = target > 0 ? Math.min(100, (currentRuns / target) * 100) : 0;

  // Use the pure function for the chase message
  const chaseMessage = getChaseMessage({
    teamName,
    target,
    currentRuns,
    currentWickets,
    totalLegalDeliveries,
    maxOvers,
    ballsPerOver,
    isComplete,
    isAllOut,
    resultWinner,
    playersPerSide,
  });

  const rrrHigher = computedRRR > currentRunRate;
  const rrrColor = isActive && rrrHigher ? "#FF3B30" : "#34C759";
  const crrColor = isActive ? (rrrHigher ? "#FF9F0A" : "#34C759") : "#787880";

  return (
    <GlassCard
      intensity="high"
      glowColor={hasWon ? "#34C759" : hasLost ? "#FF3B30" : "#0066FF"}
      padding="lg"
      radius="xl"
      gradientBorder
      className="gap-0"
      staggerIndex={staggerIndex}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-bold text-foreground tracking-tight">
            🎯 Chase Target
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${target > 0 ? "#0066FF" : "#787880"}15` }}
        >
          <Text className="text-xs font-bold" style={{ color: target > 0 ? "#0066FF" : "#787880" }}>
            {target}
          </Text>
        </View>
      </View>

      {/* Live Chase Message */}
      <View
        className="rounded-2xl px-4 py-3 mb-3"
        style={{
          backgroundColor: hasWon
            ? "rgba(52,199,89,0.1)"
            : hasLost || isAllOutLost
              ? "rgba(255,59,48,0.1)"
              : isTied
                ? "rgba(255,159,10,0.1)"
                : "rgba(0,102,255,0.08)",
        }}
      >
        <Text
          className="text-sm font-bold text-center leading-5"
          style={{
            color: hasWon ? "#34C759" : hasLost || isAllOutLost ? "#FF3B30" : isTied ? "#FF9F0A" : "#0066FF",
          }}
        >
          {chaseMessage}
        </Text>
      </View>

      {/* Stats Grid */}
      <StatGrid className="mb-3">
        <StatBox label="Score" value={`${currentRuns}/${currentWickets}`} color="#0066FF" />
        <StatBox label="Target" value={String(target)} color="#5E5CE6" />
        {projectedScore !== undefined && projectedScore > 0 && (
          <StatBox
            label="Projected"
            value={String(projectedScore)}
            color="#FF9F0A"
          />
        )}
        <StatBox
          label="Remain"
          value={
            runsRemaining <= 0
              ? "0/0"
              : isFinite(ballsRemaining)
                ? `${runsRemaining}/${ballsRemaining}`
                : `${runsRemaining}/∞`
          }
          color="#86868B"
        />
        <StatBox
          label={rrrHigher ? "RRR ↑" : "RRR ↓"}
          value={computedRRR.toFixed(2)}
          color={rrrColor}
        />
      </StatGrid>

      {/* Progress Bar */}
      <View className="mb-2.5">
        <View
          className="h-2 rounded-full overflow-hidden"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              backgroundColor: hasWon ? "#34C759" : "#0066FF",
            }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-[10px] text-muted">{progressPct.toFixed(0)}% complete</Text>
          {isActive && isFinite(ballsRemaining) && (
            <Text className="text-[10px] text-muted">{ballsRemaining} ball{ballsRemaining !== 1 ? "s" : ""} left</Text>
          )}
        </View>
      </View>

      {/* CRR vs RRR Comparison (active chase only) */}
      {isActive && (
        <View
          className="rounded-xl p-3 flex-row items-center justify-between gap-2"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          }}
        >
          <StatBox label="CRR" value={currentRunRate.toFixed(2)} color={crrColor} contained={false} />
          <StatBox label="RRR" value={computedRRR.toFixed(2)} color={rrrColor} contained={false} />
          <StatBox
            label="DIFF"
            value={`${rrrHigher ? "↑" : "↓"} ${Math.abs(computedRRR - currentRunRate).toFixed(2)}`}
            color={isActive && rrrHigher ? "#FF3B30" : "#34C759"}
            contained={false}
          />
          <StatBox label="WICKETS" value={playersPerSide - 1 - currentWickets} color="#787880" contained={false} />
        </View>
      )}

      {/* Result banner for completed matches */}
      {(isComplete || isAllOut) && resultDescription && (
        <View className="mt-2">
          <View
            className="rounded-xl px-4 py-2.5 items-center"
            style={{
              backgroundColor: hasWon
                ? "rgba(52,199,89,0.12)"
                : hasLost || isAllOutLost
                  ? "rgba(255,59,48,0.12)"
                  : "rgba(255,159,10,0.12)",
            }}
          >
            <Text
              className="text-sm font-bold text-center"
              style={{
                color: hasWon ? "#34C759" : hasLost || isAllOutLost ? "#FF3B30" : "#FF9F0A",
              }}
            >
              {resultDescription}
            </Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
}


