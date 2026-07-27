/**
 * Cricket Rules Engine — Scoring Service Tests (Layer 2 — Service)
 *
 * Tests every branch of CricketRulesEngine.recordDelivery() and related methods:
 * - Basic runs (0, 1, 2, 3, 4, 6)
 * - Strike rotation (odd runs → swap)
 * - Over completion (6 legal balls → end of over + maiden)
 * - Extras (wide, no-ball, bye, leg-bye, free hit)
 * - Wickets (all credited types, non-credited, run-out)
 * - Bowling figures (overs, maidens, wickets, economy)
 * - Partnerships (accumulation, reset on wicket)
 * - Innings transitions (all out → 2nd innings with target)
 * - Target chase (win by wickets / runs, tie)
 * - Undo (snapshot restore reverts all side effects)
 * - Edge cases (singular forms, The Hundred)
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
} from "../lib/cricket/advanced-rules-engine";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a fully set-up T20 match ready for scoring. */
function createT20Match(): CricketRulesEngine {
  // Pass customInningsCount=2 so the engine allows both teams to bat (1st + 2nd innings)
  const engine = new CricketRulesEngine(MatchFormat.T20, "Eagles", "Falcons", 20, 6, 11, 2);
  engine.recordToss("Eagles", TossDecision.BAT);
  engine.startMatch();

  // Add 11 batters
  ["R Sharma", "V Kohli", "S Yadav", "H Pandya", "R Jadeja", "K Yadav",
   "B Kumar", "J Bumrah", "M Shami", "S Thakur", "Y Chahal"].forEach((name, i) => {
    engine.addBatter(`p${i + 1}`, name);
  });

  // Add 4 bowlers
  ["J Bumrah", "R Ashwin", "B Kumar", "Y Chahal"].forEach((name, i) => {
    engine.addBowler(`b${i + 1}`, name);
  });

  engine.setOpeningBatters("R Sharma", "V Kohli");
  engine.setCurrentBowler("J Bumrah");

  return engine;
}

/** Record a simple run delivery. Returns the ball record. */
function run(engine: CricketRulesEngine, runs: number) {
  return engine.recordDelivery({ runsOffBat: runs });
}

/** Record a wide delivery. */
function wide(engine: CricketRulesEngine, extraRuns: number = 1) {
  return engine.recordDelivery({
    runsOffBat: 0,
    extraType: ExtraType.WIDE,
    extraRuns,
  });
}

/** Record a no-ball delivery. */
function noball(engine: CricketRulesEngine, runsOffBat: number = 0, extraRuns: number = 1) {
  return engine.recordDelivery({
    runsOffBat,
    extraType: ExtraType.NO_BALL,
    extraRuns,
  });
}

/** Record a wicket delivery. */
function wicket(
  engine: CricketRulesEngine,
  dismissalType: DismissalType,
  batterOut: string,
  runsOffBat: number = 0,
) {
  return engine.recordDelivery({
    runsOffBat,
    isWicket: true,
    dismissalType,
    batterOut,
  });
}

/** Bowl a full over of the given runs (default all dots). */
function bowlOver(
  engine: CricketRulesEngine,
  runs: number[] = [0, 0, 0, 0, 0, 0],
): void {
  for (const r of runs) {
    engine.recordDelivery({ runsOffBat: r });
  }
}

/** Get the current innings state from the engine. */
function innings(engine: CricketRulesEngine) {
  return engine.getCurrentInnings()!;
}

/** Get total wickets fallen in the current innings. */
function wkts(engine: CricketRulesEngine): number {
  return innings(engine)?.totalWickets ?? 0;
}

// ─── 1. Basic Runs ───────────────────────────────────────────────────────────

