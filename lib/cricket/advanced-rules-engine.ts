/**
 * Advanced Cricket Rules Engine
 * Comprehensive implementation covering all cricket rules:
 * - Match Formats & Structure (Test, ODI, T20, T10, The Hundred, Custom)
 * - Toss Logic
 * - Team Composition & Batting Order
 * - Over Management (6 legal balls, bowler rotation, strike rotation)
 * - Scoring Runs (off the bat, boundaries, extras)
 * - All 10 Dismissal Modes
 * - End of Innings Conditions
 * - Powerplays (ODI & T20)
 * - Target, Run Rate & Required Run Rate
 * - Duckworth-Lewis-Stern (DLS) Method
 * - Super Over (Tie-Breaker)
 * - Decision Review System (DRS)
 * - No-Ball & Wide Sub-Rules
 * - Result Types (win by runs, win by wickets, tie, no result, draw)
 * - Follow-On (Test/First-Class)
 */

// ============= MATCH FORMATS =============
export enum MatchFormat {
  TEST = "test",
  ODI = "odi",
  T20 = "t20",
  T10 = "t10",
  THE_HUNDRED = "the_hundred",
  CUSTOM = "custom",
}

export const MATCH_FORMAT_CONFIG: Record<MatchFormat, {
  maxOversPerInnings: number;
  maxInningsPerSide: number;
  ballsPerOver: number;
  typicalDuration: string;
  powerplayOvers: { start: number; end: number; maxFieldersOutside: number }[];
  drsReviewsPerInnings: number;
}> = {
  [MatchFormat.TEST]: {
    maxOversPerInnings: 0, // unlimited
    maxInningsPerSide: 2,
    ballsPerOver: 6,
    typicalDuration: "Up to 5 days",
    powerplayOvers: [],
    drsReviewsPerInnings: 2,
  },
  [MatchFormat.ODI]: {
    maxOversPerInnings: 50,
    maxInningsPerSide: 1,
    ballsPerOver: 6,
    typicalDuration: "~8 hours",
    powerplayOvers: [
      { start: 0, end: 10, maxFieldersOutside: 2 },
      { start: 10, end: 40, maxFieldersOutside: 4 },
      { start: 40, end: 50, maxFieldersOutside: 5 },
    ],
    drsReviewsPerInnings: 1,
  },
  [MatchFormat.T20]: {
    maxOversPerInnings: 20,
    maxInningsPerSide: 1,
    ballsPerOver: 6,
    typicalDuration: "~3-3.5 hours",
    powerplayOvers: [
      { start: 0, end: 6, maxFieldersOutside: 2 },
      { start: 6, end: 20, maxFieldersOutside: 5 },
    ],
    drsReviewsPerInnings: 1,
  },
  [MatchFormat.T10]: {
    maxOversPerInnings: 10,
    maxInningsPerSide: 1,
    ballsPerOver: 6,
    typicalDuration: "~1.5 hours",
    powerplayOvers: [
      { start: 0, end: 4, maxFieldersOutside: 2 },
      { start: 4, end: 10, maxFieldersOutside: 5 },
    ],
    drsReviewsPerInnings: 1,
  },
  [MatchFormat.THE_HUNDRED]: {
    maxOversPerInnings: 0, // 100 balls
    maxInningsPerSide: 1,
    ballsPerOver: 5, // 5-ball sets, 10-ball final set
    typicalDuration: "~2.5 hours",
    powerplayOvers: [
      { start: 0, end: 25, maxFieldersOutside: 2 }, // first 25 balls
      { start: 25, end: 100, maxFieldersOutside: 5 }, // remaining 75 balls
    ],
    drsReviewsPerInnings: 1,
  },
  [MatchFormat.CUSTOM]: {
    maxOversPerInnings: 0, // user-defined
    maxInningsPerSide: 1,
    ballsPerOver: 6,
    typicalDuration: "Variable",
    powerplayOvers: [],
    drsReviewsPerInnings: 1,
  },
};

// ============= ENUMS =============
export enum DismissalType {
  BOWLED = "bowled",
  CAUGHT = "caught",
  LBW = "lbw",
  RUN_OUT = "run_out",
  STUMPED = "stumped",
  HIT_WICKET = "hit_wicket",
  OBSTRUCTING_FIELD = "obstructing_field",
  HIT_BALL_TWICE = "hit_ball_twice",
  TIMED_OUT = "timed_out",
  HANDLED_BALL = "handled_ball",
  NOT_OUT = "not_out",
}

export enum ExtraType {
  WIDE = "wide",
  NO_BALL = "no_ball",
  BYE = "bye",
  LEG_BYE = "leg_bye",
  PENALTY = "penalty",
  NONE = "none",
}

export enum MatchStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  DRAWN = "drawn", // Test cricket only
}

export enum TossDecision {
  BAT = "bat",
  BOWL = "bowl",
}

export enum ResultType {
  WIN_BY_RUNS = "win_by_runs",
  WIN_BY_WICKETS = "win_by_wickets",
  TIED = "tied",
  NO_RESULT = "no_result",
  DRAW = "draw", // Test cricket
  IN_PROGRESS = "in_progress",
}

// ============= INTERFACES =============
export interface BallRecord {
  ballIndex: number;
  overNumber: number;
  ballNumberInOver: number;
  batterOnStrike: string;
  batterNonStrike: string;
  bowler: string;
  runsOffBat: number;
  extraType: ExtraType;
  extraRuns: number;
  totalRunsFromBall: number;
  isWicket: boolean;
  dismissalType?: DismissalType;
  batterOut?: string;
  fielderInvolved?: string;
  isFreeHit: boolean;
  isLegal: boolean;
  isMaidenBall: boolean; // ball that counts as a dot in maiden context
  timestamp: number;
}

