/**
 * Live Match Screen - Premium immersive scoring experience with enhanced glass effects
 * 
 * Design: Apple-inspired glass interface for match management
 * - Glass pre-match setup with coin toss
 * - Premium batting order editor
 * - Innings break with animated transition
 * - Result screen with celebration glass card
 * All elements use frosted glass with backdrop blur
 */
import { Text, View, TouchableOpacity, ScrollView, Platform, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";

import { LiveScorecard } from "@/components/live-scorecard";
import { GlassPreloader } from "@/components/ui/glass-preloader";
import { useMatchState } from "@/hooks/use-match-state";
import {
  CricketRulesEngine,
  MatchFormat,
  TossDecision,
  ExtraType,
  DismissalType,
  MatchStatus,
} from "@/lib/cricket/advanced-rules-engine";
import { matchStore } from "@/lib/stores/match-store";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";
import { useMatchWebSocket } from "@/hooks/use-match-websocket";
import { ShareScorecardModal } from "@/components/share-scorecard-modal";
import type { ShareScorecardData } from "@/components/scorecard-share";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
type MatchPhase = "pre-match" | "lineup" | "toss" | "innings-1" | "innings-2" | "result" | "completed";

export default function LiveMatchScreen() {
  const router = useRouter();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const { isAuthenticated } = useAuthContext();
  const params = useLocalSearchParams<{ team1: string; team2: string; format: string; overs: string; venue?: string; ballsPerOver?: string; playersPerSide?: string; inningsCount?: string; dbMatchId?: string }>();
  
  // Backend persistence mutations (fire-and-forget)
  const recordBallMutation = trpc.scoring.recordBall.useMutation();
  const createInningsMutation = trpc.scoring.createInnings.useMutation();
  const updateInningsMutation = trpc.scoring.updateInnings.useMutation();
  const updateMatchStatusMutation = trpc.match.updateStatus.useMutation();
  const dbMatchId = params?.dbMatchId;
  const dbInningsIdRef = useRef<string | null>(null);

  // Subscribe to WebSocket updates for this match
  const wsState = useMatchWebSocket(dbMatchId);

  const { getUIState, createMatch, recordToss, startMatch, addBatter, addBowler, setOpeningBatters, setCurrentBowler, recordRun, recordExtra, recordWicket, undoLastBall, endInnings, endMatch, isMatchComplete } = useMatchState();

  const [phase, setPhase] = useState<MatchPhase>("pre-match");
  const [tossWinner, setTossWinner] = useState<string>("");
  const [tossDecision, setTossDecision] = useState<TossDecision | null>(null);
  const [inningBreak, setInningBreak] = useState(false);
  const [, forceRefresh] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = useCallback(() => forceRefresh(n => n + 1), []);

  const [team1Lineup, setTeam1Lineup] = useState<string[]>([]);
  const [team2Lineup, setTeam2Lineup] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<1 | 2>(1);
  const [lineupConfirmed, setLineupConfirmed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [team1Captain, setTeam1Captain] = useState<string | null>(null);
  const [team1Keeper, setTeam1Keeper] = useState<string | null>(null);
  const [team2Captain, setTeam2Captain] = useState<string | null>(null);
  const [team2Keeper, setTeam2Keeper] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");

  const team1 = params?.team1 || "Team A";
  const team2 = params?.team2 || "Team B";
  const format = (params?.format?.toLowerCase() || "t20") as MatchFormat;
  const overs = parseInt(params?.overs || "20", 10);
  const ballsPerOver = parseInt(params?.ballsPerOver || "6", 10);
  const playersPerSide = parseInt(params?.playersPerSide || "11", 10);
  const inningsCount = parseInt(params?.inningsCount || "1", 10);

  const uiState = getUIState();

  // Log WebSocket connection status when watchers connect
  useEffect(() => {
    if (wsState.watchers > 0) {
      console.log(`[Live] ${wsState.watchers} watcher(s) connected via WebSocket`);
    }
  }, [wsState.watchers]);

  // Sync match state to local store
  useEffect(() => {
    const state = getUIState()?.matchState;
    if (!state) return;
    if (state.status === MatchStatus.NOT_STARTED) matchStore.addUpcomingMatch(state);
    else matchStore.setMatchFromState(state);
  }, [uiState]);

  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

  /** Persist a delivery to the backend (fire-and-forget) */
  const persistDelivery = useCallback((type: string, runsOffBat: number, extraType?: string, extraRuns?: number) => {
    if (!isAuthenticated || !dbMatchId) return;
    if (!dbInningsIdRef.current) return; // Wait for innings to be created first
    const ui = getUIState();
    if (!ui?.currentInnings) return;
    const inns = ui.currentInnings;
    const bpo = ui.matchState.ballsPerOver || 6;
    const currentOverBall = (inns.totalBalls % bpo) + 1;
    const overNumber = Math.floor(inns.totalBalls / bpo);
    const extras = (extraType ? (extraRuns ?? 1) : 0);
    
    recordBallMutation.mutate({
      matchId: dbMatchId,
      inningsId: Number(dbInningsIdRef.current),
      overNumber,
      ballNumber: currentOverBall,
      runs: runsOffBat,
      extras,
      extraType: extraType || undefined,
      isWicket: type === "wicket" ? 1 : 0,
    });
  }, [isAuthenticated, dbMatchId, getUIState, recordBallMutation]);

  const generateTeamPlayers = useCallback((teamPrefix: string, playerIdPrefix: string) => {
    const batters: { id: string; name: string }[] = [];
    const bowlers: { id: string; name: string }[] = [];
    const names = ["Opener 1", "Opener 2", "No. 3", "No. 4", "No. 5", "No. 6", "No. 7", "No. 8", "No. 9", "No. 10", "No. 11"];
    for (let i = 0; i < playersPerSide; i++) {
      batters.push({ id: `${playerIdPrefix}b${i}`, name: i < names.length ? `${teamPrefix} ${names[i]}` : `${teamPrefix} Player ${i + 1}` });
    }
    const bowlerCount = Math.max(2, Math.min(6, Math.floor(playersPerSide / 2)));
    for (let i = 0; i < bowlerCount; i++) {
      bowlers.push({ id: `${playerIdPrefix}bl${i}`, name: `${teamPrefix} Bowler ${i + 1}` });
    }
    return { batters, bowlers };
  }, [playersPerSide]);

  // Auto-create match with loading state
  useEffect(() => {
    setIsCreating(true);
    // Brief delay to show preloader
    const timer = setTimeout(() => {
      createMatch(format, team1, team2, overs, ballsPerOver, playersPerSide, inningsCount);
      const t1p = generateTeamPlayers(team1, "t1");
      const t2p = generateTeamPlayers(team2, "t2");
      setTeam1Lineup(t1p.batters.map(b => b.name));
      setTeam2Lineup(t2p.batters.map(b => b.name));
      setPhase("lineup");
      setIsCreating(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleTossWinner = async (winner: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTossWinner(winner);
  };

  const handleTossDecision = async (decision: TossDecision) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTossDecision(decision);
    recordToss(tossWinner || team1, decision);
    const success = startMatch();
    if (success) {
      // Create innings in backend and capture the ID for delivery persistence
      if (isAuthenticated && dbMatchId) {
        try {
          const result = await createInningsMutation.mutateAsync({
            matchId: Number(dbMatchId),
            inningsNumber: 1,
          });
          dbInningsIdRef.current = result.inningsId;
        } catch (e) {
          console.warn("[Live] Failed to create innings in DB:", e);
        }
      }
      
      const battingTeam = decision === TossDecision.BAT ? tossWinner || team1 : (tossWinner === team1 ? team2 : team1);
      const bowlingTeam = battingTeam === team1 ? team2 : team1;
      const battingLineup = battingTeam === team1 ? team1Lineup : team2Lineup;
      const bowlingLineup = bowlingTeam === team1 ? team1Lineup : team2Lineup;

      // Add batters from the batting team's EDITED lineup
      for (const name of battingLineup) addBatter(name, name);
      if (battingLineup.length >= 2) setOpeningBatters(battingLineup[0], battingLineup[1]);

      // Add bowlers ONLY from the fielding team's EDITED lineup!
      for (let i = 0; i < bowlingLineup.length; i++) {
        addBowler(`bw_${bowlingTeam}_${i}`, bowlingLineup[i]);
      }
      const initialBowler = bowlingLineup[bowlingLineup.length - 1] || bowlingLineup[0] || `${bowlingTeam} Bowler 1`;
      setCurrentBowler(initialBowler);
      setPhase("innings-1");
    }
  };

  const handleEndInnings = async () => {
    if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endInnings();
    setInningBreak(true);
    refresh();
    if (isMatchComplete()) setPhase("result");
    else {
      timeoutRef.current = setTimeout(() => {
        setPhase("innings-2");
        setInningBreak(false);
        const innings1BattingTeam = tossDecision === TossDecision.BAT ? (tossWinner || team1) : (tossWinner === team1 ? team2 : team1);
        const innings2BattingTeam = innings1BattingTeam === team1 ? team2 : team1;
        const bowlingTeam = innings2BattingTeam === team1 ? team2 : team1;
        const battingLineup = innings2BattingTeam === team1 ? team1Lineup : team2Lineup;
        const bowlingLineup = bowlingTeam === team1 ? team1Lineup : team2Lineup;

        // Add batters for Innings 2 from batting team's EDITED lineup
        for (const name of battingLineup) addBatter(name, name);
        if (battingLineup.length >= 2) setOpeningBatters(battingLineup[0], battingLineup[1]);

        // Add bowlers ONLY from the fielding team's EDITED lineup for Innings 2!
        for (let i = 0; i < bowlingLineup.length; i++) {
          addBowler(`bw_${bowlingTeam}_${i}`, bowlingLineup[i]);
        }
        const initialBowler = bowlingLineup[bowlingLineup.length - 1] || bowlingLineup[0] || `${bowlingTeam} Bowler 1`;
        setCurrentBowler(initialBowler);
      }, 1500);
    }
  };

  const handleRun = useCallback((runs: number) => { recordRun(runs); persistDelivery("run", runs); refresh(); }, [recordRun, persistDelivery, refresh]);
  const handleExtra = useCallback((type: string, runsOffBat = 0, extraRuns = 1) => {
    const extraMap: Record<string, ExtraType> = { "wide": ExtraType.WIDE, "no-ball": ExtraType.NO_BALL, "bye": ExtraType.BYE, "leg-bye": ExtraType.LEG_BYE, "penalty": ExtraType.PENALTY };
    const et = extraMap[type];
    if (et) { recordExtra(et, runsOffBat, extraRuns); persistDelivery("extra", runsOffBat, type, extraRuns); refresh(); }
  }, [recordExtra, persistDelivery, refresh]);
  const handleWicket = useCallback((type: string, batterOut?: string, fielderInvolved?: string) => {
    const dismissMap: Record<string, DismissalType> = { "Bowled": DismissalType.BOWLED, "Caught": DismissalType.CAUGHT, "LBW": DismissalType.LBW, "Run Out": DismissalType.RUN_OUT, "Stumped": DismissalType.STUMPED, "Hit Wicket": DismissalType.HIT_WICKET };
    const dt = dismissMap[type] || DismissalType.BOWLED;
    recordWicket(dt, batterOut || "Batter", fielderInvolved);
    persistDelivery("wicket", 0);
    refresh();
  }, [recordWicket, persistDelivery, refresh]);
  const handleEndMatch = async () => {
    if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endMatch();
    // Persist match completion to backend
    if (isAuthenticated && dbMatchId) {
      updateMatchStatusMutation.mutate({ matchId: Number(dbMatchId), status: "completed" });
    }
    router.back();
  };

  const movePlayerInLineup = (team: 1 | 2, index: number, direction: "up" | "down") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const setter = team === 1 ? setTeam1Lineup : setTeam2Lineup;
    const lineup = team === 1 ? [...team1Lineup] : [...team2Lineup];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lineup.length) return;
    [lineup[index], lineup[newIndex]] = [lineup[newIndex], lineup[index]];
    setter(lineup);
  };

  const toggleCaptain = (team: 1 | 2, playerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const setter = team === 1 ? setTeam1Captain : setTeam2Captain;
    const current = team === 1 ? team1Captain : team2Captain;
    setter(current === playerName ? null : playerName);
  };

  const toggleKeeper = (team: 1 | 2, playerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const setter = team === 1 ? setTeam1Keeper : setTeam2Keeper;
    const current = team === 1 ? team1Keeper : team2Keeper;
    setter(current === playerName ? null : playerName);
  };

  const handleRenamePlayer = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingPlayerIndex(null);
      return;
    }
    const lineupSetter = editingTeam === 1 ? setTeam1Lineup : setTeam2Lineup;
    const lineup = editingTeam === 1 ? [...team1Lineup] : [...team2Lineup];
    if (editingPlayerIndex === null || editingPlayerIndex >= lineup.length) return;
    
    // Update the lineup
    lineup[editingPlayerIndex] = trimmed;
    lineupSetter(lineup);
    
    // Update captain reference if needed
    if (editingTeam === 1 && team1Captain === oldName) setTeam1Captain(trimmed);
    if (editingTeam === 2 && team2Captain === oldName) setTeam2Captain(trimmed);
    // Update keeper reference if needed
    if (editingTeam === 1 && team1Keeper === oldName) setTeam1Keeper(trimmed);
    if (editingTeam === 2 && team2Keeper === oldName) setTeam2Keeper(trimmed);
    
    setEditingPlayerIndex(null);
  };

  const openRenamePlayer = (index: number, currentName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingPlayerIndex(index);
    setEditingPlayerName(currentName);
  };

  const confirmLineups = async () => {
    if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!team1Captain || !team2Captain) { alert("Please select a captain for both teams"); return; }
    if (!team1Keeper || !team2Keeper) { alert("Please select a wicketkeeper for both teams"); return; }
    setLineupConfirmed(true);
    setPhase("toss");
    
    // Persist custom lineup data to the match store
    const matchState = getUIState()?.matchState;
    if (matchState) {
      matchStore.setMatchLineup(matchState.matchId, {
        team1Lineup,
        team2Lineup,
        team1Captain,
        team1Keeper,
        team2Captain,
        team2Keeper,
      });
    }
  };

  const editLineupsAgain = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLineupConfirmed(false);
    setTossDecision(null);
    setPhase("lineup");
  };

  const shareScorecardData = useMemo<ShareScorecardData | null>(() => {
    if (!uiState?.matchResult) return null;
    const innings1 = uiState.matchState.innings[0];
    const innings2 = uiState.matchState.innings[1];
    const allBatters = [...(innings1?.battingOrder || []), ...(innings2?.battingOrder || [])].filter(b => b.runs > 0).sort((a, b) => b.runs - a.runs);
    const topBatter = allBatters.length > 0 ? allBatters[0] : null;
    const allBowlers = [...(innings1?.bowlers || []), ...(innings2?.bowlers || [])].filter(b => b.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);
    const topBowler = allBowlers.length > 0 ? allBowlers[0] : null;
    return {
      team1Name: team1, team2Name: team2,
      team1Score: innings1 ? `${innings1.totalRuns}/${innings1.totalWickets}` : undefined,
      team2Score: innings2 ? `${innings2.totalRuns}/${innings2.totalWickets}` : undefined,
      team1Overs: innings1 ? CricketRulesEngine.formatOversString(innings1.totalBalls, ballsPerOver) : undefined,
      team2Overs: innings2 ? CricketRulesEngine.formatOversString(innings2.totalBalls, ballsPerOver) : undefined,
      matchResult: uiState.matchResult!.description, winner: uiState.matchResult!.winner, margin: uiState.matchResult!.margin,
      format, overs, tossInfo: tossDecision && tossWinner ? `${tossWinner} opted to ${tossDecision === TossDecision.BAT ? 'bat' : 'bowl'}` : undefined,
      venue: params?.venue || undefined, date: new Date().toLocaleDateString(),
      topBatter: topBatter ? { name: topBatter.name, runs: topBatter.runs, balls: topBatter.ballsFaced, sr: topBatter.strikeRate, team: innings1?.battingOrder.includes(topBatter) ? team1 : team2 } : undefined,
      topBowler: topBowler ? { name: topBowler.name, overs: topBowler.overs, runs: topBowler.runsConceded, wickets: topBowler.wickets, economy: topBowler.economyRate, team: innings1?.bowlers.includes(topBowler) ? team1 : team2 } : undefined,
      manOfTheMatch: topBatter?.name || topBowler?.name,
    };
  }, [uiState, team1, team2, format, overs, tossDecision, tossWinner, params?.venue, ballsPerOver]);

  const scorecardProps = uiState?.currentInnings ? {
    team1Name: team1, team2Name: team2, team1Captain: team1Captain || undefined, team1Keeper: team1Keeper || undefined,
    team2Captain: team2Captain || undefined, team2Keeper: team2Keeper || undefined,
    currentRuns: uiState.currentInnings.totalRuns, currentWickets: uiState.currentInnings.totalWickets,
    oversString: uiState.oversString, isSecondInnings: uiState.isSecondInnings,
    firstInningsScore: uiState.isSecondInnings && uiState.matchState.innings[0]
      ? `${uiState.matchState.innings[0].totalRuns}/${uiState.matchState.innings[0].totalWickets} (${CricketRulesEngine.formatOversString(uiState.matchState.innings[0].totalBalls, ballsPerOver)} ov)` : undefined,
    striker: uiState.striker ? { name: uiState.striker.name, runs: uiState.striker.runs, balls: uiState.striker.ballsFaced, fours: uiState.striker.fours, sixes: uiState.striker.sixes, strikeRate: uiState.striker.strikeRate } : null,
    nonStriker: uiState.nonStriker ? { name: uiState.nonStriker.name, runs: uiState.nonStriker.runs, balls: uiState.nonStriker.ballsFaced, fours: uiState.nonStriker.fours, sixes: uiState.nonStriker.sixes, strikeRate: uiState.nonStriker.strikeRate } : null,
    currentBowler: uiState.currentBowler ? { name: uiState.currentBowler.name, overs: uiState.currentBowler.overs, runs: uiState.currentBowler.runsConceded, wickets: uiState.currentBowler.wickets, economyRate: uiState.currentBowler.economyRate } : null,
    runRate: uiState.currentRunRate, requiredRunRate: uiState.requiredRunRate,
    requiredRuns: uiState.currentInnings.target ? Math.max(0, uiState.currentInnings.target - uiState.currentInnings.totalRuns) : undefined,
    projectedScore: uiState.projectedScore, powerplayPhase: uiState.powerplayPhase,
    chaseTarget: uiState.currentInnings.target,
    chaseTotalLegalDeliveries: uiState.currentInnings.totalLegalDeliveries,
    chaseMaxOvers: uiState.matchState.maxOvers,
    chaseBallsPerOver: uiState.matchState.ballsPerOver,
    chaseIsInningsComplete: uiState.isInningsComplete || uiState.currentInnings.isAllOut,
    chaseIsAllOut: uiState.currentInnings.isAllOut,
    isFreeHit: uiState.currentInnings.isFreeHitActive, recentDeliveries: uiState.recentDeliveries,
    battingOrder: uiState.battingOrder.map(b => ({ name: b.name, runs: b.runs, balls: b.ballsFaced, status: b.status })),
    fallOfWickets: uiState.fallOfWickets, bowlersFigures: uiState.bowlersFigures.map(b => ({ ...b, runs: b.runsConceded })),
    currentPartnership: uiState.currentPartnership,
    lastOverBowlerName: uiState.lastOverBowlerName,
    onRun: handleRun, onExtra: handleExtra, onWicket: handleWicket,
    onChangeBowler: (bowlerName: string) => { setCurrentBowler(bowlerName); refresh(); },
    onUndo: () => { undoLastBall(); refresh(); }, onEndInnings: handleEndInnings, onEndMatch: handleEndMatch,
    format, tossInfo: tossDecision && tossWinner ? `${tossWinner} opted to ${tossDecision === TossDecision.BAT ? 'bat' : 'bowl'}` : undefined,
    matchResult: uiState.matchResult,
  } : null;

  return (
    <ScreenContainer className="p-0" gradient glass>
      {/* Preloader during initial match creation */}
      {isCreating && (
        <GlassPreloader
          message="Setting up the match..."
          size="md"
          fullscreen
          visible={isCreating}
        />
      )}

      {/* Pre-Match & Toss Phase */}
      {(phase === "pre-match" || phase === "toss") && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-5 gap-6 justify-center">
            <View className="items-center gap-2" style={{ opacity: 1 }}>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-[2px]">{format.toUpperCase()} • {overs} Overs</Text>
                {wsState.connected && wsState.watchers > 0 && (
                  <View className="flex-row items-center gap-1 bg-[#34C759]/10 rounded-full px-2 py-0.5 border border-[#34C759]/20">
                    <View className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    <Text className="text-[9px] font-semibold text-[#34C759]">{wsState.watchers} watching</Text>
                  </View>
                )}
              </View>
              <Text className="text-3xl font-bold text-foreground text-center tracking-tight">{team1}</Text>
              <Text className="text-lg font-semibold text-muted">VS</Text>
              <Text className="text-3xl font-bold text-foreground text-center tracking-tight">{team2}</Text>
            </View>

            {/* Toss Phase - Glass Card */}
            <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5" blurAmount={30} staggerIndex={0}>
              <Text className="text-xl font-bold text-foreground text-center tracking-tight">🪙 Coin Toss</Text>
              {!tossWinner ? (
                <>
                  <Text className="text-sm text-muted text-center">Who won the toss?</Text>
                  <View className="gap-3">
                    <TouchableOpacity className="bg-[#0066FF] rounded-2xl py-4 items-center" onPress={() => handleTossWinner(team1)}>
                      <Text className="text-white font-bold text-lg">{team1}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white/50 dark:bg-white/[0.05] border border-[#0066FF] rounded-2xl py-4 items-center" onPress={() => handleTossWinner(team2)}>
                      <Text className="text-[#0066FF] font-bold text-lg">{team2}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-xl font-bold text-[#0066FF] text-center">{tossWinner} won!</Text>
                  <Text className="text-sm text-muted text-center">What do they want to do?</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity className="flex-1 bg-[#0066FF] rounded-2xl py-4 items-center" onPress={() => handleTossDecision(TossDecision.BAT)}>
                      <Text className="text-white font-bold">🏏 Bat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-[#0066FF] rounded-2xl py-4 items-center" onPress={() => handleTossDecision(TossDecision.BOWL)}>
                      <Text className="text-white font-bold">⚾ Bowl</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity className="mt-2 py-2 items-center" onPress={editLineupsAgain}>
                    <Text className="text-sm text-[#0066FF] font-semibold">← Edit Batting Order</Text>
                  </TouchableOpacity>
                </>
              )}
            </GlassCard>

            <TouchableOpacity className="bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10 rounded-2xl py-3 items-center" onPress={() => router.back()}>
              <Text className="text-foreground font-semibold">Cancel Match</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Lineup Phase */}
      {phase === "lineup" && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-5 gap-5">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-foreground tracking-tight">📋 Set Batting Order</Text>
              <Text className="text-sm text-muted">Drag players up/down to set the batting lineup</Text>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-2xl items-center ${editingTeam === 1 ? "bg-[#0066FF]" : "bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"}`}
                style={editingTeam !== 1 && Platform.OS === "web" ? {
                  backdropFilter: "blur(12px) saturate(180%)",
                  WebkitBackdropFilter: "blur(12px) saturate(180%)",
                } as any : {}}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTeam(1);
                }}
              >
                <Text className={`font-bold ${editingTeam === 1 ? "text-white" : "text-foreground"}`}>{team1}</Text>
                <Text className={`text-xs ${editingTeam === 1 ? "text-white/70" : "text-muted"}`}>{team1Lineup.length} players</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-2xl items-center ${editingTeam === 2 ? "bg-[#0066FF]" : "bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"}`}
                style={editingTeam !== 2 && Platform.OS === "web" ? {
                  backdropFilter: "blur(12px) saturate(180%)",
                  WebkitBackdropFilter: "blur(12px) saturate(180%)",
                } as any : {}}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTeam(2);
                }}
              >
                <Text className={`font-bold ${editingTeam === 2 ? "text-white" : "text-foreground"}`}>{team2}</Text>
                <Text className={`text-xs ${editingTeam === 2 ? "text-white/70" : "text-muted"}`}>{team2Lineup.length} players</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10 rounded-2xl p-3">
                <Text className="text-[10px] font-semibold text-muted">👑 Captain</Text>
                <Text className="text-sm font-bold text-foreground mt-1">{editingTeam === 1 ? (team1Captain || "—") : (team2Captain || "—")}</Text>
              </View>
              <View className="flex-1 bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10 rounded-2xl p-3">
                <Text className="text-[10px] font-semibold text-muted">🧤 Wicketkeeper</Text>
                <Text className="text-sm font-bold text-foreground mt-1">{editingTeam === 1 ? (team1Keeper || "—") : (team2Keeper || "—")}</Text>
              </View>
            </View>

            <View className="bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10 rounded-2xl overflow-hidden">
              {(editingTeam === 1 ? team1Lineup : team2Lineup).map((name, idx, arr) => {
                const isOpener = idx === 0 || idx === 1;
                const canUp = idx > 0;
                const canDown = idx < arr.length - 1;
                const isCaptain = (editingTeam === 1 && team1Captain === name) || (editingTeam === 2 && team2Captain === name);
                const isKeeper = (editingTeam === 1 && team1Keeper === name) || (editingTeam === 2 && team2Keeper === name);
                return (
                  <View key={name} className={`flex-row items-center px-4 py-3 border-b border-white/10 dark:border-white/[0.06] ${isOpener ? "bg-[#0066FF]/[0.03]" : ""}`}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${isOpener ? "bg-[#0066FF]" : "bg-white/50 dark:bg-white/10"}`}>
                      <Text className={`text-xs font-bold ${isOpener ? "text-white" : "text-foreground"}`}>{idx + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{name}</Text>
                        {isCaptain && <View className="bg-[#FF9F0A]/15 rounded-md px-1.5 py-0.5"><Text className="text-[10px] font-bold text-[#FF9F0A]">👑 C</Text></View>}
                        {isKeeper && <View className="bg-[#0066FF]/15 rounded-md px-1.5 py-0.5"><Text className="text-[10px] font-bold text-[#0066FF]">🧤 WK</Text></View>}
                        {isOpener && <View className="bg-[#0066FF]/10 rounded-md px-1.5 py-0.5"><Text className="text-[10px] font-bold text-[#0066FF]">OPEN</Text></View>}
                      </View>
                    </View>
                    <View className="flex-row gap-1">
                      <TouchableOpacity onPress={() => openRenamePlayer(idx, name)} className="w-8 h-8 rounded-xl items-center justify-center bg-white/50 dark:bg-white/[0.04] border border-white/20 dark:border-white/10">
                        <Text className="text-xs">✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleCaptain(editingTeam, name)} className={`w-8 h-8 rounded-xl items-center justify-center ${isCaptain ? "bg-[#FF9F0A]/20 border border-[#FF9F0A]/40" : "bg-white/50 dark:bg-white/[0.08] border border-white/30 dark:border-white/10"}`}>
                        <Text className="text-xs">👑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleKeeper(editingTeam, name)} className={`w-8 h-8 rounded-xl items-center justify-center ${isKeeper ? "bg-[#0066FF]/20 border border-[#0066FF]/40" : "bg-white/50 dark:bg-white/[0.08] border border-white/30 dark:border-white/10"}`}>
                        <Text className="text-xs">🧤</Text>
                      </TouchableOpacity>
                      <TouchableOpacity disabled={!canUp} onPress={() => movePlayerInLineup(editingTeam, idx, "up")} className="w-9 h-8 rounded-xl items-center justify-center bg-white/50 dark:bg-white/[0.08]">
                        <Text className={`font-bold text-base ${canUp ? "text-foreground" : "text-muted/30"}`}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity disabled={!canDown} onPress={() => movePlayerInLineup(editingTeam, idx, "down")} className="w-9 h-8 rounded-xl items-center justify-center bg-white/50 dark:bg-white/[0.08]">
                        <Text className={`font-bold text-base ${canDown ? "text-foreground" : "text-muted/30"}`}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <View className="bg-[#0066FF]/5 rounded-2xl p-3 border border-[#0066FF]/20 gap-1">
              <Text className="text-xs text-muted">💡 Tap ✏️ to edit player names. Tap 👑 to assign captain. Tap 🧤 to assign wicketkeeper.</Text>
              <Text className="text-xs text-muted">💡 Players at positions 1 & 2 are the opening batters.</Text>
            </View>

            <TouchableOpacity className="bg-[#0066FF] rounded-2xl py-4 items-center mt-2" onPress={confirmLineups}>
              <Text className="text-white font-bold text-lg">✅ Confirm & Proceed to Toss</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Rename Player Modal - outside ScrollView to avoid clipping */}
      {phase === "lineup" && editingPlayerIndex !== null && (
        <View className="absolute inset-0 z-50 justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            className="rounded-3xl p-6 gap-5"
            style={{
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 16,
              ...(Platform.OS === "web" ? {
                backdropFilter: "blur(32px) saturate(180%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%)",
              } : {}),
            }}
          >
            <View className="gap-1">
              <Text className="text-lg font-bold text-foreground tracking-tight">✏️ Rename Player</Text>
              <Text className="text-xs text-muted">
                {editingTeam === 1 ? team1 : team2} — Position {editingPlayerIndex !== null ? editingPlayerIndex + 1 : "—"}
              </Text>
            </View>

            <View
              className="rounded-2xl px-4 py-3 border"
              style={{
                backgroundColor: isDark ? "rgba(28,28,30,0.8)" : "rgba(242,242,247,0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              }}
            >
              <TextInput
                className="text-base font-semibold text-foreground"
                value={editingPlayerName}
                onChangeText={setEditingPlayerName}
                placeholder="Enter player name"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                autoFocus
                maxLength={25}
                selectTextOnFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center border"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" }}
                onPress={() => setEditingPlayerIndex(null)}
              >
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center"
                style={{ backgroundColor: "#0066FF" }}
                onPress={() => {
                  const lineup = editingTeam === 1 ? team1Lineup : team2Lineup;
                  if (editingPlayerIndex !== null && editingPlayerIndex < lineup.length) {
                    handleRenamePlayer(lineup[editingPlayerIndex], editingPlayerName);
                  }
                }}
              >
                <Text className="text-sm font-bold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Innings Break */}
      {inningBreak && (
        <View className="flex-1 items-center justify-center p-5">
          <GlassCard intensity="high" padding="xl" radius="xl" className="items-center gap-3" blurAmount={30} staggerIndex={0}>
            <Text className="text-2xl font-bold text-foreground text-center tracking-tight">End of Innings {phase === "innings-1" ? "1" : "2"}</Text>
            {uiState?.currentInnings && (
              <Text className="text-lg text-muted">{uiState.currentInnings.battingTeam}: {uiState.currentInnings.totalRuns}/{uiState.currentInnings.totalWickets} ({uiState.oversString} ov)</Text>
            )}
            <Text className="text-sm text-muted">Preparing next innings...</Text>
          </GlassCard>
        </View>
      )}

      {/* Live Innings */}
      {(phase === "innings-1" || phase === "innings-2") && !inningBreak && scorecardProps && (
        <LiveScorecard {...scorecardProps} />
      )}

      {/* Result Phase */}
      {phase === "result" && uiState?.matchResult && (
        <View className="flex-1 p-5 justify-center items-center gap-5">
          <GlassCard intensity="high" glowColor="#34C759" padding="xl" radius="xl" className="w-full gap-4 py-8" blurAmount={30} staggerIndex={0}>
            <LiquidGlassOverlay color="#34C759" variant="pulse" speed={1.5} intensity={0.6} />
            <Text className="text-2xl font-bold text-foreground text-center">🏆 Match Complete</Text>
            <Text className="text-lg font-bold text-[#34C759] text-center">{uiState.matchResult.description}</Text>

            <View className="gap-3">
              <View className="bg-white/40 dark:bg-white/[0.05] rounded-2xl p-4">
                <Text className="text-sm font-semibold text-muted">{team1}</Text>
                <Text className="text-xl font-bold text-foreground">{uiState.matchResult.team1Score || (uiState.matchState.innings[0] ? `${uiState.matchState.innings[0].totalRuns}/${uiState.matchState.innings[0].totalWickets} (${CricketRulesEngine.formatOversString(uiState.matchState.innings[0].totalBalls, ballsPerOver)} ov)` : "")}</Text>
              </View>
              <View className="bg-white/40 dark:bg-white/[0.05] rounded-2xl p-4">
                <Text className="text-sm font-semibold text-muted">{team2}</Text>
                <Text className="text-xl font-bold text-foreground">{uiState.matchResult.team2Score || (uiState.matchState.innings[1] ? `${uiState.matchState.innings[1].totalRuns}/${uiState.matchState.innings[1].totalWickets} (${CricketRulesEngine.formatOversString(uiState.matchState.innings[1].totalBalls, ballsPerOver)} ov)` : "")}</Text>
              </View>
            </View>
          </GlassCard>

          <View className="flex-col gap-3 w-full">
            <TouchableOpacity
              className="bg-[#34C759] rounded-2xl py-4 items-center flex-row justify-center gap-2"
              style={{ shadowColor: "#34C759", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 }}
              onPress={async () => { if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowShareModal(true); }}
            >
              <Text className="text-white font-bold text-lg">📤 Share Scorecard</Text>
            </TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-[#0066FF] rounded-2xl py-4 items-center" onPress={handleEndMatch}>
                <Text className="text-white font-bold">Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10 rounded-2xl py-4 items-center" onPress={() => { createMatch(format, team1, team2, overs, ballsPerOver, playersPerSide, inningsCount); setPhase("pre-match"); setTossWinner(""); setTossDecision(null); }}>
                <Text className="text-foreground font-bold">New Match</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showShareModal && shareScorecardData && (
        <ShareScorecardModal data={shareScorecardData} onClose={() => setShowShareModal(false)} />
      )}
    </ScreenContainer>
  );
}
