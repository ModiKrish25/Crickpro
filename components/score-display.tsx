/**
 * ScoreDisplay — Cricket score display with formatted score/overs/run rate.
 *
 * Design: Large premium score typography with glass background.
 * Shows team name, score, overs, and run rate in a compact card.
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface ScoreDisplayProps {
  /** Team name */
  teamName: string;
  /** Runs scored */
  runs: number;
  /** Wickets lost */
  wickets: number;
  /** Overs bowled (formatted string like "14.3") */
  overs?: string;
  /** Run rate */
  runRate?: number | string;
  /** Whether this team is currently batting */
  isBatting?: boolean;
  /** Whether display is compact (vs full) */
  compact?: boolean;
  /** Accent glow color */
  glowColor?: string;
  /** Additional class names */
  className?: string;
}

export function ScoreDisplay({
  teamName,
  runs,
  wickets,
  overs,
  runRate,
  isBatting = false,
  compact = false,
  glowColor = "#0066FF",
  className,
}: ScoreDisplayProps) {
  return (
    <GlassCard
      intensity="high"
      padding={compact ? "sm" : "md"}
      radius="lg"
      glowColor={glowColor}
      className={cn(compact ? "gap-1" : "gap-2", className)}
    >
      {/* Team name */}
      <View className="flex-row items-center gap-1.5">
        {isBatting && (
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: glowColor }}
          />
        )}
        <Text
          className={cn(
            "font-semibold text-muted",
            compact ? "text-[10px]" : "text-xs",
          )}
          numberOfLines={1}
        >
          {teamName}
        </Text>
      </View>

      {/* Score */}
      <View className="flex-row items-baseline gap-1">
        <Text
          className={cn(
            "font-bold tracking-tight text-foreground",
            compact ? "text-2xl" : "text-4xl",
          )}
        >
          {runs}
        </Text>
        <Text
          className={cn(
            "font-bold text-foreground",
            compact ? "text-xl" : "text-3xl",
          )}
        >
          /
        </Text>
        <Text
          className={cn(
            "font-bold text-muted",
            compact ? "text-xl" : "text-3xl",
          )}
        >
          {wickets}
        </Text>

        {/* Overs */}
        {overs && (
          <Text
            className={cn(
              "text-muted ml-2",
              compact ? "text-[10px]" : "text-sm",
            )}
          >
            ({overs})
          </Text>
        )}
      </View>

      {/* Run rate */}
      {runRate !== undefined && (
        <Text
          className={cn(
            "font-medium",
            compact ? "text-[10px]" : "text-xs",
          )}
          style={{ color: `${glowColor}CC` }}
        >
          CRR: {runRate}
        </Text>
      )}
    </GlassCard>
  );
}

export default ScoreDisplay;