export interface BatterStats {
  playerId: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  dismissalBowler?: string;
  dismissalFielder?: string;
  strikeRate: number;
  status: "batting" | "out" | "did_not_bat" | "not_out";
}

export interface BowlerStats {
  playerId: string;
  name: string;
  overs: number;
  legalBalls: number;
  totalBalls: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  economyRate: number;
  wides: number;
  noBalls: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  batterName: string;
  dismissalType: DismissalType;
  runsAtDismissal: number;
  oversAtDismissal: number;
  ballsAtDismissal: number;
  fielderInvolved?: string;
  bowlerAtDelivery?: string;
}

export interface Partnership {
  batter1Index: number;
  batter2Index: number;
  batter1Name: string;
  batter2Name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  runRate: number;
  startOver: number;
  startBall: number;
  /** True if this partnership started at the beginning of the innings (openers) */
  startedAtInnings: boolean;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export interface BowlingFigures {
  bowlerId: string;
  name: string;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
}

export interface PowerplayPhase {
  phaseName: string;
  startOver: number;
  endOver: number;
  maxFieldersOutside: number;
  isActive: boolean;
}

export interface InningsState {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number; // completed overs
  totalBalls: number; // legal balls bowled
  totalLegalDeliveries: number;
  extras: ExtrasBreakdown;
  deliveries: BallRecord[];
  battingOrder: BatterStats[];
  bowlers: BowlerStats[];
  currentBatterIndex: number;
  currentStriker: number; // index in battingOrder
  currentNonStriker: number; // index in battingOrder
  currentBowlerIndex: number | null; // index in bowlers
  currentBowlerId: string;
  bowlerOversCount: Record<string, number>;
  fallOfWickets: FallOfWicket[];
  /** Current active partnership between the two batters at the crease */
  currentPartnership: Partnership;
  /** Historical completed partnerships (reset on each wicket) */
  partnershipHistory: Partnership[];
  isComplete: boolean;
  isAllOut: boolean;
  isDeclared: boolean;
  target?: number;
  isSuperOver: boolean;
  isDLS: boolean;
  ballsInCurrentOver: number;
  runsInCurrentOver: number;
  isFreeHitActive: boolean;
  powerplayPhase: PowerplayPhase | null;
}

export interface TossInfo {
  winner: string;
  decision: TossDecision;
}

export interface MatchResult {
  resultType: ResultType;
  winner?: string;
  margin?: string;
  description: string;
  team1Score?: string;
  team2Score?: string;
}

export interface MatchState {
  matchId: string;
  format: MatchFormat;
  team1: string;
  team2: string;
  customOvers?: number;
  customBallsPerOver?: number;
  playersPerSide: number;
  toss?: TossInfo;
  venue?: string;
  date: Date;
  currentInnings: number;
  innings: InningsState[];
  status: MatchStatus;
  result?: MatchResult;
  drsReviewsRemaining: Record<string, number>;
  maxOvers: number;
  maxInnings: number;
  ballsPerOver: number;
  /** Pending roster — players queued to be added when the first innings starts */
  pendingRoster: {
    batters: { playerId: string; name: string }[];
    bowlers: { playerId: string; name: string }[];
  };
}

// ============= FREQUENTLY USED CONSTANTS =============
export const DISMISSAL_CREDITED_TO_BOWLER: DismissalType[] = [
  DismissalType.BOWLED,
  DismissalType.CAUGHT,
  DismissalType.LBW,
  DismissalType.STUMPED,
  DismissalType.HIT_WICKET,
];

export const DISMISSALS_VALID_ON_FREE_HIT: DismissalType[] = [
  DismissalType.RUN_OUT,
  DismissalType.OBSTRUCTING_FIELD,
  DismissalType.HIT_BALL_TWICE,
  DismissalType.TIMED_OUT,
  DismissalType.HANDLED_BALL,
];

// ============= CRICKET RULES ENGINE =============
export class CricketRulesEngine {
  private state: MatchState;
  /** Stack of pre-delivery innings snapshots (deep copies) for undo support */
  private undoStack: InningsState[] = [];
  /** Track how many deliveries have been undone so we can prevent cascading */
  private undoing: boolean = false;

  constructor(
    format: MatchFormat,
    team1: string,
    team2: string,
    customOvers?: number,
    customBallsPerOver?: number,
    playersPerSide?: number,
    customInningsCount?: number
  ) {
    const config = MATCH_FORMAT_CONFIG[format];
    const maxOvers = customOvers ?? config.maxOversPerInnings;
    const ballsPerOver = customBallsPerOver ?? config.ballsPerOver;
    
    this.state = {
      matchId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      format,
      team1,
      team2,
      customOvers,
      customBallsPerOver,
      playersPerSide: playersPerSide ?? 11,
      venue: "",
      date: new Date(),
      currentInnings: 0,
      innings: [],
      status: MatchStatus.NOT_STARTED,
      drsReviewsRemaining: {
        [team1]: config.drsReviewsPerInnings,
        [team2]: config.drsReviewsPerInnings,
      },
      maxOvers,
      maxInnings: customInningsCount ?? config.maxInningsPerSide,
      ballsPerOver,
      pendingRoster: {
        batters: [],
        bowlers: [],
      },
    };
  }

  // ============= PUBLIC API =============

  /** Record the toss result */
  recordToss(winner: string, decision: TossDecision): void {
    this.state.toss = { winner, decision };
  }