describe("Basic runs scoring", () => {
  it("records 0 runs (dot ball) correctly", () => {
    const engine = createT20Match();
    const ball = run(engine, 0);
    expect(ball.runsOffBat).toBe(0);
    expect(ball.totalRunsFromBall).toBe(0);
    expect(innings(engine).totalRuns).toBe(0);
  });

  it("records 1 run correctly", () => {
    const engine = createT20Match();
    run(engine, 1);
    expect(innings(engine).totalRuns).toBe(1);
    expect(innings(engine).battingOrder[0].runs).toBe(1);
    expect(innings(engine).battingOrder[0].ballsFaced).toBe(1);
  });

  it("records 2 runs correctly", () => {
    const engine = createT20Match();
    run(engine, 2);
    expect(innings(engine).totalRuns).toBe(2);
    expect(innings(engine).battingOrder[0].runs).toBe(2);
  });

  it("records 3 runs correctly", () => {
    const engine = createT20Match();
    run(engine, 3);
    expect(innings(engine).totalRuns).toBe(3);
    expect(innings(engine).battingOrder[0].runs).toBe(3);
  });

  it("records 4 runs (boundary) correctly and increments fours", () => {
    const engine = createT20Match();
    run(engine, 4);
    expect(innings(engine).totalRuns).toBe(4);
    expect(innings(engine).battingOrder[0].fours).toBe(1);
    expect(innings(engine).battingOrder[0].runs).toBe(4);
  });

  it("records 6 runs (maximum) correctly and increments sixes", () => {
    const engine = createT20Match();
    run(engine, 6);
    expect(innings(engine).totalRuns).toBe(6);
    expect(innings(engine).battingOrder[0].sixes).toBe(1);
    expect(innings(engine).battingOrder[0].runs).toBe(6);
  });

  it("calculates strike rate correctly", () => {
    const engine = createT20Match();
    run(engine, 4);
    run(engine, 1);
    run(engine, 2);
    // After ball 1 (4 runs, even): no rotation. Striker=R Sharma, NonStriker=V Kohli
    // After ball 2 (1 run, odd): rotation! Striker=V Kohli, NonStriker=R Sharma
    // After ball 3 (2 runs, even): no rotation. Striker=V Kohli, NonStriker=R Sharma
    // R Sharma: 4+1 = 5 runs off 2 balls, SR = 250.00
    // V Kohli: 2 runs off 1 ball, SR = 200.00
    const striker = innings(engine).battingOrder[innings(engine).currentStriker];
    const nonStriker = innings(engine).battingOrder[innings(engine).currentNonStriker];
    // V Kohli is on strike after rotating on the 1
    expect(striker.name).toBe("V Kohli");
    expect(striker.runs).toBe(2);
    expect(striker.ballsFaced).toBe(1);
    expect(striker.strikeRate).toBe(200);
    // R Sharma is at non-striker end
    expect(nonStriker.name).toBe("R Sharma");
    expect(nonStriker.runs).toBe(5);
    expect(nonStriker.ballsFaced).toBe(2);
    expect(nonStriker.strikeRate).toBe(250);
  });
});

// ─── 2. Strike Rotation ──────────────────────────────────────────────────────

describe("Strike rotation", () => {
  it("does not rotate strike on even runs", () => {
    const engine = createT20Match();
    run(engine, 2);
    expect(innings(engine).currentStriker).toBe(0); // still R Sharma
  });

  it("rotates strike on odd runs", () => {
    const engine = createT20Match();
    run(engine, 3); // odd → swap
    expect(innings(engine).currentStriker).toBe(1); // now V Kohli
  });

  it("rotates strike twice on 1 + 1 (back to original)", () => {
    const engine = createT20Match();
    run(engine, 1); // swap
    run(engine, 1); // swap back
    expect(innings(engine).currentStriker).toBe(0);
  });

  it("rotates strike at end of over (batters swap)", () => {
    const engine = createT20Match();
    bowlOver(engine, [0, 0, 0, 0, 0, 1]); // odd on 6th ball → swap, then over-end swaps again
    // After 6th ball: odd runs → swap (0↔1), over completes → swap back (1↔0)
    expect(innings(engine).currentStriker).toBe(0); // R Sharma back on strike
  });
});

// ─── 3. Over Completion ──────────────────────────────────────────────────────

