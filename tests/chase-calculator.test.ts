import { describe, it, expect } from "vitest";
import { getChaseMessage } from "../lib/cricket/chase-utils";

/**
 * Chase Calculator — getChaseMessage() Unit Tests
 *
 * Tests every branch of the pure function against all win, loss, tie,
 * and active-chase edge cases.
 */

// ─── Shared fixture ──────────────────────────────────────────────────────────

const DEFAULT_PROPS: Parameters<typeof getChaseMessage>[0] = {
  teamName: "Eagles",
  target: 158,
  currentRuns: 0,
  currentWickets: 0,
  totalLegalDeliveries: 0,
  maxOvers: 20,
  ballsPerOver: 6,
  isComplete: false,
  isAllOut: false,
  resultWinner: undefined,
  playersPerSide: 11,
};

// ─── Win Scenarios ────────────────────────────────────────────────────────────

describe("Win scenarios", () => {
  it("shows win by wickets with balls remaining when team completes target with overs left", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 3,
      totalLegalDeliveries: 60, // 10 overs bowled, 10 remaining = 60 balls
      isComplete: true,
      resultWinner: "Eagles",
    });
    expect(msg).toBe("Eagles won by 7 wickets with 60 balls remaining");
  });

  it("shows win by wickets without balls remaining when match ends exactly on final ball", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 4,
      totalLegalDeliveries: 120, // all 20 overs used
      isComplete: true,
      resultWinner: "Eagles",
    });
    expect(msg).toBe("Eagles won by 6 wickets");
  });

  it("shows win by 1 wicket with 1 ball remaining (edge — singular)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 9,
      totalLegalDeliveries: 119, // 1 ball left
      isComplete: true,
      resultWinner: "Eagles",
    });
    expect(msg).toBe("Eagles won by 1 wicket with 1 ball remaining");
  });

  it("shows win by wickets when target reached before engine marks complete (runsRemaining <= 0)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 2,
      totalLegalDeliveries: 72, // 12 overs
      isComplete: false, // engine hasn't set complete yet
      resultWinner: undefined,
    });
    expect(msg).toBe("Eagles won by 8 wickets with 48 balls remaining");
  });

  it("shows win by wickets when target reached in unlimited-overs match", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 5,
      totalLegalDeliveries: 200,
      maxOvers: 0, // unlimited overs
      isComplete: false,
    });
    expect(msg).toBe("Eagles won by 5 wickets");
  });
});

// ─── Loss Scenarios ────────────────────────────────────────────────────────────

describe("Loss scenarios", () => {
  it("shows winner won by runs when chasing team loses (hasLost)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 112,
      currentWickets: 10,
      totalLegalDeliveries: 108, // 18 overs
      isComplete: true,
      resultWinner: "Falcons",
    });
    expect(msg).toBe("Falcons won by 46 runs");
  });

  it("shows winner won by 1 run (edge — singular)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 157,
      currentWickets: 10,
      totalLegalDeliveries: 120,
      isComplete: true,
      resultWinner: "Falcons",
    });
    expect(msg).toBe("Falcons won by 1 run");
  });

  it("shows winner won by runs when all out (isAllOutLost)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 98,
      currentWickets: 10,
      totalLegalDeliveries: 84,
      isAllOut: true, // all out but not yet formally complete
      isComplete: false,
      resultWinner: "Falcons",
    });
    expect(msg).toBe("Falcons won by 60 runs");
  });

  it("shows generic won by runs when resultWinner is undefined in loss path", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 100,
      currentWickets: 10,
      totalLegalDeliveries: 120,
      isAllOut: true,
      isComplete: false,
      resultWinner: undefined,
    });
    expect(msg).toBe("Won by 58 runs");
  });

  it("shows winner won by runs when overs expire (ballsRemaining <= 0)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 120,
      currentWickets: 8,
      totalLegalDeliveries: 120, // all overs used
      isComplete: false, // engine may not have caught up
      resultWinner: "Falcons",
    });
    expect(msg).toBe("Falcons won by 38 runs");
  });

  it("shows generic won by runs when overs expire and no resultWinner", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 120,
      currentWickets: 8,
      totalLegalDeliveries: 120,
      isComplete: false,
      resultWinner: undefined,
    });
    expect(msg).toBe("Won by 38 runs");
  });
});

// ─── Tie Scenarios ────────────────────────────────────────────────────────────