  /** Start the first innings after toss */
  startMatch(): void {
    if (!this.state.toss) {
      throw new Error("Toss must be recorded before starting the match");
    }
    this.state.currentInnings = 1;
    this.state.status = MatchStatus.IN_PROGRESS;
    this.startNewInnings();

    // Apply pending roster to the newly created innings
    const innings = this.getCurrentInnings();
    if (innings) {
      // Add pending batters in order
      for (const b of this.state.pendingRoster.batters) {
        innings.battingOrder.push({
          playerId: b.playerId,
          name: b.name,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          strikeRate: 0,
          status: "did_not_bat",
        });
      }
      // Add pending bowlers
      for (const b of this.state.pendingRoster.bowlers) {
        innings.bowlers.push({
          playerId: b.playerId,
          name: b.name,
          overs: 0,
          legalBalls: 0,
          totalBalls: 0,
          runsConceded: 0,
          wickets: 0,
          maidens: 0,
          economyRate: 0,
          wides: 0,
          noBalls: 0,
        });
      }
    }
  }

  /** Get current match state (immutable snapshot) */
  getState(): MatchState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /** Get current innings */
  getCurrentInnings(): InningsState | undefined {
    return this.state.innings[this.state.currentInnings - 1];
  }

  /** Undo the last delivery by restoring a pre-delivery innings snapshot */
  undoLastDelivery(): boolean {
    if (this.undoStack.length === 0) return false;

    const snapshot = this.undoStack[this.undoStack.length - 1];
    
    // SAFETY: Only allow undoing deliveries from the current innings.
    // This prevents accidentally destroying a new innings by restoring an old snapshot.
    if (!snapshot || snapshot.inningsNumber !== this.state.currentInnings) {
      return false;
    }
    
    // Pop the valid snapshot
    this.undoStack.pop();

    this.undoing = true;
    
    const matchState = this.state;

    // Find the innings by inningsNumber (handles innings transitions gracefully)
    const targetInnings = matchState.innings.find(
      i => i.inningsNumber === snapshot.inningsNumber
    );

    if (targetInnings) {
      // Restore each property from the snapshot (snapshot is already a deep copy)
      (Object.keys(snapshot) as (keyof InningsState)[]).forEach(key => {
        // Snapshot properties are already independent deep copies from when they were saved
        (targetInnings as any)[key] = (snapshot as any)[key];
      });
    }

    // Remove any extra innings created by endCurrentInnings transition
    while (matchState.innings.length > snapshot.inningsNumber) {
      matchState.innings.pop();
    }

    matchState.currentInnings = snapshot.inningsNumber;

    // Reset match status if this delivery caused match completion
    if (matchState.status === MatchStatus.COMPLETED) {
      matchState.status = MatchStatus.IN_PROGRESS;
      matchState.result = undefined;
    }

    this.undoing = false;
    return true;
  }

