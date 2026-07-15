import { useState, useCallback } from "react";

/**
 * Ball data structure
 */
export interface BallData {
  runs: number;
  extras: number;
  extraType?: "wide" | "no-ball" | "bye" | "leg-bye";
  isWicket: boolean;
  dismissalType?: string;
}

/**
 * Batsman data structure
 */
export interface BatsmanData {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  status: "batting" | "out" | "dnb";
}

/**
 * Bowler data structure
 */
export interface BowlerData {
  id: string;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economyRate: number;
}

/**
 * Innings data structure
 */
export interface InningsData {
  teamId: string;
  teamName: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  balls: BallData[];
  batsmen: BatsmanData[];
  bowlers: BowlerData[];
  currentBatsmanIndex: number;
  currentBowlerIndex: number;
}

/**
 * Hook for managing cricket scoring logic
 */
export function useScoring() {
  const [innings, setInnings] = useState<InningsData | null>(null);

  /**
   * Calculate strike rate: (runs / balls) * 100
   */
  const calculateStrikeRate = useCallback((runs: number, balls: number): number => {
    if (balls === 0) return 0;
    return Math.round((runs / balls) * 10000) / 100; // Rounded to 2 decimals
  }, []);

  /**
   * Calculate economy rate: (runs conceded / overs bowled)
   */
  const calculateEconomyRate = useCallback((runs: number, overs: number): number => {
    if (overs === 0) return 0;
    return Math.round((runs / overs) * 100) / 100; // Rounded to 2 decimals
  }, []);

  /**
   * Initialize innings
   */
  const initializeInnings = useCallback(
    (teamId: string, teamName: string, batsmanId: string, batsmanName: string, bowlerId: string, bowlerName: string) => {
      const newInnings: InningsData = {
        teamId,
        teamName,
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        totalBalls: 0,
        balls: [],
        batsmen: [
          {
            id: batsmanId,
            name: batsmanName,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            status: "batting",
          },
        ],
        bowlers: [
          {
            id: bowlerId,
            name: bowlerName,
            overs: 0,
            balls: 0,
            runs: 0,
            wickets: 0,
            maidens: 0,
            economyRate: 0,
          },
        ],
        currentBatsmanIndex: 0,
        currentBowlerIndex: 0,
      };
      setInnings(newInnings);
    },
    []
  );

  /**
   * Record a ball
   */
  const recordBall = useCallback(
    (runs: number, extras: number = 0, extraType?: string, isWicket: boolean = false, dismissalType?: string) => {
      if (!innings) return;

      const newInnings = { ...innings };
      const currentBatsman = newInnings.batsmen[newInnings.currentBatsmanIndex];
      const currentBowler = newInnings.bowlers[newInnings.currentBowlerIndex];

      // Create ball record
      const ballData: BallData = {
        runs,
        extras,
        extraType: extraType as any,
        isWicket,
        dismissalType,
      };

      // Update batsman stats
      if (!isWicket) {
        currentBatsman.runs += runs;
        currentBatsman.balls += 1;

        // Count fours and sixes
        if (runs === 4) currentBatsman.fours += 1;
        if (runs === 6) currentBatsman.sixes += 1;

        // Update strike rate
        currentBatsman.strikeRate = calculateStrikeRate(currentBatsman.runs, currentBatsman.balls);
      } else {
        currentBatsman.status = "out";
        currentBatsman.balls += 1;
      }

      // Update bowler stats
      currentBowler.balls += 1;
      currentBowler.runs += runs + extras;

      if (isWicket) {
        currentBowler.wickets += 1;
      }

      // Check if over is complete (6 balls)
      if (currentBowler.balls % 6 === 0) {
        currentBowler.overs = Math.floor(currentBowler.balls / 6);
        currentBowler.economyRate = calculateEconomyRate(currentBowler.runs, currentBowler.overs);
      }

      // Update innings totals
      newInnings.totalRuns += runs + extras;
      newInnings.totalBalls += 1;
      if (newInnings.totalBalls % 6 === 0) {
        newInnings.totalOvers = Math.floor(newInnings.totalBalls / 6);
      }

      if (isWicket) {
        newInnings.totalWickets += 1;
      }

      // Add ball to history
      newInnings.balls.push(ballData);

      setInnings(newInnings);
    },
    [innings, calculateStrikeRate, calculateEconomyRate]
  );

  /**
   * Undo last ball
   */
  const undoLastBall = useCallback(() => {
    if (!innings || innings.balls.length === 0) return;

    const newInnings = { ...innings };
    const lastBall = newInnings.balls.pop();

    if (!lastBall) return;

    const currentBatsman = newInnings.batsmen[newInnings.currentBatsmanIndex];
    const currentBowler = newInnings.bowlers[newInnings.currentBowlerIndex];

    // Reverse batsman updates
    currentBatsman.runs -= lastBall.runs;
    currentBatsman.balls -= 1;

    if (lastBall.runs === 4) currentBatsman.fours -= 1;
    if (lastBall.runs === 6) currentBatsman.sixes -= 1;

    currentBatsman.strikeRate = calculateStrikeRate(currentBatsman.runs, currentBatsman.balls);

    if (lastBall.isWicket) {
      currentBatsman.status = "batting";
    }

    // Reverse bowler updates
    currentBowler.balls -= 1;
    currentBowler.runs -= lastBall.runs + lastBall.extras;

    if (lastBall.isWicket) {
      currentBowler.wickets -= 1;
    }

    currentBowler.overs = Math.floor(currentBowler.balls / 6);
    currentBowler.economyRate = calculateEconomyRate(currentBowler.runs, currentBowler.overs);

    // Reverse innings totals
    newInnings.totalRuns -= lastBall.runs + lastBall.extras;
    newInnings.totalBalls -= 1;
    newInnings.totalOvers = Math.floor(newInnings.totalBalls / 6);

    if (lastBall.isWicket) {
      newInnings.totalWickets -= 1;
    }

    setInnings(newInnings);
  }, [innings, calculateStrikeRate, calculateEconomyRate]);

  /**
   * Add new batsman
   */
  const addBatsman = useCallback(
    (batsmanId: string, batsmanName: string) => {
      if (!innings) return;

      const newInnings = { ...innings };
      newInnings.batsmen.push({
        id: batsmanId,
        name: batsmanName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        status: "batting",
      });
      newInnings.currentBatsmanIndex = newInnings.batsmen.length - 1;
      setInnings(newInnings);
    },
    [innings]
  );

  /**
   * Add new bowler
   */
  const addBowler = useCallback(
    (bowlerId: string, bowlerName: string) => {
      if (!innings) return;

      const newInnings = { ...innings };
      newInnings.bowlers.push({
        id: bowlerId,
        name: bowlerName,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        economyRate: 0,
      });
      newInnings.currentBowlerIndex = newInnings.bowlers.length - 1;
      setInnings(newInnings);
    },
    [innings]
  );

  /**
   * Get current batsman
   */
  const getCurrentBatsman = useCallback((): BatsmanData | null => {
    if (!innings) return null;
    return innings.batsmen[innings.currentBatsmanIndex] || null;
  }, [innings]);

  /**
   * Get current bowler
   */
  const getCurrentBowler = useCallback((): BowlerData | null => {
    if (!innings) return null;
    return innings.bowlers[innings.currentBowlerIndex] || null;
  }, [innings]);

  return {
    innings,
    initializeInnings,
    recordBall,
    undoLastBall,
    addBatsman,
    addBowler,
    getCurrentBatsman,
    getCurrentBowler,
    calculateStrikeRate,
    calculateEconomyRate,
  };
}
