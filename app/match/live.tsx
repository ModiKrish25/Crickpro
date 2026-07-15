/**
 * Live Match Screen
 * Full match experience with toss, innings management, real-time scoring,
 * result calculation, and animations
 */
import { Text, View, TouchableOpacity, ScrollView, Platform, Modal, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

import { LiveScorecard } from "@/components/live-scorecard";
import { useMatchState } from "@/lib/hooks/use-match-state";
import {
  CricketRulesEngine,
  MatchFormat,
  TossDecision,
  ExtraType,
  DismissalType,
  MatchStatus,
} from "@/lib/cricket/advanced-rules-engine";
import { matchStore } from "@/lib/stores/match-store";
import { ShareScorecardModal } from "@/components/share-scorecard-modal";
import type { ShareScorecardData } from "@/components/scorecard-share";

type MatchPhase = "pre-match" | "lineup" | "toss" | "innings-1" | "innings-2" | "result" | "completed";

export default function LiveMatchScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    team1: string;
    team2: string;
    format: string;
    overs: string;
    ballsPerOver?: string;
    playersPerSide?: string;
    inningsCount?: string;
  }>();

  const {
    getUIState,
    createMatch,
    recordToss,
    startMatch,
    addBatter,
    addBowler,
    setOpeningBatters,
    setCurrentBowler,
    recordRun,
    recordExtra,
    recordWicket,
    undoLastBall,
    endInnings,
    endMatch,
    isMatchComplete,
  } = useMatchState();

  const [phase, setPhase] = useState<MatchPhase>("pre-match");
  const [tossWinner, setTossWinner] = useState<string>("");
  const [tossDecision, setTossDecision] = useState<TossDecision | null>(null);
  const [inningBreak, setInningBreak] = useState(false);
  const [, forceRefresh] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refresh = useCallback(() => forceRefresh(n => n + 1), []);

  // Batting order state (managed locally for the editor)
  const [team1Lineup, setTeam1Lineup] = useState<string[]>([]);
  const [team2Lineup, setTeam2Lineup] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<1 | 2>(1);
  const [lineupConfirmed, setLineupConfirmed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Captain & Wicketkeeper selection
  const [team1Captain, setTeam1Captain] = useState<string | null>(null);
  const [team1Keeper, setTeam1Keeper] = useState<string | null>(null);
  const [team2Captain, setTeam2Captain] = useState<string | null>(null);
  const [team2Keeper, setTeam2Keeper] = useState<string | null>(null);

  const team1 = params?.team1 || "Team A";
  const team2 = params?.team2 || "Team B";
  const format = (params?.format || "T20") as MatchFormat;
  const overs = parseInt(params?.overs || "20", 10);
  const ballsPerOver = parseInt(params?.ballsPerOver || "6", 10);
  const playersPerSide = parseInt(params?.playersPerSide || "11", 10);
  const inningsCount = parseInt(params?.inningsCount || "1", 10);

  const uiState = getUIState();

  // Sync match state to the shared store whenever it changes
  useEffect(() => {
    const state = getState();
    if (!state) return;

    if (state.status === MatchStatus.NOT_STARTED) {
      matchStore.addUpcomingMatch(state);
    } else {
      matchStore.setMatchFromState(state);
    }
  }, [uiState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Generate sample players for a team based on playersPerSide
  const generateTeamPlayers = useCallback((teamPrefix: string, playerIdPrefix: string) => {
    const batters: { id: string; name: string }[] = [];
    const bowlers: { id: string; name: string }[] = [];

    const names = ["Opener 1", "Opener 2", "No. 3", "No. 4", "No. 5", "No. 6",
      "No. 7", "No. 8", "No. 9", "No. 10", "No. 11"];

    for (let i = 0; i < playersPerSide; i++) {
      const name = i < names.length
        ? `${teamPrefix} ${names[i]}`
        : `${teamPrefix} Player ${i + 1}`;
      batters.push({ id: `${playerIdPrefix}b${i}`, name });
    }

    // Generate bowlers (about half the team, min 2, max 6)
    const bowlerCount = Math.max(2, Math.min(6, Math.floor(playersPerSide / 2)));
    for (let i = 0; i < bowlerCount; i++) {
      const name = i === 0 ? `${teamPrefix} Bowler 1`
        : i === 1 ? `${teamPrefix} Bowler 2`
        : i === 2 ? `${teamPrefix} Bowler 3`
        : i === 3 ? `${teamPrefix} Bowler 4`
        : i === 4 ? `${teamPrefix} Bowler 5`
        : `${teamPrefix} All-rounder`;
      bowlers.push({ id: `${playerIdPrefix}bl${i}`, name });
    }

    return { batters, bowlers };
  }, [playersPerSide]);

  // Auto-create match when screen loads
  useEffect(() => {
    createMatch(format, team1, team2, overs, ballsPerOver, playersPerSide, inningsCount);

    // Generate and store player names in local state (not added to engine yet)
    const team1Players = generateTeamPlayers(team1, "t1");
    const team2Players = generateTeamPlayers(team2, "t2");

    // Add bowlers to engine immediately (they don't need reordering)
    team1Players.bowlers.forEach(b => addBowler(b.id, b.name));
    team2Players.bowlers.forEach(b => addBowler(b.id, b.name));

    // Store batter names for the lineup editor
    setTeam1Lineup(team1Players.batters.map(b => b.name));
    setTeam2Lineup(team2Players.batters.map(b => b.name));

    // Proceed to lineup phase
    setPhase("lineup");
  }, []);

  // Toss step
  const handleTossWinner = async (winner: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTossWinner(winner);
  };

  const handleTossDecision = async (decision: TossDecision) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTossDecision(decision);
    recordToss(tossWinner || team1, decision);

    // After toss, start the match
    const success = startMatch();
    if (success) {
      // Determine which team bats first based on toss decision
      const battingTeam = decision === TossDecision.BAT ? tossWinner || team1 : (tossWinner === team1 ? team2 : team1);
      const bowlingTeam = battingTeam === team1 ? team2 : team1;
      const battingLineup = battingTeam === team1 ? team1Lineup : team2Lineup;

      // Add batters in the custom order from the lineup editor
      for (const name of battingLineup) {
        addBatter(name, name);
      }

      // Set opening batters (first two in the order) and starting bowler
      if (battingLineup.length >= 2) {
        setOpeningBatters(battingLineup[0], battingLineup[1]);
      }
      const bowlerName = bowlingTeam === team2 ? `${team2} Bowler 1` : `${team1} Bowler 1`;
      setCurrentBowler(bowlerName);
      setPhase("innings-1");
    }
  };

  // Handle end of innings
  const handleEndInnings = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    endInnings();
    setInningBreak(true);
    refresh();

    // Check if match is complete
    if (isMatchComplete()) {
      setPhase("result");
    } else {
      // Transition to second innings
      timeoutRef.current = setTimeout(() => {
        setPhase("innings-2");
        setInningBreak(false);

        // Determine which team is now batting
        const innings1BattingTeam = tossDecision === TossDecision.BAT ? (tossWinner || team1) : (tossWinner === team1 ? team2 : team1);
        const innings2BattingTeam = innings1BattingTeam === team1 ? team2 : team1;
        const battingLineup = innings2BattingTeam === team1 ? team1Lineup : team2Lineup;
        const bowlingTeam = innings2BattingTeam === team1 ? team2 : team1;

        // Add batters for innings 2 in the correct lineup order
        for (const name of battingLineup) {
          addBatter(name, name);
        }

        if (battingLineup.length >= 2) {
          setOpeningBatters(battingLineup[0], battingLineup[1]);
        }

        // Add bowlers for the bowling team (fresh innings, needs its own bowlers)
        const team1Players = generateTeamPlayers(team1, "t1");
        const team2Players = generateTeamPlayers(team2, "t2");
        const bowlingPlayers = bowlingTeam === team1 ? team1Players : team2Players;
        for (const b of bowlingPlayers.bowlers) {
          addBowler(b.id, b.name);
        }

        const bowlerName = bowlingTeam === team2 ? `${team2} Bowler 1` : `${team1} Bowler 1`;
        setCurrentBowler(bowlerName);
      }, 1500);
    }
  };

  // Scoring handlers
  const handleRun = useCallback((runs: number) => {
    recordRun(runs);
    refresh();
  }, [recordRun, refresh]);

  const handleExtra = useCallback((type: string, runsOffBat = 0, extraRuns = 1) => {
    const extraMap: Record<string, ExtraType> = {
      "wide": ExtraType.WIDE,
      "no-ball": ExtraType.NO_BALL,
      "bye": ExtraType.BYE,
      "leg-bye": ExtraType.LEG_BYE,
      "penalty": ExtraType.PENALTY,
    };
    const extraType = extraMap[type];
    if (extraType) {
      recordExtra(extraType, runsOffBat, extraRuns);
      refresh();
    }
  }, [recordExtra, refresh]);

  const handleWicket = useCallback((type: string, batterOut?: string, fielderInvolved?: string) => {
    const dismissMap: Record<string, DismissalType> = {
      "Bowled": DismissalType.BOWLED,
      "Caught": DismissalType.CAUGHT,
      "LBW": DismissalType.LBW,
      "Run Out": DismissalType.RUN_OUT,
      "Stumped": DismissalType.STUMPED,
      "Hit Wicket": DismissalType.HIT_WICKET,
    };
    const dismissalType = dismissMap[type] || DismissalType.BOWLED;
    recordWicket(dismissalType, batterOut || "Batter", fielderInvolved);
    refresh();
  }, [recordWicket, refresh]);

  const handleEndMatch = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    endMatch();
    router.back();
  };

  // ===== BATTING ORDER EDITOR HELPERS =====

  const movePlayerInLineup = (team: 1 | 2, index: number, direction: "up" | "down") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const setter = team === 1 ? setTeam1Lineup : setTeam2Lineup;
    const lineup = team === 1 ? [...team1Lineup] : [...team2Lineup];

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lineup.length) return;

    // Swap
    [lineup[index], lineup[newIndex]] = [lineup[newIndex], lineup[index]];
    setter(lineup);
  };

  const toggleCaptain = (team: 1 | 2, playerName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const setter = team === 1 ? setTeam1Captain : setTeam2Captain;
    const current = team === 1 ? team1Captain : team2Captain;
    setter(current === playerName ? null : playerName);
  };

  const toggleKeeper = (team: 1 | 2, playerName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const setter = team === 1 ? setTeam1Keeper : setTeam2Keeper;
    const current = team === 1 ? team1Keeper : team2Keeper;
    setter(current === playerName ? null : playerName);
  };

  const confirmLineups = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Validate captain & keeper are set
    const cap1 = team1Captain;
    const cap2 = team2Captain;
    const kpr1 = team1Keeper;
    const kpr2 = team2Keeper;
    if (!cap1 || !cap2) {
      alert("Please select a captain for both teams");
      return;
    }
    if (!kpr1 || !kpr2) {
      alert("Please select a wicketkeeper for both teams");
      return;
    }
    setLineupConfirmed(true);
    setPhase("toss");
  };

  const editLineupsAgain = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLineupConfirmed(false);
    setTossDecision(null);
    setPhase("lineup");
  };

  // Build share data for the scorecard share feature
  const shareScorecardData = useMemo<ShareScorecardData | null>(() => {
    if (!uiState?.matchResult) return null;
    
    const innings1 = uiState.matchState.innings[0];
    const innings2 = uiState.matchState.innings[1];

    // Find top batter (highest runs)
    const allBatters = [...(innings1?.battingOrder || []), ...(innings2?.battingOrder || [])]
      .filter(b => b.runs > 0)
      .sort((a, b) => b.runs - a.runs);
    const topBatter = allBatters.length > 0 ? allBatters[0] : null;

    // Find top bowler (most wickets)
    const allBowlers = [...(innings1?.bowlers || []), ...(innings2?.bowlers || [])]
      .filter(b => b.wickets > 0)
      .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);
    const topBowler = allBowlers.length > 0 ? allBowlers[0] : null;

    const topPerformerName = topBatter?.name || topBowler?.name || undefined;

    return {
      team1Name: team1,
      team2Name: team2,
      team1Score: innings1 ? `${innings1.totalRuns}/${innings1.totalWickets}` : undefined,
      team2Score: innings2 ? `${innings2.totalRuns}/${innings2.totalWickets}` : undefined,
      team1Overs: innings1 ? CricketRulesEngine.formatOversString(innings1.totalBalls, ballsPerOver) : undefined,
      team2Overs: innings2 ? CricketRulesEngine.formatOversString(innings2.totalBalls, ballsPerOver) : undefined,
      matchResult: uiState.matchResult!.description,
      winner: uiState.matchResult!.winner,
      margin: uiState.matchResult!.margin,
      format: format,
      overs: overs,
      tossInfo: tossDecision && tossWinner
        ? `${tossWinner} opted to ${tossDecision === TossDecision.BAT ? 'bat' : 'bowl'}`
        : undefined,
      venue: params?.venue || undefined,
      date: new Date().toLocaleDateString(),
      topBatter: topBatter ? {
        name: topBatter.name,
        runs: topBatter.runs,
        balls: topBatter.ballsFaced,
        sr: topBatter.strikeRate,
        team: innings1?.battingOrder.includes(topBatter) ? team1 : team2,
      } : undefined,
      topBowler: topBowler ? {
        name: topBowler.name,
        overs: topBowler.overs,
        runs: topBowler.runsConceded,
        wickets: topBowler.wickets,
        economy: topBowler.economyRate,
        team: innings1?.bowlers.includes(topBowler) ? team1 : team2,
      } : undefined,
      manOfTheMatch: topPerformerName,
    };
  }, [uiState, team1, team2, format, overs, tossDecision, tossWinner, params?.venue, ballsPerOver]);

  // Build the scorecard props
  const scorecardProps = uiState?.currentInnings ? {
    team1Name: team1,
    team2Name: team2,
    team1Captain: team1Captain || undefined,
    team1Keeper: team1Keeper || undefined,
    team2Captain: team2Captain || undefined,
    team2Keeper: team2Keeper || undefined,
    currentRuns: uiState.currentInnings.totalRuns,
    currentWickets: uiState.currentInnings.totalWickets,
    oversString: uiState.oversString,
    isSecondInnings: uiState.isSecondInnings,
    firstInningsScore: uiState.isSecondInnings && uiState.matchState.innings[0]
      ? `${uiState.matchState.innings[0].totalRuns}/${uiState.matchState.innings[0].totalWickets} (${CricketRulesEngine.formatOversString(
          uiState.matchState.innings[0].totalBalls, ballsPerOver
        )} ov)`
      : undefined,
    striker: uiState.striker ? {
      name: uiState.striker.name,
      runs: uiState.striker.runs,
      balls: uiState.striker.ballsFaced,
      fours: uiState.striker.fours,
      sixes: uiState.striker.sixes,
      strikeRate: uiState.striker.strikeRate,
    } : null,
    nonStriker: uiState.nonStriker ? {
      name: uiState.nonStriker.name,
      runs: uiState.nonStriker.runs,
      balls: uiState.nonStriker.ballsFaced,
      fours: uiState.nonStriker.fours,
      sixes: uiState.nonStriker.sixes,
      strikeRate: uiState.nonStriker.strikeRate,
    } : null,
    currentBowler: uiState.currentBowler ? {
      name: uiState.currentBowler.name,
      overs: uiState.currentBowler.overs,
      runs: uiState.currentBowler.runsConceded,
      wickets: uiState.currentBowler.wickets,
      economyRate: uiState.currentBowler.economyRate,
    } : null,
    runRate: uiState.currentRunRate,
    requiredRunRate: uiState.requiredRunRate,
    requiredRuns: uiState.currentInnings.target 
      ? Math.max(0, uiState.currentInnings.target - uiState.currentInnings.totalRuns)
      : undefined,
    projectedScore: uiState.projectedScore,
    powerplayPhase: uiState.powerplayPhase,
    isFreeHit: uiState.currentInnings.isFreeHitActive,
    recentDeliveries: uiState.recentDeliveries,
    battingOrder: uiState.battingOrder.map(b => ({ 
      name: b.name, 
      runs: b.runs, 
      balls: b.ballsFaced, 
      status: b.status 
    })),
    fallOfWickets: uiState.fallOfWickets,
    bowlersFigures: uiState.bowlersFigures.map(b => ({...b, runs: b.runsConceded})),
    currentPartnership: uiState.currentPartnership,
    onRun: handleRun,
    onExtra: handleExtra,
    onWicket: handleWicket,
    onChangeBowler: (bowlerName) => {
      setCurrentBowler(bowlerName);
      refresh();
    },
    onUndo: () => {
      undoLastBall();
      refresh();
    },
    onEndInnings: handleEndInnings,
    onEndMatch: handleEndMatch,
    format: format,
    tossInfo: tossDecision && tossWinner
      ? `${tossWinner} opted to ${tossDecision === TossDecision.BAT ? 'bat' : 'bowl'}`
      : undefined,
    matchResult: uiState.matchResult,
  } : null;

  // ===== RENDER =====
  return (
    <ScreenContainer className="p-0">
      {/* Pre-Match / Toss Phase */}
      {(phase === "pre-match" || phase === "toss") && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-6 gap-6 justify-center">
            <View className="items-center gap-2">
              <Text className="text-sm font-bold text-primary uppercase tracking-wider">
                {format.toUpperCase()} • {overs} Overs
              </Text>
              <Text className="text-3xl font-bold text-foreground text-center">
                {team1}
              </Text>
              <Text className="text-lg font-semibold text-muted">VS</Text>
              <Text className="text-3xl font-bold text-foreground text-center">
                {team2}
              </Text>
            </View>

            {/* Toss Phase */}
            <View className="bg-surface rounded-2xl p-6 gap-4 border border-border/50">
              <Text className="text-lg font-bold text-foreground text-center">
                🪙 Coin Toss
              </Text>
              
              {!tossWinner ? (
                <>
                  <Text className="text-sm text-muted text-center">
                    Who won the toss?
                  </Text>
                  <View className="gap-3">
                    <TouchableOpacity
                      className="bg-primary rounded-xl py-4 items-center active:opacity-80"
                      onPress={() => handleTossWinner(team1)}
                    >
                      <Text className="text-background font-bold text-lg">{team1}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-surface border border-primary rounded-xl py-4 items-center active:opacity-80"
                      onPress={() => handleTossWinner(team2)}
                    >
                      <Text className="text-primary font-bold text-lg">{team2}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-lg font-bold text-primary text-center">
                    {tossWinner} won the toss!
                  </Text>
                  <Text className="text-sm text-muted text-center mb-2">
                    What do they want to do?
                  </Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
                      onPress={() => handleTossDecision(TossDecision.BAT)}
                    >
                      <Text className="text-background font-bold">🏏 Bat First</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-primary border border-primary rounded-xl py-4 items-center active:opacity-80"
                      onPress={() => handleTossDecision(TossDecision.BOWL)}
                    >
                      <Text className="text-background font-bold">⚾ Bowl First</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Back to Lineup Editor */}
                  <TouchableOpacity
                    className="mt-3 py-2 items-center active:opacity-60"
                    onPress={editLineupsAgain}
                  >
                    <Text className="text-sm text-primary font-semibold">← Edit Batting Order</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-700 rounded-xl py-3 items-center active:opacity-80"
              onPress={() => router.back()}
            >
              <Text className="text-foreground font-semibold">Cancel Match</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Batting Order Editor Phase */}
      {phase === "lineup" && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-6 gap-5">
            {/* Header */}
            <View className="gap-1">
              <Text className="text-2xl font-bold text-foreground">📋 Set Batting Order</Text>
              <Text className="text-sm text-muted">
                Drag players up/down to set the batting lineup. Openers are at the top.
              </Text>
            </View>

            {/* Team Tabs */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${editingTeam === 1 ? "bg-primary" : "bg-surface border border-border"}`}
                onPress={async () => {
                  if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTeam(1);
                }}
              >
                <Text className={`font-bold ${editingTeam === 1 ? "text-background" : "text-foreground"}`}>{team1}</Text>
                <Text className={`text-xs ${editingTeam === 1 ? "text-background/70" : "text-muted"}`}>
                  {team1Lineup.length} players
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${editingTeam === 2 ? "bg-primary" : "bg-surface border border-border"}`}
                onPress={async () => {
                  if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTeam(2);
                }}
              >
                <Text className={`font-bold ${editingTeam === 2 ? "text-background" : "text-foreground"}`}>{team2}</Text>
                <Text className={`text-xs ${editingTeam === 2 ? "text-background/70" : "text-muted"}`}>
                  {team2Lineup.length} players
                </Text>
              </TouchableOpacity>
            </View>

            {/* Captain & Keeper Selection Status */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-xl p-3 border border-border/30">
                <Text className="text-xs font-semibold text-muted">👑 Captain</Text>
                <Text className="text-sm font-bold text-foreground mt-1">
                  {editingTeam === 1 ? (team1Captain || "—") : (team2Captain || "—")}
                </Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl p-3 border border-border/30">
                <Text className="text-xs font-semibold text-muted">🧤 Wicketkeeper</Text>
                <Text className="text-sm font-bold text-foreground mt-1">
                  {editingTeam === 1 ? (team1Keeper || "—") : (team2Keeper || "—")}
                </Text>
              </View>
            </View>

            {/* Batting Order List */}
            <View className="bg-surface rounded-xl border border-border/50 overflow-hidden">
              {(editingTeam === 1 ? team1Lineup : team2Lineup).map((name, idx, arr) => {
                const isOpener = idx === 0 || idx === 1;
                const canMoveUp = idx > 0;
                const canMoveDown = idx < arr.length - 1;
                const isCaptain = (editingTeam === 1 && team1Captain === name) || (editingTeam === 2 && team2Captain === name);
                const isKeeper = (editingTeam === 1 && team1Keeper === name) || (editingTeam === 2 && team2Keeper === name);
                const isBoth = isCaptain && isKeeper;
                return (
                  <View
                    key={name}
                    className={`flex-row items-center px-4 py-3 border-b border-border/10 ${isOpener ? "bg-primary/5" : ""}`}
                  >
                    {/* Position Number */}
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${isOpener ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}>
                      <Text className={`text-xs font-bold ${isOpener ? "text-background" : "text-foreground"}`}>{idx + 1}</Text>
                    </View>

                    {/* Player Name + Badges */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{name}</Text>
                        {isCaptain && (
                          <View className="bg-amber-500/15 rounded-md px-1.5 py-0.5">
                            <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">👑 C</Text>
                          </View>
                        )}
                        {isKeeper && !isCaptain && (
                          <View className="bg-blue-500/15 rounded-md px-1.5 py-0.5">
                            <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-400">🧤 WK</Text>
                          </View>
                        )}
                        {isBoth && (
                          <View className="bg-purple-500/15 rounded-md px-1.5 py-0.5">
                            <Text className="text-[10px] font-bold text-purple-600 dark:text-purple-400">👑🧤 C/WK</Text>
                          </View>
                        )}
                        {isOpener && !isCaptain && !isKeeper && (
                          <View className="bg-primary/10 rounded-md px-1.5 py-0.5">
                            <Text className="text-[10px] font-bold text-primary">OPEN</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Role Toggle Buttons */}
                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        className={`w-8 h-8 rounded-lg items-center justify-center ${isCaptain ? "bg-amber-500/20 border border-amber-500/40" : "bg-background border border-border active:opacity-70"}`}
                        onPress={() => toggleCaptain(editingTeam, name)}
                      >
                        <Text className={`text-xs ${isCaptain ? "text-amber-600 dark:text-amber-400" : "text-muted"}`}>👑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`w-8 h-8 rounded-lg items-center justify-center ${isKeeper ? "bg-blue-500/20 border border-blue-500/40" : "bg-background border border-border active:opacity-70"}`}
                        onPress={() => toggleKeeper(editingTeam, name)}
                      >
                        <Text className={`text-xs ${isKeeper ? "text-blue-600 dark:text-blue-400" : "text-muted"}`}>🧤</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`w-9 h-8 rounded-lg items-center justify-center ${canMoveUp ? "bg-background active:opacity-70" : "bg-gray-100 dark:bg-gray-800"}`}
                        disabled={!canMoveUp}
                        onPress={() => movePlayerInLineup(editingTeam, idx, "up")}
                      >
                        <Text className={`font-bold text-base ${canMoveUp ? "text-foreground" : "text-gray-300 dark:text-gray-600"}`}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`w-9 h-8 rounded-lg items-center justify-center ${canMoveDown ? "bg-background active:opacity-70" : "bg-gray-100 dark:bg-gray-800"}`}
                        disabled={!canMoveDown}
                        onPress={() => movePlayerInLineup(editingTeam, idx, "down")}
                      >
                        <Text className={`font-bold text-base ${canMoveDown ? "text-foreground" : "text-gray-300 dark:text-gray-600"}`}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Quick tips */}
            <View className="bg-primary/5 rounded-xl p-3 border border-primary/20 gap-1">
              <Text className="text-xs text-muted">
                💡 Tap 👑 to assign captain. Tap 🧤 to assign wicketkeeper. One each per team required.
              </Text>
              <Text className="text-xs text-muted">
                💡 Players at positions 1 & 2 are the opening batters. The rest follow as wickets fall.
              </Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center active:opacity-80 mt-2"
              onPress={confirmLineups}
            >
              <Text className="text-background font-bold text-lg">✅ Confirm & Proceed to Toss</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Innings Break */}
      {inningBreak && (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-2xl font-bold text-foreground text-center">
            End of Innings {phase === "innings-1" ? "1" : "2"}
          </Text>
          {uiState?.currentInnings && (
            <Text className="text-lg text-muted mt-2">
              {uiState.currentInnings.battingTeam}: {uiState.currentInnings.totalRuns}/{uiState.currentInnings.totalWickets} ({uiState.oversString} ov)
            </Text>
          )}
          <Text className="text-sm text-muted mt-4">Preparing next innings...</Text>
        </View>
      )}

      {/* Live Innings */}
      {(phase === "innings-1" || phase === "innings-2") && !inningBreak && scorecardProps && (
        <LiveScorecard {...scorecardProps} />
      )}

      {/* Result Phase */}
      {phase === "result" && uiState?.matchResult && (
        <View className="flex-1 p-6 justify-center items-center gap-6">
          <Text className="text-2xl font-bold text-foreground text-center">
            🏆 Match Complete
          </Text>

          <View className="bg-surface rounded-2xl p-6 w-full gap-4 border border-primary/30">
            <Text className="text-lg font-bold text-primary text-center">
              {uiState.matchResult.description}
            </Text>

            {/* Team Scores */}
            <View className="gap-3">
              <View className="bg-background rounded-xl p-4">
                <Text className="text-sm font-semibold text-muted">{team1}</Text>
                {uiState.matchResult.team1Score ? (
                  <Text className="text-lg font-bold text-foreground">{uiState.matchResult.team1Score}</Text>
                ) : (
                  uiState.matchState.innings[0] && (
                    <Text className="text-lg font-bold text-foreground">
                      {uiState.matchState.innings[0].totalRuns}/{uiState.matchState.innings[0].totalWickets}
                      {" ("}{CricketRulesEngine.formatOversString(uiState.matchState.innings[0].totalBalls, ballsPerOver)} ov{")"}
                    </Text>
                  )
                )}
              </View>
              <View className="bg-background rounded-xl p-4">
                <Text className="text-sm font-semibold text-muted">{team2}</Text>
                {uiState.matchResult.team2Score ? (
                  <Text className="text-lg font-bold text-foreground">{uiState.matchResult.team2Score}</Text>
                ) : (
                  uiState.matchState.innings[1] && (
                    <Text className="text-lg font-bold text-foreground">
                      {uiState.matchState.innings[1].totalRuns}/{uiState.matchState.innings[1].totalWickets}
                      {" ("}{CricketRulesEngine.formatOversString(uiState.matchState.innings[1].totalBalls, ballsPerOver)} ov{")"}
                    </Text>
                  )
                )}
              </View>
            </View>

            <View className="bg-background rounded-xl p-3">
              <Text className="text-xs text-muted text-center">
                Format: {format.toUpperCase()} • {overs} Overs per side
              </Text>
            </View>
          </View>

          <View className="flex-col gap-3 w-full">
            {/* Share Scorecard Button */}
            <TouchableOpacity
              className="bg-accent rounded-xl py-4 items-center active:opacity-80 flex-row justify-center gap-2"
              style={{
                shadowColor: "#22C55E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={async () => {
                if (Platform.OS !== "web") {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setShowShareModal(true);
              }}
            >
              <Text className="text-background font-bold text-lg">📤 Share Scorecard</Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
                onPress={handleEndMatch}
              >
                <Text className="text-background font-bold text-lg">Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center active:opacity-80"
                onPress={() => { createMatch(format, team1, team2, overs, ballsPerOver, playersPerSide, inningsCount); setPhase("pre-match"); setTossWinner(""); setTossDecision(null); }}
              >
                <Text className="text-foreground font-bold text-lg">New Match</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Share Scorecard Modal */}
      {showShareModal && shareScorecardData && (
        <ShareScorecardModal
          data={shareScorecardData}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </ScreenContainer>
  );
}