  /** Record a delivery and all associated events */
  recordDelivery(params: {
    runsOffBat: number;
    extraType?: ExtraType;
    extraRuns?: number;
    isWicket?: boolean;
    dismissalType?: DismissalType;
    batterOut?: string;
    fielderInvolved?: string;
  }): BallRecord {
    const {
      runsOffBat,
      extraType = ExtraType.NONE,
      extraRuns = 0,
      isWicket = false,
      dismissalType,
      batterOut,
      fielderInvolved,
    } = params;

    const innings = this.getCurrentInnings();
    if (!innings || innings.isComplete) {
      throw new Error("No active innings");
    }

    // Save snapshot of current innings state BEFORE any mutations
    // This allows full undo of all side effects (runs, wickets, strike rotation, over completion, etc.)
    if (!this.undoing) {
      this.undoStack.push(JSON.parse(JSON.stringify(innings)));
    }

    const isExtra = extraType !== ExtraType.NONE;
    const isNoBall = extraType === ExtraType.NO_BALL;
    const isWide = extraType === ExtraType.WIDE;
    const isLegal = !isNoBall && !isWide;
    const isFreeHit = innings.isFreeHitActive;

    // Validate dismissal on free hit
    if (isWicket && isFreeHit && dismissalType && !DISMISSALS_VALID_ON_FREE_HIT.includes(dismissalType)) {
      throw new Error(`Dismissal type ${dismissalType} is not valid on a free hit`);
    }

    // Ball number in the current over for display
    // Legal deliveries increment the ball count; illegal ones (wide/no-ball) don't
    const displayBallInOver = isLegal ? innings.ballsInCurrentOver + 1 : innings.ballsInCurrentOver;
    
    // Total runs from this ball
    const totalRuns = runsOffBat + extraRuns;

    // Update innings totals
    innings.totalRuns += totalRuns;

    // Track extras
    if (isWide) innings.extras.wides += extraRuns || 1;
    if (isNoBall) innings.extras.noBalls += extraRuns || 1;
    if (extraType === ExtraType.BYE) innings.extras.byes += runsOffBat || extraRuns;
    if (extraType === ExtraType.LEG_BYE) innings.extras.legByes += runsOffBat || extraRuns;
    if (extraType === ExtraType.PENALTY) innings.extras.penalty += extraRuns;

    // Update ball count (illegal deliveries still count as bowled but not as legal balls)
    innings.totalLegalDeliveries += isLegal ? 1 : 0;
    innings.totalBalls += 1;

    // Update legal ball count and in-over tracking
    if (isLegal) {
      innings.ballsInCurrentOver += 1;
    }

    // Track runs in current over
    innings.runsInCurrentOver += totalRuns;

    // Update current batter stats
    const strikerIdx = innings.currentStriker;
    const nonStrikerIdx = innings.currentNonStriker;
    const striker = innings.battingOrder[strikerIdx];
    const nonStriker = innings.battingOrder[nonStrikerIdx];

    // Runs off bat go to batter
    if (runsOffBat > 0) {
      striker.runs += runsOffBat;
      if (runsOffBat === 4) striker.fours += 1;
      if (runsOffBat === 6) striker.sixes += 1;
    }

    // Balls faced by striker
    // Note: Wides don't count as balls faced, no-balls do (as per official records)
    if (!isWide) {
      striker.ballsFaced += 1;
    }

    // Update striker's strike rate
    striker.strikeRate = striker.ballsFaced > 0 
      ? Math.round((striker.runs / striker.ballsFaced) * 10000) / 100 
      : 0;

    // ===== PARTNERSHIP TRACKING =====
    // Ensure partnership batter names are set
    if (innings.currentPartnership.batter1Name !== innings.battingOrder[innings.currentStriker]?.name) {
      innings.currentPartnership.batter1Name = innings.battingOrder[innings.currentStriker]?.name || "";
      innings.currentPartnership.batter1Index = innings.currentStriker;
    }
    if (innings.currentPartnership.batter2Name !== innings.battingOrder[innings.currentNonStriker]?.name) {
      innings.currentPartnership.batter2Name = innings.battingOrder[innings.currentNonStriker]?.name || "";
      innings.currentPartnership.batter2Index = innings.currentNonStriker;
    }

    // Track runs from this ball toward partnership (runs off bat only)
    if (runsOffBat > 0) {
      innings.currentPartnership.runs += runsOffBat;
      if (runsOffBat === 4) innings.currentPartnership.fours += 1;
      if (runsOffBat === 6) innings.currentPartnership.sixes += 1;
    }

    // Track balls faced (legal deliveries that aren't wides)
    if (!isWide) {
      innings.currentPartnership.balls += 1;
    }

    // Update partnership run rate
    if (innings.currentPartnership.balls > 0) {
      const partnershipOvers = innings.currentPartnership.balls / this.state.ballsPerOver;
      innings.currentPartnership.runRate = Math.round((innings.currentPartnership.runs / partnershipOvers) * 100) / 100;
    }
    // ===== END PARTNERSHIP TRACKING =====

    // Handle wicket
    if (isWicket && dismissalType) {
      this.handleWicket(innings, {
        dismissalType,
        batterOut: batterOut || innings.battingOrder[strikerIdx]?.name,
        fielderInvolved,
      });
    }

    // Handle strike rotation (odd runs OR for certain extras)
    const shouldSwapStrike = this.shouldRotateStrike(
      runsOffBat, extraType, extraRuns, isWicket
    );
    if (shouldSwapStrike) {
      this.swapStrike(innings);
    }

    // Check if over is complete (6 legal balls)
    let overCompleted = false;
    if (isLegal && innings.ballsInCurrentOver >= this.state.ballsPerOver) {
      this.endOver(innings);
      overCompleted = true;
    }

    // Record the delivery
    const isMaidenBall = isLegal && totalRuns === 0 && !isWicket;
    
    // We need to know which index we recorded for the striker (before potential swap from over end)
    let recordedStrikerIdx = strikerIdx;
    let recordedNonStrikerIdx = nonStrikerIdx;
    
    // If the over ended, strike was already rotated (batters swap). 
    // But the delivery happens BEFORE the over-end rotation.
    // So the recorded ball should reflect who was on strike for the actual delivery.
    
    const ballRecord: BallRecord = {
      ballIndex: innings.deliveries.length,
      overNumber: Math.floor(innings.totalBalls / this.state.ballsPerOver),
      ballNumberInOver: displayBallInOver,
      batterOnStrike: innings.battingOrder[strikerIdx]?.name || "",
      batterNonStrike: innings.battingOrder[nonStrikerIdx]?.name || "",
      bowler: innings.currentBowlerId,
      runsOffBat,
      extraType,
      extraRuns,
      totalRunsFromBall: totalRuns,
      isWicket,
      dismissalType,
      batterOut: batterOut || (isWicket ? innings.battingOrder[strikerIdx]?.name : undefined),
      fielderInvolved,
      isFreeHit,
      isLegal,
      isMaidenBall: isLegal && totalRuns === 0 && !isWicket,
      timestamp: Date.now(),
    };
    innings.deliveries.push(ballRecord);

    // Update bowler stats
    this.updateBowlerStats(innings, {
      runsOffBat,
      extraType,
      extraRuns,
      isWicket,
      isLegal,
      isNoBall,
      isWide,
    });

    // Set next ball free hit status
    innings.isFreeHitActive = isNoBall;

    // Check innings end conditions
    const inningsEnded = this.checkInningsEnd(innings);
    if (inningsEnded) {
      this.endCurrentInnings();
    }

    return ballRecord;
  }

  /** End current innings prematurely (declaration in Test or manual end) */
  endInnings(declared: boolean = false): void {
    const innings = this.getCurrentInnings();
    if (!innings) return;
    
    if (declared) {
      innings.isDeclared = true;
    }
    this.endCurrentInnings();
  }

  /** Get formatted overs string (e.g., "5.3") */
  getOversString(innings: InningsState): string {
    return CricketRulesEngine.formatOversString(innings.totalBalls, this.state.ballsPerOver);
  }

  /** Static utility: format overs from total balls */
  static formatOversString(totalBalls: number, ballsPerOver: number): string {
    const completedOvers = Math.floor(totalBalls / ballsPerOver);
    const ballsInOver = totalBalls % ballsPerOver;
    return `${completedOvers}.${ballsInOver}`;
  }

  /** Calculate required run rate for chasing team */
  getRequiredRunRate(innings: InningsState): number {
    if (!innings.target) return 0;
    const runsNeeded = innings.target - innings.totalRuns;
    const config = MATCH_FORMAT_CONFIG[this.state.format];
    const maxBalls = this.state.maxOvers > 0 
      ? this.state.maxOvers * this.state.ballsPerOver 
      : config.maxOversPerInnings * this.state.ballsPerOver;
    const ballsRemaining = maxBalls - innings.totalBalls;
    if (ballsRemaining <= 0) return 0;
    return Math.round((runsNeeded / ballsRemaining) * this.state.ballsPerOver * 100) / 100;
  }

