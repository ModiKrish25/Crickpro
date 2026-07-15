/**
 * Scorecard Share Component
 * A beautiful, professional scorecard visual designed for sharing to WhatsApp, Instagram, etc.
 * Uses react-native-svg to render a high-quality, cricket-themed scorecard image.
 * 
 * Features:
 * - Team names with color-coded headers
 * - Both innings scores with overs
 * - Match result badge
 * - Top performers (best batter & bowler)
 * - Fall of wickets summary
 * - Toss information
 * - CrickPro branding with timestamp
 * - Format & venue details
 */
import React from "react";
import { View, Platform } from "react-native";
import Svg, {
  Rect,
  Text as SvgText,
  G,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

export interface ShareScorecardData {
  team1Name: string;
  team2Name: string;
  team1Score?: string;
  team2Score?: string;
  team1Overs?: string;
  team2Overs?: string;
  matchResult: string;
  winner?: string;
  margin?: string;
  format: string;
  overs: number | string;
  tossInfo?: string;
  venue?: string;
  date?: string;
  topBatter?: { name: string; runs: number; balls: number; sr: number; team: string };
  topBowler?: { name: string; overs: number; runs: number; wickets: number; economy: number; team: string };
  manOfTheMatch?: string;
}

interface ScorecardShareProps {
  data: ShareScorecardData;
  width?: number;
  height?: number;
}

const SCORECARD_WIDTH = 600;
const SCORECARD_HEIGHT = 800;
const PADDING = 28;
const COLORS = {
  primary: "#0a7ea4",
  primaryDark: "#065f7a",
  primaryLight: "#e8f4f8",
  accent: "#22C55E",
  accentDark: "#16a34a",
  gold: "#F59E0B",
  red: "#EF4444",
  background: "#ffffff",
  surface: "#f8fafc",
  darkSurface: "#1e293b",
  text: "#11181C",
  textSecondary: "#64748b",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  white: "#ffffff",
  six: "#10B981",
  four: "#3B82F6",
};

function getResultColor(result: string): string {
  const lower = result.toLowerCase();
  if (lower.includes("won")) return COLORS.accent;
  if (lower.includes("tie") || lower.includes("draw")) return COLORS.gold;
  if (lower.includes("abandon") || lower.includes("no result")) return COLORS.textLight;
  return COLORS.primary;
}

function getResultEmoji(result: string): string {
  const lower = result.toLowerCase();
  if (lower.includes("won")) return "🏆";
  if (lower.includes("tie")) return "🤝";
  if (lower.includes("draw")) return "🤝";
  if (lower.includes("abandon")) return "🌧️";
  if (lower.includes("no result")) return "❌";
  return "📋";
}

/**
 * ScorecardShare - Renders a beautiful, ready-to-share scorecard image.
 * Wrap this in a View with a ref to capture via react-native-view-shot.
 */
export function ScorecardShare({ data, width = SCORECARD_WIDTH, height = SCORECARD_HEIGHT }: ScorecardShareProps) {
  const c = COLORS;
  const headerBg = [c.primary, c.primaryDark];
  const w = width;
  const h = height;
  const resultColor = getResultColor(data.matchResult);
  const resultEmoji = getResultEmoji(data.matchResult);
  const formattedDate = data.date || new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  // Determine which teams batted first/second based on score order
  // team1Score is first innings, team2Score is second innings
  const battingFirstTeam = data.team1Name;
  const battingSecondTeam = data.team2Name;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${SCORECARD_WIDTH} ${SCORECARD_HEIGHT}`}>
        {/* Background */}
        <Rect x={0} y={0} width={SCORECARD_WIDTH} height={SCORECARD_HEIGHT} fill={c.background} rx={20} />

        {/* Subtle background pattern - top gradient */}
        <Defs>
          <LinearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={headerBg[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={headerBg[1]} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="resultGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={resultColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={resultColor} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* ===== HEADER SECTION ===== */}
        <Rect x={0} y={0} width={SCORECARD_WIDTH} height={180} fill="url(#headerGrad)" rx={20} />
        {/* Cover the bottom corners of the gradient rect */}
        <Rect x={0} y={160} width={SCORECARD_WIDTH} height={20} fill="url(#headerGrad)" />

        {/* Brand */}  
        <SvgText
          x={PADDING} y={38}
          fontSize={11}
          fontWeight="700"
          fill={c.white}
          opacity={0.7}
          letterSpacing={2}
        >
          CRICKPRO
        </SvgText>

        {/* Format badge */}
        <G>
          <Rect x={SCORECARD_WIDTH - PADDING - 100} y={24} width={100} height={24} rx={12} fill={c.white} opacity={0.15} />
          <SvgText
            x={SCORECARD_WIDTH - PADDING - 50}
            y={39}
            fontSize={11}
            fontWeight="700"
            fill={c.white}
            opacity={0.9}
            textAnchor="middle"
          >
            {data.format.toUpperCase()} • {data.overs}{typeof data.overs === 'number' ? ' Overs' : ''}
          </SvgText>
        </G>

        {/* Team 1 */}
        <SvgText
          x={PADDING} y={85}
          fontSize={16}
          fontWeight="700"
          fill={c.white}
          opacity={0.8}
        >
          {battingFirstTeam}
        </SvgText>
        <SvgText
          x={PADDING} y={125}
          fontSize={42}
          fontWeight="800"
          fill={c.white}
        >
          {data.team1Score || "—"}
        </SvgText>
        {data.team1Overs && (
          <SvgText
            x={PADDING} y={150}
            fontSize={13}
            fill={c.white}
            opacity={0.7}
          >
            {data.team1Overs} overs
          </SvgText>
        )}

        {/* VS Badge */}
        <G>
          <Circle cx={SCORECARD_WIDTH / 2} cy={105} r={24} fill={c.white} opacity={0.15} />
          <SvgText
            x={SCORECARD_WIDTH / 2}
            y={110}
            fontSize={13}
            fontWeight="800"
            fill={c.white}
            opacity={0.9}
            textAnchor="middle"
          >
            VS
          </SvgText>
        </G>

        {/* Team 2 */}
        <SvgText
          x={SCORECARD_WIDTH - PADDING} y={85}
          fontSize={16}
          fontWeight="700"
          fill={c.white}
          opacity={0.8}
          textAnchor="end"
        >
          {battingSecondTeam}
        </SvgText>
        <SvgText
          x={SCORECARD_WIDTH - PADDING} y={125}
          fontSize={42}
          fontWeight="800"
          fill={c.white}
          textAnchor="end"
        >
          {data.team2Score || "—"}
        </SvgText>
        {data.team2Overs && (
          <SvgText
            x={SCORECARD_WIDTH - PADDING} y={150}
            fontSize={13}
            fill={c.white}
            opacity={0.7}
            textAnchor="end"
          >
            {data.team2Overs} overs
          </SvgText>
        )}

        {/* ===== RESULT SECTION ===== */}
        <Rect x={PADDING} y={200} width={SCORECARD_WIDTH - 2 * PADDING} height={64} rx={12} fill="url(#resultGrad)" />
        <Line
          x1={PADDING} y1={200} x2={SCORECARD_WIDTH - PADDING} y2={200}
          stroke={resultColor} strokeWidth={2} opacity={0.3}
        />
        <SvgText
          x={SCORECARD_WIDTH / 2} y={228}
          fontSize={18}
          fontWeight="700"
          fill={resultColor}
          textAnchor="middle"
        >
          {resultEmoji} {data.matchResult}
        </SvgText>
        {(data.winner || data.margin) && (
          <SvgText
            x={SCORECARD_WIDTH / 2} y={252}
            fontSize={13}
            fill={c.textSecondary}
            textAnchor="middle"
          >
            {data.winner && data.margin ? `${data.winner} • ${data.margin}` : data.winner || data.margin || ""}
          </SvgText>
        )}

        {/* ===== TOSS & MATCH INFO ===== */}
        <G>
          <SvgText x={PADDING} y={295} fontSize={11} fontWeight="600" fill={c.textLight}>
            TOSS
          </SvgText>
          <SvgText x={PADDING + 50} y={295} fontSize={11} fontWeight="600" fill={c.textLight}>
            VENUE
          </SvgText>
          <SvgText x={SCORECARD_WIDTH - PADDING - 80} y={295} fontSize={11} fontWeight="600" fill={c.textLight} textAnchor="end">
            DATE
          </SvgText>

          <SvgText x={PADDING} y={314} fontSize={12} fontWeight="500" fill={c.text}>
            {data.tossInfo || "—"}
          </SvgText>
          <SvgText x={PADDING + 50} y={314} fontSize={12} fontWeight="500" fill={c.text}>
            {data.venue || "—"}
          </SvgText>
          <SvgText x={SCORECARD_WIDTH - PADDING} y={314} fontSize={12} fontWeight="500" fill={c.text} textAnchor="end">
            {formattedDate}
          </SvgText>
        </G>

        {/* Divider */}
        <Line x1={PADDING} y1={330} x2={SCORECARD_WIDTH - PADDING} y2={330} stroke={c.border} strokeWidth={1} />

        {/* ===== TOP PERFORMERS ===== */}
        <SvgText x={PADDING} y={360} fontSize={13} fontWeight="700" fill={c.text}>
          Top Performers
        </SvgText>

        {/* Best Batter */}
        {data.topBatter && (
          <G>
            <Rect x={PADDING} y={375} width={(SCORECARD_WIDTH - 3 * PADDING) / 2} height={80} rx={10} fill={c.surface} />
            <Rect x={PADDING} y={375} width={3} height={80} rx={1.5} fill={c.four} />
            <SvgText x={PADDING + 14} y={396} fontSize={10} fontWeight="600" fill={c.four}>
              🏏 BEST BATTER
            </SvgText>
            <SvgText x={PADDING + 14} y={418} fontSize={13} fontWeight="700" fill={c.text}>
              {data.topBatter.name}
            </SvgText>
            <SvgText x={PADDING + 14} y={440} fontSize={11} fill={c.textSecondary}>
              {data.topBatter.runs} runs ({data.topBatter.balls} balls) • SR {data.topBatter.sr.toFixed(1)}
            </SvgText>
          </G>
        )}

        {/* Best Bowler */}
        {data.topBowler && (
          <G>
            <Rect
              x={PADDING + (SCORECARD_WIDTH - 3 * PADDING) / 2 + PADDING}
              y={375}
              width={(SCORECARD_WIDTH - 3 * PADDING) / 2}
              height={80}
              rx={10}
              fill={c.surface}
            />
            <Rect
              x={PADDING + (SCORECARD_WIDTH - 3 * PADDING) / 2 + PADDING}
              y={375}
              width={3}
              height={80}
              rx={1.5}
              fill={c.accent}
            />
            <SvgText
              x={PADDING + (SCORECARD_WIDTH - 3 * PADDING) / 2 + PADDING + 14}
              y={396}
              fontSize={10}
              fontWeight="600"
              fill={c.accentDark}
            >
              ⚾ BEST BOWLER
            </SvgText>
            <SvgText
              x={PADDING + (SCORECARD_WIDTH - 3 * PADDING) / 2 + PADDING + 14}
              y={418}
              fontSize={13}
              fontWeight="700"
              fill={c.text}
            >
              {data.topBowler.name}
            </SvgText>
            <SvgText
              x={PADDING + (SCORECARD_WIDTH - 3 * PADDING) / 2 + PADDING + 14}
              y={440}
              fontSize={11}
              fill={c.textSecondary}
            >
              {data.topBowler.wickets}/{data.topBowler.runs} ({data.topBowler.overs} ov) • Econ {data.topBowler.economy.toFixed(1)}
            </SvgText>
          </G>
        )}

        {/* ===== INNINGS BREAKDOWN ===== */}
        <SvgText x={PADDING} y={490} fontSize={13} fontWeight="700" fill={c.text}>
          Match Summary
        </SvgText>

        {/* Innings 1 */}
        <G>
          <Rect x={PADDING} y={500} width={SCORECARD_WIDTH - 2 * PADDING} height={36} rx={8} fill={c.primaryLight} />
          <SvgText x={PADDING + 14} y={523} fontSize={13} fontWeight="700" fill={c.primaryDark}>
            {battingFirstTeam}
          </SvgText>
          <SvgText x={SCORECARD_WIDTH / 2} y={523} fontSize={14} fontWeight="800" fill={c.text} textAnchor="middle">
            {data.team1Score || "—"}
          </SvgText>
          <SvgText x={SCORECARD_WIDTH - PADDING - 14} y={523} fontSize={12} fill={c.textSecondary} textAnchor="end">
            {data.team1Overs || "—"} ov
          </SvgText>
        </G>

        {/* Innings 2 */}
        <G>
          <Rect x={PADDING} y={542} width={SCORECARD_WIDTH - 2 * PADDING} height={36} rx={8} fill={c.surface} />
          <Line x1={PADDING} y1={542} x2={SCORECARD_WIDTH - PADDING} y2={542} stroke={c.border} strokeWidth={0.5} />
          <SvgText x={PADDING + 14} y={565} fontSize={13} fontWeight="700" fill={c.text}>
            {battingSecondTeam}
          </SvgText>
          <SvgText x={SCORECARD_WIDTH / 2} y={565} fontSize={14} fontWeight="800" fill={c.text} textAnchor="middle">
            {data.team2Score || "—"}
          </SvgText>
          <SvgText x={SCORECARD_WIDTH - PADDING - 14} y={565} fontSize={12} fill={c.textSecondary} textAnchor="end">
            {data.team2Overs || "—"} ov
          </SvgText>
        </G>

        {/* Man of the Match */}
        {data.manOfTheMatch && (
          <G>
            <SvgText x={PADDING} y={610} fontSize={11} fontWeight="600" fill={c.textLight}>
              PLAYER OF THE MATCH
            </SvgText>
            <SvgText x={PADDING} y={632} fontSize={15} fontWeight="700" fill={c.gold}>
              ⭐ {data.manOfTheMatch}
            </SvgText>
          </G>
        )}

        {/* ===== FOOTER / BRANDING ===== */}
        <Line x1={PADDING} y1={SCORECARD_HEIGHT - 80} x2={SCORECARD_WIDTH - PADDING} y2={SCORECARD_HEIGHT - 80} stroke={c.border} strokeWidth={1} />

        <SvgText
          x={SCORECARD_WIDTH / 2}
          y={SCORECARD_HEIGHT - 54}
          fontSize={12}
          fontWeight="700"
          fill={c.primary}
          textAnchor="middle"
        >
          CrickPro
        </SvgText>
        <SvgText
          x={SCORECARD_WIDTH / 2}
          y={SCORECARD_HEIGHT - 36}
          fontSize={10}
          fill={c.textLight}
          textAnchor="middle"
        >
          Cricket Scoring & Tournament Management
        </SvgText>
        <SvgText
          x={SCORECARD_WIDTH / 2}
          y={SCORECARD_HEIGHT - 20}
          fontSize={9}
          fill={c.textLight}
          textAnchor="middle"
        >
          Generated on {formattedDate}
        </SvgText>
      </Svg>
    </View>
  );
}

/**
 * Generate a text version of the scorecard for simple sharing
 */
export function generateScorecardText(data: ShareScorecardData): string {
  const lines: string[] = [];
  const divider = "─".repeat(30);
  
  lines.push("🏏 CRICKPRO - MATCH RESULT");
  lines.push(divider);
  lines.push(`📋 ${data.format.toUpperCase()} | ${data.overs} Overs`);
  if (data.tossInfo) lines.push(`🪙 ${data.tossInfo}`);
  if (data.venue) lines.push(`📍 ${data.venue}`);
  lines.push("");
  lines.push(`${data.team1Name}: ${data.team1Score || "—"}${data.team1Overs ? ` (${data.team1Overs} ov)` : ""}`);
  lines.push(`${data.team2Name}: ${data.team2Score || "—"}${data.team2Overs ? ` (${data.team2Overs} ov)` : ""}`);
  lines.push("");
  lines.push(`🏆 ${data.matchResult}`);
  if (data.winner && data.margin) {
    lines.push(`${data.winner} • ${data.margin}`);
  }
  lines.push("");
  if (data.topBatter) {
    lines.push(`🏏 Best Batter: ${data.topBatter.name} - ${data.topBatter.runs} runs (${data.topBatter.balls}b, SR ${data.topBatter.sr.toFixed(1)})`);
  }
  if (data.topBowler) {
    lines.push(`⚾ Best Bowler: ${data.topBowler.name} - ${data.topBowler.wickets}/${data.topBowler.runs} (${data.topBowler.overs} ov, Econ ${data.topBowler.economy.toFixed(1)})`);
  }
  if (data.manOfTheMatch) {
    lines.push(`⭐ Player of the Match: ${data.manOfTheMatch}`);
  }
  lines.push(divider);
  lines.push("Made with CrickPro");
  
  return lines.join("\n");
}