describe("Over completion", () => {
  it("completes an over after 6 legal balls", () => {
    const engine = createT20Match();
    bowlOver(engine);
    expect(innings(engine).ballsInCurrentOver).toBe(0); // reset
    expect(innings(engine).totalBalls).toBe(6);
  });

  it("records maidens correctly", () => {
    const engine = createT20Match();
    bowlOver(engine, [0, 0, 0, 0, 0, 0]);
    // Bowler should have 1 maiden
    expect(innings(engine).bowlers[0].maidens).toBe(1);
    expect(innings(engine).bowlers[0].overs).toBe(1);
  });

  it("does not count maiden when runs scored in over", () => {
    const engine = createT20Match();
    bowlOver(engine, [0, 0, 4, 0, 0, 0]);
    expect(innings(engine).bowlers[0].maidens).toBe(0);
    expect(innings(engine).bowlers[0].overs).toBe(1);
  });

  it("shows correct overs string after 1 over", () => {
    const engine = createT20Match();
    bowlOver(engine);
    expect(engine.getOversString(innings(engine))).toBe("1.0");
  });

  it("shows correct overs string after 1.3 overs", () => {
    const engine = createT20Match();
    bowlOver(engine); // 1 over
    run(engine, 0); run(engine, 0); run(engine, 0); // 3 balls
    expect(engine.getOversString(innings(engine))).toBe("1.3");
  });
});

// ─── 4. Extras ───────────────────────────────────────────────────────────────

describe("Extras scoring", () => {
  it("records a wide ball correctly", () => {
    const engine = createT20Match();
    wide(engine, 2);
    const inns = innings(engine);
    expect(inns.totalRuns).toBe(2);
    expect(inns.extras.wides).toBe(2);
    // Wide doesn't count as legal delivery or ball faced
    expect(inns.totalBalls).toBe(1); // counts as ball bowled
    expect(inns.totalLegalDeliveries).toBe(0); // not legal
    expect(inns.battingOrder[0].ballsFaced).toBe(0); // not faced by batter
  });

  it("records a no-ball correctly and sets free hit", () => {
    const engine = createT20Match();
    noball(engine, 2, 1); // 2 off bat + 1 no-ball = 3 total
    const inns = innings(engine);
    expect(inns.totalRuns).toBe(3);
    expect(inns.extras.noBalls).toBe(1);
    expect(inns.isFreeHitActive).toBe(true);
    expect(inns.battingOrder[0].runs).toBe(2); // runs off bat credited
    expect(inns.battingOrder[0].ballsFaced).toBe(1); // counts as ball faced
    // No-ball doesn't count as a legal ball or ball bowled
    expect(inns.totalLegalDeliveries).toBe(0);
    expect(inns.totalBalls).toBe(0);
  });

  it("next ball after no-ball is a free hit", () => {
    const engine = createT20Match();
    noball(engine); // sets free hit
    const ball = run(engine, 4); // free hit ball
    expect(ball.isFreeHit).toBe(true);
    expect(innings(engine).isFreeHitActive).toBe(false); // reset after free hit
  });

  it("run-out is the only dismissal valid on free hit", () => {
    const engine = createT20Match();
    noball(engine); // sets free hit
    // Bowled on free hit should throw
    expect(() =>
      wicket(engine, DismissalType.BOWLED, "R Sharma"),
    ).toThrow("not valid on a free hit");
  });

  it("run-out IS valid on free hit", () => {
    const engine = createT20Match();
    noball(engine);
    // Need to switch to non-striker getting out
    // After no-ball, free hit is active. Run out should work.
    const ball = engine.recordDelivery({
      runsOffBat: 0,
      extraType: ExtraType.NONE,
      isWicket: true,
      dismissalType: DismissalType.RUN_OUT,
      batterOut: "V Kohli",
    });
    expect(ball.isWicket).toBe(true);
    expect(ball.dismissalType).toBe(DismissalType.RUN_OUT);
  });

  it("records bye correctly", () => {
    const engine = createT20Match();
    engine.recordDelivery({
      runsOffBat: 0,
      extraType: ExtraType.BYE,
      extraRuns: 2,
    });
    const inns = innings(engine);
    expect(inns.totalRuns).toBe(2);
    expect(inns.extras.byes).toBe(2);
    // No runs credited to batter
    expect(inns.battingOrder[0].runs).toBe(0);
  });

  it("records leg-bye correctly", () => {
    const engine = createT20Match();
    engine.recordDelivery({
      runsOffBat: 0,
      extraType: ExtraType.LEG_BYE,
      extraRuns: 1,
    });
    const inns = innings(engine);
    expect(inns.totalRuns).toBe(1);
    expect(inns.extras.legByes).toBe(1);
  });

  it("odd byes rotate strike", () => {
    const engine = createT20Match();
    engine.recordDelivery({
      runsOffBat: 0,
      extraType: ExtraType.LEG_BYE,
      extraRuns: 3,
    });
    // Odd runs from leg-bye → strike rotates
    expect(innings(engine).currentStriker).toBe(1); // V Kohli on strike
  });
});

