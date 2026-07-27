/**
 * Unified Match State Hook
 * Connects the advanced CricketRulesEngine to React state management
 * Handles full match lifecycle: toss -> innings -> scoring -> result
 */
import { useState, useCallback, useRef, useMemo } from "react";
import {
  CricketRulesEngine,
  MatchFormat,
  MatchStatus,
  TossDecision,
  ExtraType,
  DismissalType,
  type MatchState,
  type BallRecord,
  type BatterStats,
  type BowlerStats,
  type InningsState,
  type FallOfWicket,
  type Partnership,
  type PowerplayPhase,
  type MatchResult,
  type BowlingFigures,
} from "@/lib/cricket/advanced-rules-engine";

export interface ScoringEvent {
  type: "run" | "extra" | "wicket";
  runsOffBat: number;
  extraType?: ExtraType;
  extraRuns?: number;
  dismissalType?: DismissalType;
  batterOut?: string;
  fielderInvolved?: string;
}

export interface MatchUIState {
  matchState: MatchState;
  currentInnings: InningsState | undefined;
  striker: BatterStats | undefined;
  nonStriker: BatterStats | undefined;
  currentBowler: BowlerStats | undefined;
  recentDeliveries: BallRecord[];
  powerplayPhase: PowerplayPhase | null;
  fallOfWickets: FallOfWicket[];
  currentRunRate: number;
  requiredRunRate: number;
  projectedScore: number;
  isSecondInnings: boolean;
  isInningsComplete: boolean;
  oversString: string;
  battingOrder: BatterStats[];
  bowlersFigures: BowlingFigures[];
  matchResult: MatchResult | undefined;
  /** Current partnership between the two batters at the crease */
  currentPartnership: Partnership | null;
  /** Name of the bowler who bowled the previous over */
  lastOverBowlerName?: string;
}

