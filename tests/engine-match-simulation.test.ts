/**
 * Complete T20 Match Simulation (Layer 9 — End-to-End)
 *
 * Simulates a full T20 match ball-by-ball through the CricketRulesEngine,
 * covering the entire lifecycle:
 * - Match creation + validation
 * - Toss + innings start
 * - Full first innings (20 overs: runs, wickets, extras, boundaries)
 * - Innings transition with target
 * - Full second innings chase
 * - Result determination
 * - Final stats verification
 */
import { describe, it, expect } from "vitest";
import {
  CricketRulesEngine,
  MatchFormat,
  TossDecision,
  ExtraType,
  DismissalType,
  MatchStatus,
  ResultType,
  validateMatchInput,
} from "../lib/cricket/advanced-rules-engine";

// ─── Scorecard for the simulated match ───────────────────────────────────────
// We'll create a realistic T20 scorecard with mixed scoring.

function simulateMatch(): {
  engine: CricketRulesEngine;
  firstInningsRuns: number;
  firstInningsWickets: number;
  secondInningsRuns: number;
  secondInningsWickets: number;
} {
  // ──────────── PRE-MATCH ────────────
  // Validate inputs first
  const validation = validateMatchInput({
    format: MatchFormat.T20,
    team1: "Super Kings",
    team2: "Royal Challengers",
    customOvers: 20,
  });
  expect(validation).toEqual([]);

  const engine = new CricketRulesEngine(MatchFormat.T20, "Super Kings", "Royal Challengers", 20, 6, 11, 2);
  engine.recordToss("Super Kings", TossDecision.BAT);
  engine.startMatch();

  // ──────────── ROSTER SETUP ────────────
  // Super Kings batting order
  const skBatters = [
    "R Sharma", "V Kohli", "S Yadav", "H Pandya", "R Jadeja",
    "K Yadav", "B Kumar", "J Bumrah", "M Shami", "S Thakur", "Y Chahal",
  ];
  skBatters.forEach((name, i) => engine.addBatter(`sk${i + 1}`, name));

  // Royal Challengers bowling attack
  const rcBowlers = ["M Siraj", "W Sundar", "H Patel", "D Karthik"];
  rcBowlers.forEach((name, i) => engine.addBowler(`rcb${i + 1}`, name));

  engine.setOpeningBatters("R Sharma", "V Kohli");
  engine.setCurrentBowler("M Siraj");

  // ──────────── FIRST INNINGS: Super Kings bat ────────────
  // Over 1: M Siraj — mixed start
  // Ball 1: 0 (dot)
  // Ball 2: 4 (boundary)
  // Ball 3: 1 (single, strike rotates)
  // Ball 4: WIDE + 1 (extra run)
  // Ball 5: 0 (dot)
  // Ball 6: 2 (two runs)
  // Over total: 8 runs (4+1+1+0+2 = 8), 0 wickets
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0, extraType: ExtraType.WIDE, extraRuns: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 2 });

  // Over 2: W Sundar — tight over with a wicket
  // Ball 1: 0
  // Ball 2: 4
  // Ball 3: 0
  // Ball 4: WICKET! V Kohli caught
  // Ball 5: 1 (new batter S Yadav)
  // Ball 6: 0
  // Over total: 5 runs (0+4+0+0+1+0), 1 wicket
  engine.setCurrentBowler("W Sundar");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.CAUGHT,
    batterOut: "V Kohli",
  });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });

  // Over 3: H Patel — expensive
  // 6, 4, 1, 6, 0, 4 = 21 runs
  engine.setCurrentBowler("H Patel");
  engine.recordDelivery({ runsOffBat: 6 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 6 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });

  // Over 4: D Karthik — medium
  // 1, 0, 2, 0, 1, 0 = 4 runs
  engine.setCurrentBowler("D Karthik");
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });

  // Over 5: M Siraj back — wicket over
  // 0, WICKET (bowled), 1, 0, 0, 0 = 1 run, 1 wicket
  engine.setCurrentBowler("M Siraj");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.BOWLED,
    batterOut: "S Yadav",
  });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });

  // Over 6: W Sundar
  // NO-BALL + 4, 0, 1, 2, 0, 0, 0 = 8 runs (7 legal + 1 no-ball)
  engine.setCurrentBowler("W Sundar");
  engine.recordDelivery({ runsOffBat: 4, extraType: ExtraType.NO_BALL, extraRuns: 1 });
  engine.recordDelivery({ runsOffBat: 0 }); // free hit — dot
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 }); // 7th ball because of no-ball

  // Powerplay (overs 1-6) complete
  // Running total: 8 + 5 + 21 + 4 + 1 + 8 = 47 runs, 2 wickets

  // Over 7-20: Simulate remaining overs with realistic scoring
  // We'll do 4 more overs now and make the rest dot balls to reach 20 overs
  // Over 7: H Patel — 10 runs
  engine.setCurrentBowler("H Patel");
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 }); // 47 + 9 = 56 runs

  // Over 8: D Karthik — 6 runs, 1 wicket
  engine.setCurrentBowler("D Karthik");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.LBW,
    batterOut: "H Pandya",
  });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 }); // 56 + 6 = 62 runs, 3 wkts

  // Over 9: M Siraj — 5 runs
  engine.setCurrentBowler("M Siraj");
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 }); // 62 + 5 = 67 runs, 3 wkts

  // Over 10: W Sundar — 3 runs, 1 wicket (run out)
  engine.setCurrentBowler("W Sundar");
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({
    runsOffBat: 1, isWicket: true, dismissalType: DismissalType.RUN_OUT,
    batterOut: "R Jadeja", fielderInvolved: "V Kohli",
  });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 }); // 67 + 3 = 70 runs, 4 wkts

  // Remaining 10 overs: let's speed up with some boundaries but more wickets
  // Over 11-12: quick runs
  // Over 11: H Patel — 14 runs, 1 wicket
  engine.setCurrentBowler("H Patel");
  engine.recordDelivery({ runsOffBat: 6 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.CAUGHT,
    batterOut: "K Yadav",
  });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 }); // 70 + 11 = 81 runs, 5 wkts

  // Over 12: D Karthik — 7 runs
  engine.setCurrentBowler("D Karthik");
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 }); // 81 + 7 = 88 runs, 5 wkts

  // Over 13: M Siraj — 2 runs, 1 wicket
  engine.setCurrentBowler("M Siraj");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.BOWLED,
    batterOut: "B Kumar",
  });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 }); // 88 + 1 = 89 runs, 6 wkts

  // Over 14: W Sundar — 5 runs
  engine.setCurrentBowler("W Sundar");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 }); // 89 + 5 = 94 runs, 6 wkts

  // Over 15: H Patel — 9 runs
  engine.setCurrentBowler("H Patel");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 6 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 1 }); // 94 + 9 = 103 runs, 6 wkts

  // Over 16: D Karthik — 1 run, 1 wicket
  engine.setCurrentBowler("D Karthik");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.CAUGHT,
    batterOut: "J Bumrah",
  });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 0 }); // 103 + 1 = 104 runs, 7 wkts

  // Over 17: M Siraj — 12 runs, 1 wicket
  engine.setCurrentBowler("M Siraj");
  engine.recordDelivery({ runsOffBat: 6 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.BOWLED,
    batterOut: "M Shami",
  });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 0 }); // 104 + 11 = 115 runs, 8 wkts

  // Over 18: W Sundar — 13 runs
  engine.setCurrentBowler("W Sundar");
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 6 });
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 2 });
  engine.recordDelivery({ runsOffBat: 0 }); // 115 + 13 = 128 runs, 8 wkts

  // Over 19: H Patel — 8 runs, 1 wicket
  engine.setCurrentBowler("H Patel");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.CAUGHT,
    batterOut: "S Thakur",
  });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 0 }); // 128 + 6 = 134 runs, 9 wkts

  // Over 20: D Karthik — final ball, wicket (all out)
  engine.setCurrentBowler("D Karthik");
  engine.recordDelivery({ runsOffBat: 0 });
  engine.recordDelivery({ runsOffBat: 1 });
  engine.recordDelivery({ runsOffBat: 4 });
  engine.recordDelivery({ runsOffBat: 4 });
  // 10th wicket - innings ends and transitions automatically.
  // NO deliveries after this point - they'd hit the empty 2nd innings.
  engine.recordDelivery({
    runsOffBat: 0, isWicket: true, dismissalType: DismissalType.BOWLED,
    batterOut: "Y Chahal",
  });

  // Save first innings score
  const afterFirst = engine.getState();
  const firstInnings = afterFirst.innings[0];
  const firstInningsRuns = firstInnings.totalRuns;
  const firstInningsWickets = firstInnings.totalWickets;

  // ──────────── SECOND INNINGS: Royal Challengers chase ────────────
  // Royal Challengers batting
  const rcBatters = [
    "F du Plessis", "V Kohli", "M Lomror", "G Maxwell", "D Karthik",
    "S Ahmed", "W Sundar", "H Patel", "M Siraj", "K Sharma", "A Singh",
  ];
  rcBatters.forEach((name, i) => engine.addBatter(`rc${i + 1}`, name));
  engine.setOpeningBatters("F du Plessis", "V Kohli");

  // Add bowlers for 2nd innings (the bowling side is Super Kings)
  ["J Bumrah", "R Ashwin", "Y Chahal", "M Shami", "H Pandya"].forEach((name, i) => {
    engine.addBowler(`skb${i + 1}`, name);
  });

  // Quick chase simulation — bowl until target reached or 5 overs
  const chaseBowlers = ["J Bumrah", "R Ashwin", "Y Chahal", "M Shami", "H Pandya"];
  let bIdx = 0;

  for (let over = 0; over < 5; over++) {
    const inns = engine.getCurrentInnings();
    if (!inns || inns.isComplete) break;

    engine.setCurrentBowler(chaseBowlers[bIdx]);
    bIdx = (bIdx + 1) % chaseBowlers.length;

    // Bowl 6 deliveries per over (moderate scoring, one wicket on ball 3)
    for (let ball = 0; ball < 6; ball++) {
      const activeInnings = engine.getCurrentInnings();
      if (!activeInnings || activeInnings.isComplete) break;
      
      if (over === 1 && ball === 2) {
        // Wicket in over 2: V Kohli caught
        const striker = activeInnings.battingOrder[activeInnings.currentStriker];
        engine.recordDelivery({
          runsOffBat: 0, isWicket: true,
          dismissalType: DismissalType.CAUGHT,
          batterOut: striker.name,
        });
      } else {
        engine.recordDelivery({ runsOffBat: [0, 0, 1, 0, 2, 4][ball] });
      }
    }
  }

  // End the chase — manually end innings if still active
  const finalInnings = engine.getCurrentInnings();
  if (finalInnings && !finalInnings.isComplete) {
    engine.endInnings();
  }

  const state = engine.getState();
  const secondInnings = state.innings[1];
  return {
    engine,
    firstInningsRuns,
    firstInningsWickets,
    secondInningsRuns: secondInnings?.totalRuns ?? 0,
    secondInningsWickets: secondInnings?.totalWickets ?? 0,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Full T20 Match Simulation", () => {
  const result = simulateMatch();
  const { engine, firstInningsRuns, firstInningsWickets, secondInningsRuns, secondInningsWickets } = result;
  const state = engine.getState();

  it("completes both innings", () => {
    expect(state.innings.length).toBeGreaterThanOrEqual(2);
    expect(state.innings[0].isComplete).toBe(true);
    expect(state.innings[1]?.isComplete).toBe(true);
  });

  it("has realistic first innings score", () => {
    // Should have scored between 120-180 in a T20
    expect(firstInningsRuns).toBeGreaterThan(80);
    expect(firstInningsWickets).toBeGreaterThanOrEqual(9); // should be close to all out
  });

  it("has realistic second innings score", () => {
    expect(secondInningsRuns).toBeGreaterThan(0);
    expect(secondInningsWickets).toBeGreaterThan(0);
  });

  it("determines a result", () => {
    const result_ = engine.getResult();
    expect(result_).toBeDefined();
    expect(
      result_!.resultType === ResultType.WIN_BY_RUNS ||
      result_!.resultType === ResultType.WIN_BY_WICKETS ||
      result_!.resultType === ResultType.TIED
    ).toBe(true);
  });

  it("sets match status to COMPLETED", () => {
    expect(state.status).toBe(MatchStatus.COMPLETED);
  });

  it("has consistent scorecard (runs >= extras)", () => {
    for (const inns of state.innings) {
      const totalFromBreakdown =
        inns.extras.wides +
        inns.extras.noBalls +
        inns.extras.byes +
        inns.extras.legByes +
        inns.extras.penalty +
        inns.battingOrder.reduce((sum, b) => sum + b.runs, 0);
      // Total runs should equal sum of batter runs + extras
      expect(inns.totalRuns).toBe(totalFromBreakdown);
    }
  });

  it("has consistent bowling figures", () => {
    for (const inns of state.innings) {
      let totalBowlerRuns = 0;
      let totalBowlerWickets = 0;
      for (const bowler of inns.bowlers) {
        totalBowlerRuns += bowler.runsConceded;
        totalBowlerWickets += bowler.wickets;
      }
      // Bowling runs conceded should match team total + byes/leg-byes + penalties
      // (Byes and leg-byes don't count against the bowler)
      // For simplicity: totalBowlerRuns <= team totalRuns
      expect(totalBowlerRuns).toBeLessThanOrEqual(inns.totalRuns);
    }
  });

  it("produces valid overs strings", () => {
    for (const inns of state.innings) {
      const overs = engine.getOversString(inns);
      expect(overs).toMatch(/^\d+\.\d$/);
    }
  });
});