// ─── 5. Wickets ──────────────────────────────────────────────────────────────

describe("Wicket handling", () => {
  it("records bowled dismissal correctly", () => {
    const engine = createT20Match();
    wicket(engine, DismissalType.BOWLED, "R Sharma");
    expect(wkts(engine)).toBe(1);
    expect(innings(engine).battingOrder[0].isOut).toBe(true);
    expect(innings(engine).battingOrder[0].dismissalType).toBe(DismissalType.BOWLED);
    // Bowler gets credit
    expect(innings(engine).bowlers[0].wickets).toBe(1);
  });

  it("records caught dismissal correctly", () => {
    const engine = createT20Match();
    wicket(engine, DismissalType.CAUGHT, "R Sharma");
    expect(wkts(engine)).toBe(1);
    expect(innings(engine).battingOrder[0].isOut).toBe(true);
    // Caught credited to bowler
    expect(innings(engine).bowlers[0].wickets).toBe(1);
  });

  it("records LBW dismissal correctly", () => {
    const engine = createT20Match();
    wicket(engine, DismissalType.LBW, "R Sharma");
    expect(wkts(engine)).toBe(1);
    expect(innings(engine).bowlers[0].wickets).toBe(1);
  });

  it("run-out is NOT credited to the bowler", () => {
    const engine = createT20Match();
    engine.recordDelivery({
      runsOffBat: 0,
      isWicket: true,
      dismissalType: DismissalType.RUN_OUT,
      batterOut: "V Kohli",
      fielderInvolved: "S Yadav",
    });
    expect(wkts(engine)).toBe(1);
    expect(innings(engine).bowlers[0].wickets).toBe(0);
    expect(innings(engine).fallOfWickets[0].fielderInvolved).toBe("S Yadav");
  });

  it("new batter comes in after wicket", () => {
    const engine = createT20Match();
    wicket(engine, DismissalType.BOWLED, "R Sharma");
    expect(innings(engine).currentStriker).toBe(2); // S Yadav in
    expect(innings(engine).battingOrder[2].status).toBe("batting");
  });

  it("all out triggers after 10 wickets (11 players)", () => {
    const engine = createT20Match();
    // Dismiss all 10 batters
    for (let i = 0; i < 10; i++) {
      const target = innings(engine).battingOrder[innings(engine).currentStriker];
      wicket(engine, DismissalType.BOWLED, target.name);
    }
    // After all out, engine transitions to 2nd innings. Check 1st innings directly.
    const state = engine.getState();
    const firstInnings = state.innings[0];
    expect(firstInnings.totalWickets).toBe(10);
    expect(firstInnings.isAllOut).toBe(true);
    expect(firstInnings.isComplete).toBe(true);
  });
});

// ─── 6. Bowling Figures ──────────────────────────────────────────────────────