export function useMatchState() {
  const engineRef = useRef<CricketRulesEngine | null>(null);
  const [, forceUpdate] = useState(0);

  const getUIState = useCallback((): MatchUIState | null => {
    const engine = engineRef.current;
    if (!engine) return null;

    const matchState = engine.getState();
    const currentInnings = engine.getCurrentInnings();

    if (!currentInnings) {
    return {
      matchState,
      currentInnings: undefined,
      striker: undefined,
      nonStriker: undefined,
      currentBowler: undefined,
      recentDeliveries: [],
      powerplayPhase: null,
      fallOfWickets: [],
      currentRunRate: 0,
      requiredRunRate: 0,
      projectedScore: 0,
      isSecondInnings: matchState.currentInnings === 2,
      isInningsComplete: false,
      oversString: "0.0",
      battingOrder: [],
      bowlersFigures: [],
      matchResult: undefined,
      currentPartnership: null,
      lastOverBowlerName: undefined,
    };
    }

    const striker = currentInnings.battingOrder[currentInnings.currentStriker];
    const nonStriker = currentInnings.battingOrder[currentInnings.currentNonStriker];
    const currentBowler = currentInnings.currentBowlerIndex !== null
      ? currentInnings.bowlers[currentInnings.currentBowlerIndex]
      : undefined;

    return {
      matchState,
      currentInnings,
      striker,
      nonStriker,
      currentBowler,
      recentDeliveries: engine.getRecentDeliveries(8),
      powerplayPhase: engine.getPowerplayPhase(currentInnings),
      fallOfWickets: currentInnings.fallOfWickets,
      currentRunRate: engine.getCurrentRunRate(currentInnings),
      requiredRunRate: engine.getRequiredRunRate(currentInnings),
      projectedScore: currentInnings.totalOvers > 0
        ? Math.round((currentInnings.totalRuns / currentInnings.totalOvers) * matchState.maxOvers)
        : 0,
      isSecondInnings: matchState.currentInnings === 2,
      isInningsComplete: currentInnings.isComplete,
      oversString: engine.getOversString(currentInnings),
      battingOrder: currentInnings.battingOrder,
      bowlersFigures: engine.getBowlingFigures(),
      matchResult: engine.getResult(),
      currentPartnership: engine.getCurrentPartnership(currentInnings),
      lastOverBowlerName: currentInnings.lastOverBowlerName,
    };
  }, []);

  const refresh = useCallback(() => {
    forceUpdate(n => n + 1);
  }, []);

  // ============= MATCH LIFECYCLE =============

  const createMatch = useCallback((
    format: MatchFormat,
    team1: string,
    team2: string,
    customOvers?: number,
    customBallsPerOver?: number,
    playersPerSide?: number,
    customInningsCount?: number
  ) => {
    engineRef.current = new CricketRulesEngine(format, team1, team2, customOvers, customBallsPerOver, playersPerSide, customInningsCount);
    refresh();
  }, [refresh]);

  const recordToss = useCallback((winner: string, decision: TossDecision) => {
    engineRef.current?.recordToss(winner, decision);
    refresh();
  }, [refresh]);

  const startMatch = useCallback(() => {
    try {
      engineRef.current?.startMatch();
      refresh();
      return true;
    } catch (e: any) {
      console.error("Failed to start match:", e.message);
      return false;
    }
  }, [refresh]);

  const endMatch = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    // Force end by ending any active innings
    const currentInnings = engine.getCurrentInnings();
    if (currentInnings && !currentInnings.isComplete) {
      engine.endInnings(false);
    }
    refresh();
  }, [refresh]);

  // ============= BATTER/BOWLER MANAGEMENT =============

  const addBatter = useCallback((playerId: string, name: string) => {
    engineRef.current?.addBatter(playerId, name);
    refresh();
  }, [refresh]);

  const addBowler = useCallback((playerId: string, name: string) => {
    engineRef.current?.addBowler(playerId, name);
    refresh();
  }, [refresh]);

  const setOpeningBatters = useCallback((batter1: string, batter2: string) => {
    engineRef.current?.setOpeningBatters(batter1, batter2);
    refresh();
  }, [refresh]);

  const setCurrentBowler = useCallback((bowlerName: string) => {
    engineRef.current?.setCurrentBowler(bowlerName);
    refresh();
  }, [refresh]);

  const setBattingOrder = useCallback((playerNames: string[]) => {
    engineRef.current?.setBattingOrder(playerNames);
    refresh();
  }, [refresh]);

  const getPendingBatterNames = useCallback((): string[] => {
    return engineRef.current?.getPendingBatterNames() ?? [];
  }, []);

  // ============= SCORING =============

  const recordDelivery = useCallback((event: ScoringEvent) => {
    try {
      const engine = engineRef.current;
      if (!engine) return false;

      engine.recordDelivery({
        runsOffBat: event.runsOffBat,
        extraType: event.extraType,
        extraRuns: event.extraRuns,
        isWicket: event.type === "wicket",
        dismissalType: event.dismissalType,
        batterOut: event.batterOut,
        fielderInvolved: event.fielderInvolved,
      });

      refresh();
      return true;
    } catch (e: any) {
      console.error("Failed to record delivery:", e.message);
      return false;
    }
  }, [refresh]);

  const recordRun = useCallback((runs: number) => {
    return recordDelivery({ type: "run", runsOffBat: runs });
  }, [recordDelivery]);

  const recordExtra = useCallback((extraType: ExtraType, runsOffBat: number = 0, extraRuns: number = 1) => {
    return recordDelivery({ type: "extra", runsOffBat, extraType, extraRuns });
  }, [recordDelivery]);

  const recordWicket = useCallback((
    dismissalType: DismissalType,
    batterOut: string,
    fielderInvolved?: string
  ) => {
    return recordDelivery({
      type: "wicket",
      runsOffBat: 0,
      dismissalType,
      batterOut,
      fielderInvolved,
    });
  }, [recordDelivery]);

  const undoLastBall = useCallback(() => {
    try {
      const engine = engineRef.current;
      if (!engine) return false;
      const result = engine.undoLastDelivery();
      if (result) refresh();
      return result;
    } catch (e: any) {
      console.error("Failed to undo last ball:", e.message);
      return false;
    }
  }, [refresh]);

  const endInnings = useCallback(() => {
    engineRef.current?.endInnings(false);
    refresh();
  }, [refresh]);

  const declareInnings = useCallback(() => {
    engineRef.current?.endInnings(true);
    refresh();
  }, [refresh]);

  // ============= UTILITY =============

  const getState = useCallback((): MatchState | null => {
    return engineRef.current?.getState() ?? null;
  }, []);

  const isMatchActive = useCallback((): boolean => {
    const engine = engineRef.current;
    if (!engine) return false;
    const state = engine.getState();
    return state.status === MatchStatus.IN_PROGRESS;
  }, []);

  const isMatchComplete = useCallback((): boolean => {
    const engine = engineRef.current;
    if (!engine) return false;
    const state = engine.getState();
    return state.status === MatchStatus.COMPLETED;
  }, []);

  return {
    // Engine access
    getState,
    getUIState,
    isMatchActive,
    isMatchComplete,

    // Match lifecycle
    createMatch,
    recordToss,
    startMatch,
    endMatch,

    // Roster management
    addBatter,
    addBowler,
    setOpeningBatters,
    setCurrentBowler,
    setBattingOrder,
    getPendingBatterNames,

    // Scoring
    recordDelivery,
    recordRun,
    recordExtra,
    recordWicket,
    undoLastBall,
    endInnings,
    declareInnings,
  };
}
