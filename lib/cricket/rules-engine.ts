/**
 * Cricket Rules Engine
 * Implements comprehensive cricket rules and match logic
 */

export enum DismissalType {
  BOWLED = "bowled",
  LBW = "lbw",
  CAUGHT = "caught",
  STUMPED = "stumped",
  RUN_OUT = "run_out",
  HANDLED_BALL = "handled_ball",
  HIT_WICKET = "hit_wicket",
  OBSTRUCTING = "obstructing",
  TIMED_OUT = "timed_out",
  RETIRED = "retired",
}

export enum ExtraType {
  WIDE = "wide",
  NO_BALL = "no_ball",
  BYE = "bye",
  LEG_BYE = "leg_bye",
}

export interface Ball {
  ballNumber: number;
  overNumber: number;
  runs: number;
  extras: ExtraType | null;
  extraRuns: number;
  isWicket: boolean;
  dismissalType?: DismissalType;
  dismissedPlayer?: string;
  bowler: string;
  batsman: string;
  timestamp: Date;
}

export interface Batsman {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  strikeRate: number;
}

export interface Bowler {
  id: string;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economyRate: number;
  lastThreeBalls: Ball[];
}

export interface Innings {
  inningsNumber: number;
  teamId: string;
  teamName: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  ballsList: Ball[];
  batsmen: Batsman[];
  bowlers: Bowler[];
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  isComplete: boolean;
  completedAt?: Date;
}

export interface MatchState {
  matchId: string;
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
  format: "T20" | "ODI" | "TEST" | "CUSTOM";
  maxOvers: number;
  currentInnings: number;
  innings: Innings[];
  currentBatsman: Batsman | null;
  nextBatsman: Batsman | null;
  currentBowler: Bowler | null;
  striker: Batsman | null;
  nonStriker: Batsman | null;
  isLive: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export class CricketRulesEngine {
  /**
   * Calculate strike rate
   */
  static calculateStrikeRate(runs: number, balls: number): number {
    if (balls === 0) return 0;
    return (runs / balls) * 100;
  }

  /**
   * Calculate economy rate
   */
  static calculateEconomyRate(runs: number, overs: number): number {
    if (overs === 0) return 0;
    return runs / overs;
  }

  /**
   * Calculate overs from total balls
   */
  static calculateOvers(totalBalls: number): { overs: number; balls: number } {
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return { overs, balls };
  }

  /**
   * Validate if over is complete
   */
  static isOverComplete(ballsInOver: number, isWicket: boolean): boolean {
    // Over is complete when 6 legal balls are bowled
    // Wides and no-balls don't count as legal balls
    return ballsInOver === 6;
  }

  /**
   * Validate if match is complete
   */
  static isMatchComplete(innings: Innings[], maxOvers: number, format: string): boolean {
    if (innings.length === 1) {
      // First innings complete if max overs reached or all wickets lost
      const firstInnings = innings[0];
      const oversCompleted = firstInnings.totalOvers >= maxOvers;
      const allWicketsLost = firstInnings.totalWickets === 10;
      return oversCompleted || allWicketsLost;
    }

    if (innings.length === 2) {
      const secondInnings = innings[1];
      const oversCompleted = secondInnings.totalOvers >= maxOvers;
      const allWicketsLost = secondInnings.totalWickets === 10;
      const targetReached = secondInnings.totalRuns > innings[0].totalRuns;
      return (oversCompleted || allWicketsLost) || targetReached;
    }

    return false;
  }

  /**
   * Get match result
   */
  static getMatchResult(
    innings: Innings[],
    team1Name: string,
    team2Name: string
  ): { winner: string; margin: string; result: string } {
    if (innings.length < 2) {
      return { winner: "N/A", margin: "0", result: "Match in progress" };
    }

    const team1Runs = innings[0].totalRuns;
    const team2Runs = innings[1].totalRuns;
    const team1Wickets = innings[0].totalWickets;
    const team2Wickets = innings[1].totalWickets;

    if (team2Runs > team1Runs) {
      const margin = team2Runs - team1Runs;
      return {
        winner: team2Name,
        margin: `${margin} runs`,
        result: `${team2Name} won by ${margin} runs`,
      };
    } else if (team1Runs > team2Runs) {
      const margin = 10 - team2Wickets;
      return {
        winner: team1Name,
        margin: `${margin} wickets`,
        result: `${team1Name} won by ${margin} wickets`,
      };
    } else {
      return {
        winner: "Tie",
        margin: "0",
        result: "Match tied",
      };
    }
  }

  /**
   * Validate scoring action
   */
  static validateScoring(
    runs: number,
    extraType: ExtraType | null,
    isWicket: boolean
  ): { valid: boolean; error?: string } {
    if (isWicket && runs > 0) {
      return { valid: false, error: "Cannot score runs and get wicket simultaneously" };
    }

    if (runs < 0 || runs > 6) {
      return { valid: false, error: "Invalid runs: must be 0-6" };
    }

    if (extraType && (extraType === ExtraType.WIDE || extraType === ExtraType.NO_BALL)) {
      if (runs > 0 && runs !== 1) {
        return { valid: false, error: "Wide/No-ball can only have 0 or 1 run" };
      }
    }

    return { valid: true };
  }

  /**
   * Calculate total runs in over
   */
  static calculateOverRuns(balls: Ball[]): number {
    return balls.reduce((sum, ball) => {
      return sum + ball.runs + ball.extraRuns;
    }, 0);
  }

  /**
   * Get legal balls count (excludes wides and no-balls)
   */
  static getLegalBallsCount(balls: Ball[]): number {
    return balls.filter((ball) => {
      return ball.extras !== ExtraType.WIDE && ball.extras !== ExtraType.NO_BALL;
    }).length;
  }
}