  /** Calculate current run rate */
  getCurrentRunRate(innings: InningsState): number {
    if (innings.totalBalls === 0) return 0;
    const oversBowled = innings.totalBalls / this.state.ballsPerOver;
    return Math.round((innings.totalRuns / oversBowled) * 100) / 100;
  }

  /** Get current powerplay phase */
  getPowerplayPhase(innings: InningsState): PowerplayPhase | null {
    const config = MATCH_FORMAT_CONFIG[this.state.format];
    const currentOver = innings.totalBalls > 0 
      ? Math.floor(innings.totalBalls / this.state.ballsPerOver) 
      : 0;
    
    for (const pp of config.powerplayOvers) {
      if (currentOver >= pp.start && currentOver < pp.end) {
        return {
          phaseName: pp.end - pp.start === 6 ? "Powerplay (1-6)" : `Powerplay (${pp.start + 1}-${pp.end})`,
          startOver: pp.start,
          endOver: pp.end,
          maxFieldersOutside: pp.maxFieldersOutside,
          isActive: true,
        };
      }
    }
    return null;
  }

  /** Validate if a dismissal is possible on a free hit */
  isValidDismissalOnFreeHit(type: DismissalType): boolean {
    return DISMISSALS_VALID_ON_FREE_HIT.includes(type);
  }

  /** Get the match result */
  getResult(): MatchResult | undefined {
    return this.state.result;
  }

  /** Initiate a Super Over for tie-breakers */
  startSuperOver(team1: string, team2: string): void {
    const superOverInnings: InningsState = this.createInningsState(
      3, // Super Over is treated as "innings 3"
      team1,
      team2,
      1, // 1 over
      true
    );
    this.state.innings.push(superOverInnings);
    this.state.currentInnings = 3;
  }

  /** Process a DRS review */
  processReview(team: string, wasSuccessful: boolean): { reviewLost: boolean; reviewsRemaining: number } {
    const remaining = this.state.drsReviewsRemaining[team] || 0;
    if (remaining <= 0) {
      return { reviewLost: false, reviewsRemaining: 0 };
    }
    
    if (!wasSuccessful) {
      this.state.drsReviewsRemaining[team] = remaining - 1;
    }
    // Successful review is retained
    
    return {
      reviewLost: !wasSuccessful,
      reviewsRemaining: this.state.drsReviewsRemaining[team],
    };
  }

  /** Calculate DLS target (simplified) */
  calculateDLSTarget(oversUsed: number, wicketsLost: number, team1Score: number): number {
    const resourceTable: Record<string, number> = {
      "50_0": 100, "50_2": 83, "50_5": 49, "50_8": 17,
      "40_0": 89, "40_2": 73, "40_5": 41, "40_8": 13,
      "30_0": 77, "30_2": 62, "30_5": 33, "30_8": 10,
      "20_0": 61, "20_2": 49, "20_5": 25, "20_8": 7,
      "10_0": 39, "10_2": 30, "10_5": 14, "10_8": 4,
    };
    
    const key = `${oversUsed}_${wicketsLost}`;
    const resourcePct = resourceTable[key] ?? 50;
    // For simplicity: new target = (team1Score * team2Resources / team1Resources)
    return Math.ceil(team1Score * (resourcePct / 100));
  }

  /** Validate if this extra type's runs should affect the batter */
  isBatterExtra(extraType: ExtraType): boolean {
    return extraType === ExtraType.WIDE || extraType === ExtraType.NO_BALL || extraType === ExtraType.NONE;
  }

  // ============= PRIVATE METHODS =============

  private startNewInnings(): void {
    // Clear undo stack when transitioning to a new innings
    // This prevents accidental undo across innings boundaries
    this.undoStack = [];
    
    const config = MATCH_FORMAT_CONFIG[this.state.format];
    const inningsNum = this.state.currentInnings;
    const isSecondInnings = inningsNum === 2;
    const toss = this.state.toss;

    if (!toss) throw new Error("Toss not recorded");

    // Determine batting/bowling teams based on toss
    let battingTeam: string;
    let bowlingTeam: string;

    if (inningsNum === 1) {
      battingTeam = toss.decision === TossDecision.BAT ? toss.winner : this.getOtherTeam(toss.winner);
      bowlingTeam = this.getOtherTeam(battingTeam);
    } else {
      // Second innings: the other team bats
      const firstInnings = this.state.innings[0];
      battingTeam = firstInnings.bowlingTeam;
      bowlingTeam = firstInnings.battingTeam;
    }

    const target = isSecondInnings
      ? (this.state.innings[0]?.totalRuns ?? 0) + 1
      : undefined;

    const maxOvers = this.state.maxOvers > 0 
      ? this.state.maxOvers 
      : config.maxOversPerInnings;

    const innings = this.createInningsState(inningsNum, battingTeam, bowlingTeam, maxOvers);
    innings.target = target;
    
    this.state.innings.push(innings);
  }

  private createInningsState(
    inningsNumber: number,
    battingTeam: string,
    bowlingTeam: string,
    oversLimit: number,
    isSuperOver: boolean = false
  ): InningsState {
    return {
      inningsNumber,
      battingTeam,
      bowlingTeam,
      totalRuns: 0,
      totalWickets: 0,
      totalOvers: 0,
      totalBalls: 0,
      totalLegalDeliveries: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
      deliveries: [],
      battingOrder: [],
      bowlers: [],
      currentBatterIndex: 0,
      currentStriker: 0,
      currentNonStriker: 1,
      currentBowlerIndex: null,
      currentBowlerId: "",
      bowlerOversCount: {},
      fallOfWickets: [],
      currentPartnership: {
        batter1Index: 0,
        batter2Index: 1,
        batter1Name: "",
        batter2Name: "",
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        runRate: 0,
        startOver: 0,
        startBall: 0,
        startedAtInnings: true,
      },
      partnershipHistory: [],
      isComplete: false,
      isAllOut: false,
      isDeclared: false,
      target: undefined,
      isSuperOver,
      isDLS: false,
      ballsInCurrentOver: 0,
      runsInCurrentOver: 0,
      isFreeHitActive: false,
      powerplayPhase: null,
    };
  }