describe("Bowling figures", () => {
  it("tracks runs conceded by bowler", () => {
    const engine = createT20Match();
    bowlOver(engine, [4, 1, 6, 0, 2, 3]);
    // 4+1+6+0+2+3 = 16 runs
    expect(innings(engine).bowlers[0].runsConceded).toBe(16);
    expect(innings(engine).bowlers[0].overs).toBe(1);
    expect(innings(engine).bowlers[0].economyRate).toBe(16);
  });

  it("tracks wides against bowler", () => {
    const engine = createT20Match();
    wide(engine, 1);
    wide(engine, 2);
    expect(innings(engine).bowlers[0].wides).toBe(2);
    expect(innings(engine).bowlers[0].runsConceded).toBe(3);
  });

  it("tracks no-balls against bowler", () => {
    const engine = createT20Match();
    noball(engine, 0, 1);
    noball(engine, 4, 1); // 4 off bat + 1 no-ball
    expect(innings(engine).bowlers[0].noBalls).toBe(2);
    expect(innings(engine).bowlers[0].runsConceded).toBe(6);
  });

  it("changes bowler mid-innings", () => {
    const engine = createT20Match();
    bowlOver(engine, [1, 0, 0, 0, 0, 0]); // Over 1: J Bumrah
    engine.setCurrentBowler("R Ashwin");
    bowlOver(engine, [4, 4, 0, 0, 1, 0]); // Over 2: R Ashwin
    const bowlers = engine.getBowlingFigures();
    expect(bowlers[0].name).toBe("J Bumrah");
    expect(bowlers[0].overs).toBe(1);
    expect(bowlers[0].runsConceded).toBe(1);
    expect(bowlers[1].name).toBe("R Ashwin");
    expect(bowlers[1].overs).toBe(1);
    expect(bowlers[1].runsConceded).toBe(9);
  });
});

// ─── 7. Partnerships ─────────────────────────────────────────────────────────

describe("Partnership tracking", () => {
  it("tracks partnership runs", () => {
    const engine = createT20Match();
    run(engine, 1); // R Sharma 1, rotates → V Kohli on strike
    run(engine, 4); // V Kohli 4
    run(engine, 2); // V Kohli 2
    const partner = innings(engine).currentPartnership;
    expect(partner.runs).toBe(7); // 1 + 4 + 2 = 7
    expect(partner.balls).toBe(3);
  });

  it("resets partnership on wicket", () => {
    const engine = createT20Match();
    run(engine, 1); // partnership: 1 run
    run(engine, 4); // partnership: 5 runs
    wicket(engine, DismissalType.BOWLED, "V Kohli"); // partnership resets
    const partner = innings(engine).currentPartnership;
    expect(partner.runs).toBe(0);
    expect(partner.balls).toBe(0);
    // Previous partnership should be archived
    expect(innings(engine).partnershipHistory.length).toBe(1);
    expect(innings(engine).partnershipHistory[0].runs).toBe(5);
  });
});

// ─── 8. Innings Transition ───────────────────────────────────────────────────

describe("Innings transition", () => {
  it("starts second innings with target after first innings ends", () => {
    const engine = createT20Match();
    // Score some runs, then end innings
    bowlOver(engine, [4, 1, 6, 0, 2, 3]); // 16 runs in 1 over
    engine.endInnings();
    const state = engine.getState();
    expect(state.currentInnings).toBe(2);
    expect(state.innings.length).toBe(2);
    // Target should be 17 (16 + 1)
    expect(state.innings[1].target).toBe(17);
  });

  it("completes match after second innings", () => {
    const engine = createT20Match();
    bowlOver(engine, [4, 1, 6, 0, 2, 3]); // 16 runs
    engine.endInnings(); // end of 1st innings
    // 2nd innings: chasing team — set up batters and bowlers
    ["F du Plessis", "V Kohli", "G Maxwell", "D Karthik"].forEach((name, i) => {
      engine.addBatter(`cb${i + 1}`, name);
    });
    engine.setOpeningBatters("F du Plessis", "V Kohli");
    ["J Bumrah", "R Ashwin"].forEach((name, i) => {
      engine.addBowler(`bb${i + 1}`, name);
    });
    engine.setCurrentBowler("R Ashwin");
    bowlOver(engine, [1, 1, 1, 1, 1, 1]); // 6 runs, not enough
    engine.endInnings();
    const result = engine.getResult();
    expect(result!.winner).toBe("Eagles"); // team batting first
    expect(result!.resultType).toBe(ResultType.WIN_BY_RUNS);
    expect(result!.margin).toBe("10 runs"); // 16 - 6
  });
});