describe("Tie scenarios", () => {
  it("shows Match Tied when complete and no winner (isTied)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 10,
      totalLegalDeliveries: 120,
      isComplete: true,
      resultWinner: undefined,
    });
    expect(msg).toBe("Match Tied");
  });

  it("shows Match Tied when overs expire and scores level", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 8,
      totalLegalDeliveries: 120,
      isComplete: false,
      resultWinner: undefined,
    });
    expect(msg).toBe("Match Tied");
  });

  it("shows Match Tied when all out and scores level", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 158,
      currentWickets: 10,
      totalLegalDeliveries: 114,
      isComplete: true, // must be complete for isTied to trigger
      isAllOut: true,
      resultWinner: undefined,
    });
    expect(msg).toBe("Match Tied");
  });
});

// ─── Active Chase Scenarios ───────────────────────────────────────────────────

describe("Active chase scenarios", () => {
  it("shows need X runs in Y balls to win during active chase", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 85,
      currentWickets: 3,
      totalLegalDeliveries: 48, // 8 overs
    });
    expect(msg).toBe("Eagles need 73 runs in 72 balls to win");
  });

  it("shows need 1 run in 1 ball (edge — singular)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 157,
      currentWickets: 5,
      totalLegalDeliveries: 119, // 1 ball left
    });
    expect(msg).toBe("Eagles need 1 run in 1 ball to win");
  });

  it("shows need X runs to win for unlimited-overs match", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      maxOvers: 0, // Test match / unlimited
      currentRuns: 100, // below target, so still chasing
      currentWickets: 2,
      totalLegalDeliveries: 200,
    });
    expect(msg).toBe("Eagles need 58 runs to win");
  });

  it("shows correct message at start of chase (0 runs, 0 wickets, 0 balls)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 0,
      currentWickets: 0,
      totalLegalDeliveries: 0,
    });
    expect(msg).toBe("Eagles need 158 runs in 120 balls to win");
  });

  it("shows correct RRR-driven message mid-innings", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 95,
      currentWickets: 2,
      totalLegalDeliveries: 72, // 12 overs
    });
    expect(msg).toBe("Eagles need 63 runs in 48 balls to win");
  });

  it("handles custom ballsPerOver (The Hundred — 5-ball sets)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      maxOvers: 20, // 20 sets of 5 balls = 100 balls
      ballsPerOver: 5,
      target: 140,
      currentRuns: 60,
      currentWickets: 3,
      totalLegalDeliveries: 40, // 8 sets
    });
    expect(msg).toBe("Eagles need 80 runs in 60 balls to win");
  });
});

// ─── Custom Players-Per-Side ──────────────────────────────────────────────────

describe("Custom players-per-side", () => {
  it("calculates wickets-in-hand correctly for 8 players", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      playersPerSide: 8,
      currentRuns: 158,
      currentWickets: 3,
      totalLegalDeliveries: 72,
      isComplete: true,
      resultWinner: "Eagles",
    });
    expect(msg).toBe("Eagles won by 4 wickets with 48 balls remaining");
  });

  it("calculates wickets-in-hand correctly for 16 players", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      playersPerSide: 16,
      currentRuns: 158,
      currentWickets: 10,
      totalLegalDeliveries: 72,
      isComplete: true,
      resultWinner: "Eagles",
    });
    expect(msg).toBe("Eagles won by 5 wickets with 48 balls remaining");
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("handles 0 target (shouldn't happen but defensive)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      target: 0,
      currentRuns: 0,
      currentWickets: 0,
      totalLegalDeliveries: 0,
    });
    // When target is 0, runsRemaining = 0 triggers the win-branch
    expect(msg).toBe("Eagles won by 10 wickets with 120 balls remaining");
  });

  it("handles negative runsRemaining (overshoot)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      currentRuns: 200,
      currentWickets: 5,
      totalLegalDeliveries: 90,
      isComplete: false,
    });
    expect(msg).toBe("Eagles won by 5 wickets with 30 balls remaining");
  });

  it("handles very large ballsRemaining (new match, maxOvers=50 for ODI)", () => {
    const msg = getChaseMessage({
      ...DEFAULT_PROPS,
      maxOvers: 50,
      target: 280,
      currentRuns: 45,
      currentWickets: 1,
      totalLegalDeliveries: 36, // 6 overs
    });
    expect(msg).toBe("Eagles need 235 runs in 264 balls to win");
  });
});