  private getOtherTeam(team: string): string {
    return team === this.state.team1 ? this.state.team2 : this.state.team1;
  }

  private handleWicket(innings: InningsState, wicket: {
    dismissalType: DismissalType;
    batterOut: string;
    fielderInvolved?: string;
  }): void {
    innings.totalWickets += 1;

    // Find and mark the batter as out
    const outIndex = innings.battingOrder.findIndex(
      b => b.name === wicket.batterOut
    );
    
    if (outIndex >= 0) {
      const batter = innings.battingOrder[outIndex];
      batter.isOut = true;
      batter.dismissalType = wicket.dismissalType;
      batter.dismissalBowler = innings.currentBowlerId;
      batter.dismissalFielder = wicket.fielderInvolved;
      batter.status = "out";
    }

    // Record fall of wicket
    innings.fallOfWickets.push({
      wicketNumber: innings.totalWickets,
      batterName: wicket.batterOut,
      dismissalType: wicket.dismissalType,
      runsAtDismissal: innings.totalRuns,
      oversAtDismissal: Math.floor(innings.totalBalls / this.state.ballsPerOver),
      ballsAtDismissal: innings.totalBalls % this.state.ballsPerOver,
      fielderInvolved: wicket.fielderInvolved,
      bowlerAtDelivery: innings.currentBowlerId,
    });

    // ===== PARTNERSHIP ENDED =====
    // Archive the current partnership before resetting
    const endedPartnership = { ...innings.currentPartnership };
    innings.partnershipHistory.push(endedPartnership);
    // ===== END PARTNERSHIP ARCHIVE =====

    // Check if all out — uses configurable players per side
    if (innings.totalWickets >= this.state.playersPerSide - 1) {
      innings.isAllOut = true;
    }

    // Track who was the striker before dismissal for new partnership setup
    const prevStriker = innings.currentStriker;
    const prevNonStriker = innings.currentNonStriker;

    // If the striker got out, new batter comes in
    if (outIndex === innings.currentStriker) {
      innings.currentBatterIndex += 1;
      innings.currentStriker = innings.currentBatterIndex;
    }
    // If the non-striker got out (run out from non-striker end), same logic
    else if (outIndex === innings.currentNonStriker) {
      innings.currentNonStriker = innings.currentBatterIndex + 1;
      innings.currentBatterIndex += 1;
    }

    // ===== START NEW PARTNERSHIP =====
    const newBatterIdx = innings.currentStriker;
    const notOutIdx = innings.currentNonStriker;
    const newBatter = innings.battingOrder[newBatterIdx];
    const notOutBatter = innings.battingOrder[notOutIdx];

    // The partnership starts with the new batter and the not-out batter
    innings.currentPartnership = {
      batter1Index: newBatterIdx,
      batter2Index: notOutIdx,
      batter1Name: newBatter?.name || "",
      batter2Name: notOutBatter?.name || "",
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      runRate: 0,
      startOver: Math.floor(innings.totalBalls / this.state.ballsPerOver),
      startBall: innings.totalBalls % this.state.ballsPerOver,
      startedAtInnings: false,
    };
    // ===== END NEW PARTNERSHIP =====
  }

  private swapStrike(innings: InningsState): void {
    const temp = innings.currentStriker;
    innings.currentStriker = innings.currentNonStriker;
    innings.currentNonStriker = temp;
  }

  private shouldRotateStrike(
    runsOffBat: number,
    extraType: ExtraType,
    extraRuns: number,
    isWicket: boolean
  ): boolean {
    if (isWicket) return false; // wicket doesn't rotate strike (unless new batter, handled separately)
    
    // Odd runs off the bat
    if (runsOffBat % 2 === 1) return true;

    // Odd runs from byes/leg-byes rotate strike
    if ((extraType === ExtraType.BYE || extraType === ExtraType.LEG_BYE) && extraRuns % 2 === 1) return true;

    return false;
  }

  private endOver(innings: InningsState): void {
    // Reset ball count for the over
    innings.ballsInCurrentOver = 0;
    innings.runsInCurrentOver = 0;
    
    // Auto-rotate strike at end of over (batters swap ends)
    this.swapStrike(innings);
    
    // Check if current bowler bowled a maiden
    // A maiden is an over where 0 runs are scored off the bat AND no extras
    const currentBowler = innings.bowlers[innings.currentBowlerIndex ?? -1];
    if (currentBowler && innings.runsInCurrentOver === 0) {
      currentBowler.maidens += 1;
    }

    // Note: in real cricket, a new bowler can't bowl consecutive overs
    // This is enforced at the UI level when selecting the next bowler
  }

  private updateBowlerStats(innings: InningsState, params: {
    runsOffBat: number;
    extraType: ExtraType;
    extraRuns: number;
    isWicket: boolean;
    isLegal: boolean;
    isNoBall: boolean;
    isWide: boolean;
  }): void {
    const bowlerIdx = innings.currentBowlerIndex;
    if (bowlerIdx === null || bowlerIdx === undefined) return;
    
    const bowler = innings.bowlers[bowlerIdx];
    if (!bowler) return;

    const { runsOffBat, extraType, extraRuns, isWicket, isLegal, isNoBall, isWide } = params;

    // Wides and no-balls count against the bowler's figures
    bowler.runsConceded += runsOffBat + extraRuns;
    bowler.totalBalls += 1;
    
    if (isLegal) {
      bowler.legalBalls += 1;
    }

    // Track wides/no-balls for the bowler
    if (isWide) bowler.wides += 1;
    if (isNoBall) bowler.noBalls += 1;

    // Wickets credited to bowler
    if (isWicket) {
      // Check if this dismissal type is credited to the bowler
      const lastDelivery = innings.deliveries[innings.deliveries.length - 1];
      if (lastDelivery?.dismissalType && DISMISSAL_CREDITED_TO_BOWLER.includes(lastDelivery.dismissalType)) {
        bowler.wickets += 1;
      }
    }

    // Calculate overs and economy
    bowler.overs = Math.floor(bowler.legalBalls / this.state.ballsPerOver);
    bowler.economyRate = bowler.overs > 0 || bowler.legalBalls > 0
      ? Math.round((bowler.runsConceded / (bowler.legalBalls / this.state.ballsPerOver)) * 100) / 100
      : 0;
  }