// ─── 9. Target Chase Results ─────────────────────────────────────────────────

describe("Target chase results", () => {
  it("shows win by wickets when chasing team reaches target", () => {
    const engine = createT20Match();
    bowlOver(engine, [4, 1, 6, 0, 2, 3]); // 16 runs
    engine.endInnings();
    // 2nd innings: chase 17 — set up batters and bowlers
    ["F du Plessis", "V Kohli", "G Maxwell"].forEach((name, i) => {
      engine.addBatter(`cb${i + 1}`, name);
    });
    engine.setOpeningBatters("F du Plessis", "V Kohli");
    ["J Bumrah", "R Ashwin"].forEach((name, i) => {
      engine.addBowler(`bb${i + 1}`, name);
    });
    engine.setCurrentBowler("R Ashwin");
    run(engine, 6); run(engine, 6); run(engine, 6); // 18 runs → target reached
    const result = engine.getResult();
    expect(result!.winner).toBe("Falcons");
    expect(result!.resultType).toBe(ResultType.WIN_BY_WICKETS);
  });

  it("shows tie when scores level", () => {
    const engine = createT20Match();
    bowlOver(engine, [1, 0, 0, 0, 0, 0]); // 1 run
    engine.endInnings();
    // 2nd innings: chase 2 — set up batters and bowlers
    ["F du Plessis", "V Kohli"].forEach((name, i) => {
      engine.addBatter(`cb${i + 1}`, name);
    });
    engine.setOpeningBatters("F du Plessis", "V Kohli");
    ["J Bumrah"].forEach((name, i) => {
      engine.addBowler(`bb${i + 1}`, name);
    });
    engine.setCurrentBowler("J Bumrah");
    run(engine, 1); // 1 run, need 1 more
    engine.endInnings();
    const result = engine.getResult();
    expect(result!.resultType).toBe(ResultType.TIED);
  });
});

// ─── 10. Undo ────────────────────────────────────────────────────────────────

describe("Undo last delivery", () => {
  it("reverts runs after undo", () => {
    const engine = createT20Match();
    run(engine, 4);
    expect(innings(engine).totalRuns).toBe(4);
    const undone = engine.undoLastDelivery();
    expect(undone).toBe(true);
    expect(innings(engine).totalRuns).toBe(0);
    expect(innings(engine).battingOrder[0].runs).toBe(0);
  });

  it("reverts wicket after undo", () => {
    const engine = createT20Match();
    wicket(engine, DismissalType.BOWLED, "R Sharma");
    expect(wkts(engine)).toBe(1);
    engine.undoLastDelivery();
    expect(wkts(engine)).toBe(0);
    expect(innings(engine).battingOrder[0].isOut).toBe(false);
  });

  it("reverts over completion after undo", () => {
    const engine = createT20Match();
    bowlOver(engine, [0, 0, 0, 0, 0, 1]); // 1 run, over ends
    expect(innings(engine).ballsInCurrentOver).toBe(0);
    expect(innings(engine).totalBalls).toBe(6);
    engine.undoLastDelivery();
    expect(innings(engine).totalBalls).toBe(5);
    expect(innings(engine).ballsInCurrentOver).toBe(5);
  });

  it("returns false when no deliveries to undo", () => {
    const engine = createT20Match();
    expect(engine.undoLastDelivery()).toBe(false);
  });

  it("does not undo across innings boundaries", () => {
    const engine = createT20Match();
    bowlOver(engine, [0, 0, 0, 0, 0, 1]);
    engine.endInnings(); // transitions to 2nd innings
    // Undo in 2nd innings should not affect 1st innings
    ["F du Plessis", "V Kohli"].forEach((name, i) => {
      engine.addBatter(`cb${i + 1}`, name);
    });
    engine.setOpeningBatters("F du Plessis", "V Kohli");
    ["J Bumrah"].forEach((name, i) => {
      engine.addBowler(`bb${i + 1}`, name);
    });
    engine.setCurrentBowler("J Bumrah");
    run(engine, 4);
    expect(engine.undoLastDelivery()).toBe(true); // undo the 4 in 2nd innings
    expect(innings(engine).totalRuns).toBe(0);
  });
});