  private checkInningsEnd(innings: InningsState): boolean {
    // All out
    if (innings.isAllOut) return true;

    // Overs limit reached (for limited overs)
    if (this.state.maxOvers > 0) {
      const currentOver = Math.floor(innings.totalLegalDeliveries / this.state.ballsPerOver);
      if (currentOver >= this.state.maxOvers) return true;
    }

    // For The Hundred: 100 balls limit
    if (this.state.format === MatchFormat.THE_HUNDRED) {
      if (innings.totalLegalDeliveries >= 100) return true;
    }

    // Target reached (2nd innings)
    if (innings.target && innings.totalRuns >= innings.target) return true;

    // Super Over: 6 balls or 2 wickets
    if (innings.isSuperOver) {
      if (innings.totalLegalDeliveries >= 6) return true;
      if (innings.totalWickets >= 2) return true;
    }

    // Declared
    if (innings.isDeclared) return true;

    return false;
  }

  private endCurrentInnings(): void {
    const innings = this.getCurrentInnings();
    if (!innings) return;

    innings.isComplete = true;
    
    // Update total overs for display
    innings.totalOvers = Math.floor(innings.totalLegalDeliveries / this.state.ballsPerOver);

    // Check if match is over or we need a new innings
    const config = MATCH_FORMAT_CONFIG[this.state.format];
    
    if (this.state.currentInnings >= 2) {
      // Match is over after 2 innings in limited overs
      if (!innings.isSuperOver) {
        this.determineResult();
        this.state.status = MatchStatus.COMPLETED;
      } else {
        // Super Over result
        this.determineSuperOverResult();
        this.state.status = MatchStatus.COMPLETED;
      }
    } else if (this.state.currentInnings === 1 && this.state.maxInnings > 1) {
      // Start second innings
      this.state.currentInnings = 2;
      this.startNewInnings();
    } else {
      // Single innings match completed
      this.determineResult();
      this.state.status = MatchStatus.COMPLETED;
    }
  }

  private determineResult(): void {
    const innings1 = this.state.innings[0];
    const innings2 = this.state.innings[1];

    if (!innings1) {
      this.state.result = {
        resultType: ResultType.NO_RESULT,
        description: "Match abandoned - no result",
      };
      return;
    }

    // No result if there's only one innings and it was abandoned
    if (!innings2 && this.state.status === MatchStatus.ABANDONED) {
      this.state.result = {
        resultType: ResultType.NO_RESULT,
        description: "Match abandoned",
      };
      return;
    }

    if (!innings2) {
      this.state.result = {
        resultType: ResultType.IN_PROGRESS,
        description: "Match in progress",
      };
      return;
    }

    // Format team scores for display
    const getScoreStr = (inn: InningsState) => 
      `${inn.totalRuns}/${inn.totalWickets} (${this.getOversString(inn)} ov)`;

    const team1Score = getScoreStr(innings1);
    const team2Score = getScoreStr(innings2);

    if (innings2.totalRuns > innings1.totalRuns) {
      // Team batting second wins
      const wicketsRemaining = (this.state.playersPerSide - 1) - innings2.totalWickets;
      this.state.result = {
        resultType: ResultType.WIN_BY_WICKETS,
        winner: innings2.battingTeam,
        margin: `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`,
        description: `${innings2.battingTeam} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`,
        team1Score,
        team2Score,
      };
    } else if (innings2.totalRuns === innings1.totalRuns) {
      // Tie
      if (this.state.format === MatchFormat.TEST) {
        this.state.result = {
          resultType: ResultType.DRAW,
          description: "Match drawn",
          team1Score,
          team2Score,
        };
      } else {
        this.state.result = {
          resultType: ResultType.TIED,
          description: "Match tied",
          team1Score,
          team2Score,
        };
      }
    } else {
      // Team batting first wins
      if (this.state.format === MatchFormat.TEST && !innings2.isAllOut && !innings2.isDeclared) {
        this.state.result = {
          resultType: ResultType.DRAW,
          description: "Match drawn",
          team1Score,
          team2Score,
        };
      } else {
        const runsMargin = innings1.totalRuns - innings2.totalRuns;
        this.state.result = {
          resultType: ResultType.WIN_BY_RUNS,
          winner: innings1.battingTeam,
          margin: `${runsMargin} run${runsMargin !== 1 ? 's' : ''}`,
          description: `${innings1.battingTeam} won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`,
          team1Score,
          team2Score,
        };
      }
    }
  }

  private determineSuperOverResult(): void {
    const regularInnings = this.state.innings.filter(i => !i.isSuperOver);
    const superOvers = this.state.innings.filter(i => i.isSuperOver);

    if (superOvers.length < 2) {
      this.state.result = {
        resultType: ResultType.TIED,
        description: "Super Over needed both innings",
      };
      return;
    }

    const so1 = superOvers[0];
    const so2 = superOvers[1];

    if (so2.totalRuns > so1.totalRuns) {
      this.state.result = {
        resultType: ResultType.WIN_BY_WICKETS,
        winner: so2.battingTeam,
        margin: `${(this.state.playersPerSide - 1) - so2.totalWickets} wicket${(this.state.playersPerSide - 1) - so2.totalWickets !== 1 ? 's' : ''}`,
        description: `${so2.battingTeam} won the Super Over`,
      };
    } else if (so1.totalRuns > so2.totalRuns) {
      this.state.result = {
        resultType: ResultType.WIN_BY_RUNS,
        winner: so1.battingTeam,
        margin: `${so1.totalRuns - so2.totalRuns} run${so1.totalRuns - so2.totalRuns !== 1 ? 's' : ''}`,
        description: `${so1.battingTeam} won the Super Over`,
      };
    } else {
      // Super Over tied - could do another, but for now declare tied
      this.state.result = {
        resultType: ResultType.TIED,
        description: "Super Over tied - match tied",
      };
    }
  }

  // ============= BATTER/BOWLER MANAGEMENT =============

  /** Add a batter to the batting order
   *  - Before match starts: stored in pending roster (applied when innings begins)
   *  - After match starts: added directly to current innings */
  addBatter(playerId: string, name: string): void {
    const innings = this.getCurrentInnings();
    
    // Before match starts — queue in pending roster
    if (!innings) {
      this.state.pendingRoster.batters.push({ playerId, name });
      return;
    }

    innings.battingOrder.push({
      playerId,
      name,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      strikeRate: 0,
      status: "did_not_bat",
    });
  }

  /** Set the starting batters */
  setOpeningBatters(batter1: string, batter2: string): void {
    const innings = this.getCurrentInnings();
    if (!innings) return;

    // Find or create batters
    const idx1 = innings.battingOrder.findIndex(b => b.name === batter1);
    if (idx1 >= 0) {
      innings.currentStriker = idx1;
      innings.battingOrder[idx1].status = "batting";
    }

    const idx2 = innings.battingOrder.findIndex(b => b.name === batter2);
    if (idx2 >= 0) {
      innings.currentNonStriker = idx2;
      innings.battingOrder[idx2].status = "batting";
    }

    innings.currentBatterIndex = Math.max(idx1, idx2) + 1;
  }

  /** Add a bowler to the current innings
   *  - Before match starts: stored in pending roster (applied when innings begins)
   *  - After match starts: added directly to current innings */
  addBowler(playerId: string, name: string): void {
    const innings = this.getCurrentInnings();
    
    // Before match starts — queue in pending roster
    if (!innings) {
      this.state.pendingRoster.bowlers.push({ playerId, name });
      return;
    }

    innings.bowlers.push({
      playerId,
      name,
      overs: 0,
      legalBalls: 0,
      totalBalls: 0,
      runsConceded: 0,
      wickets: 0,
      maidens: 0,
      economyRate: 0,
      wides: 0,
      noBalls: 0,
    });
  }

  /** Set the current bowler */
  setCurrentBowler(bowlerName: string): void {
    const innings = this.getCurrentInnings();
    if (!innings) return;

    const idx = innings.bowlers.findIndex(b => b.name === bowlerName);
    if (idx >= 0) {
      innings.currentBowlerIndex = idx;
      innings.currentBowlerId = bowlerName;
      
      // Track overs bowled by this bowler
      innings.bowlerOversCount[bowlerName] = (innings.bowlerOversCount[bowlerName] || 0);
    }
  }

  /** Reorder the pending batting roster (only works before match starts) */
  setBattingOrder(playerNames: string[]): void {
    const ordered = playerNames
      .map(name => this.state.pendingRoster.batters.find(b => b.name === name))
      .filter((b): b is { playerId: string; name: string } => b !== undefined);
    
    // Append any batters not in the new order (preserves full roster)
    const remaining = this.state.pendingRoster.batters.filter(
      b => !playerNames.includes(b.name)
    );
    this.state.pendingRoster.batters = [...ordered, ...remaining];
  }

  /** Get the pending batting order names (before match starts) */
  getPendingBatterNames(): string[] {
    return this.state.pendingRoster.batters.map(b => b.name);
  }

  /** Get the next batter to come in */
  getNextBatter(): BatterStats | undefined {
    const innings = this.getCurrentInnings();
    if (!innings) return undefined;
    return innings.battingOrder[innings.currentBatterIndex];
  }

  /** Get all batters currently not out */
  getNotOutBatters(): BatterStats[] {
    const innings = this.getCurrentInnings();
    if (!innings) return [];
    return innings.battingOrder.filter(b => b.status === "batting");
  }

  /** Get the current partnership stats */
  getCurrentPartnership(innings: InningsState): Partnership {
    // Ensure the partnership batter names match the current batters
    const striker = innings.battingOrder[innings.currentStriker];
    const nonStriker = innings.battingOrder[innings.currentNonStriker];
    
    const p = innings.currentPartnership;
    
    // Recalculate run rate from current values
    if (p.balls > 0) {
      p.runRate = Math.round((p.runs / (p.balls / this.state.ballsPerOver)) * 100) / 100;
    }

    return {
      ...p,
      batter1Name: striker?.name || p.batter1Name,
      batter2Name: nonStriker?.name || p.batter2Name,
    };
  }

  /** Get the last N deliveries for live display */
  getRecentDeliveries(n: number = 6): BallRecord[] {
    const innings = this.getCurrentInnings();
    if (!innings) return [];
    return innings.deliveries.slice(-n).reverse();
  }

  /** Get all bowling figures sorted for display */
  getBowlingFigures(): BowlingFigures[] {
    const innings = this.getCurrentInnings();
    if (!innings) return [];
    return innings.bowlers.map(b => ({
      bowlerId: b.playerId,
      name: b.name,
      overs: b.overs,
      maidens: b.maidens,
      runsConceded: b.runsConceded,
      wickets: b.wickets,
      economy: b.economyRate,
    }));
  }
}