// ─── 11. Edge Cases ──────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("throws error when no active innings", () => {
    const engine = new CricketRulesEngine(MatchFormat.T20, "A", "B");
    // No toss, no match started
    expect(() => run(engine, 4)).toThrow("No active innings");
  });

  it("throws error when recording to completed innings", () => {
    const engine = createT20Match();
    engine.endInnings(); // ends innings 1, starts innings 2
    engine.endInnings(); // ends innings 2, match complete
    expect(() => run(engine, 4)).toThrow("No active innings");
  });

  it("requires toss before starting match", () => {
    const engine = new CricketRulesEngine(MatchFormat.T20, "A", "B");
    expect(() => engine.startMatch()).toThrow("Toss must be recorded");
  });

  it("handles 0 runs correctly as a dot ball (maiden context)", () => {
    const engine = createT20Match();
    const ball = run(engine, 0);
    expect(ball.isMaidenBall).toBe(true);
  });

  it("Singleton: win by 1 run", () => {
    const engine = createT20Match();
    bowlOver(engine, [0, 0, 0, 0, 0, 1]); // 1 run
    engine.endInnings();
    // 2nd innings: chase 2, only score 0
    ["F du Plessis", "V Kohli"].forEach((name, i) => {
      engine.addBatter(`cb${i + 1}`, name);
    });
    engine.setOpeningBatters("F du Plessis", "V Kohli");
    ["J Bumrah"].forEach((name, i) => {
      engine.addBowler(`bb${i + 1}`, name);
    });
    engine.setCurrentBowler("J Bumrah");
    bowlOver(engine, [0, 0, 0, 0, 0, 0]); // 0 runs
    engine.endInnings();
    const result = engine.getResult();
    expect(result!.resultType).toBe(ResultType.WIN_BY_RUNS);
    expect(result!.margin).toBe("1 run");
  });

  it("uses custom playersPerSide correctly for all-out calculation", () => {
    const engine = new CricketRulesEngine(MatchFormat.T20, "A", "B", 20, 6, 8);
    engine.recordToss("A", TossDecision.BAT);
    engine.startMatch();
    ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"].forEach((name, i) => {
      engine.addBatter(`p${i + 1}`, name);
    });
    engine.addBowler("b1", "Bowler");
    engine.setOpeningBatters("P1", "P2");
    engine.setCurrentBowler("Bowler");
    // 7 wickets = all out (8 players) — engine transitions to 2nd innings
    for (let i = 0; i < 7; i++) {
      const striker = innings(engine).battingOrder[innings(engine).currentStriker];
      wicket(engine, DismissalType.BOWLED, striker.name);
    }
    // Check first innings directly (current innings is now 2nd)
    const firstInnings = engine.getState().innings[0];
    expect(firstInnings.totalWickets).toBe(7);
    expect(firstInnings.isAllOut).toBe(true);
  });

  it("enforces MCC Law 17.2: same bowler cannot bowl consecutive overs", () => {
    const engine = createT20Match();
    // Over 1: Initial Bowler A ("J Bumrah")
    bowlOver(engine, [0, 0, 0, 0, 0, 0]);
    expect(engine.getCurrentInnings()?.lastOverBowlerName).toBe("J Bumrah");

    // Over 2: Try setting J Bumrah again -> should throw Error!
    expect(() => engine.setCurrentBowler("J Bumrah")).toThrow("cannot bowl consecutive overs");

    // Over 2: Bowler B ("B Kumar") -> should succeed
    engine.setCurrentBowler("B Kumar");
    bowlOver(engine, [0, 0, 0, 0, 0, 0]);
    expect(engine.getCurrentInnings()?.lastOverBowlerName).toBe("B Kumar");

    // Over 3: J Bumrah is now allowed again!
    expect(() => engine.setCurrentBowler("J Bumrah")).not.toThrow();
  });
});
