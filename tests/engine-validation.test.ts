/**
 * Match Creation Validation Tests (Layer 1 — Unit)
 *
 * Tests validateMatchInput() for all match creation edge cases:
 * - Same team names → error
 * - Empty / missing team names → error
 * - All valid formats accepted (T10, T20, ODI, Custom)
 * - 0 overs → error (limited-overs formats)
 * - Negative overs → error
 * - Invalid balls per over → error
 * - Invalid players per side → error
 */
import { describe, it, expect } from "vitest";
import {
  validateMatchInput,
  assertValidMatchInput,
  MatchFormat,
  type MatchInputValidation,
} from "../lib/cricket/advanced-rules-engine";

// ─── Shared fixture ──────────────────────────────────────────────────────────

const VALID_INPUT: MatchInputValidation = {
  format: MatchFormat.T20,
  team1: "India",
  team2: "Australia",
};

function expectValid(input: MatchInputValidation): void {
  expect(validateMatchInput(input)).toEqual([]);
  expect(() => assertValidMatchInput(input)).not.toThrow();
}

function expectError(input: MatchInputValidation, field: string, msg?: string): void {
  const errors = validateMatchInput(input);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors.some((e) => e.field === field)).toBe(true);
  if (msg) {
    expect(errors.find((e) => e.field === field)!.message).toBe(msg);
  }
  expect(() => assertValidMatchInput(input)).toThrow();
}

// ─── Valid Inputs ────────────────────────────────────────────────────────────

describe("Valid match inputs", () => {
  it("accepts T20 with default params", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.T20 });
  });

  it("accepts ODI with default params", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.ODI });
  });

  it("accepts T10 with default params", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.T10 });
  });

  it("accepts Test with default params", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.TEST });
  });

  it("accepts The Hundred with default params", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.THE_HUNDRED });
  });

  it("accepts Custom with custom overs", () => {
    expectValid({
      ...VALID_INPUT,
      format: MatchFormat.CUSTOM,
      customOvers: 15,
      customBallsPerOver: 6,
      playersPerSide: 11,
      customInningsCount: 1,
    });
  });

  it("accepts single-character team names", () => {
    expectValid({ ...VALID_INPUT, team1: "A", team2: "B" });
  });

  it("accepts long team names with hyphens and spaces", () => {
    expectValid({ ...VALID_INPUT, team1: "Sri Lanka", team2: "West Indies" });
  });

  it("accepts Test format with 0 overs (unlimited)", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.TEST, customOvers: 0 });
  });
});

// ─── Same Team ───────────────────────────────────────────────────────────────

describe("Same team validation", () => {
  it("rejects identical team names", () => {
    expectError(
      { ...VALID_INPUT, team1: "India", team2: "India" },
      "team2",
      "Teams must be different",
    );
  });

  it("rejects case-insensitive same team names", () => {
    expectError(
      { ...VALID_INPUT, team1: "India", team2: "india" },
      "team2",
      "Teams must be different",
    );
  });

  it("rejects trimmed same team names", () => {
    expectError(
      { ...VALID_INPUT, team1: "  India  ", team2: "India" },
      "team2",
      "Teams must be different",
    );
  });
});

// ─── Missing / Empty Teams ───────────────────────────────────────────────────

describe("Team name required validation", () => {
  it("rejects empty team1", () => {
    expectError({ ...VALID_INPUT, team1: "" }, "team1");
  });

  it("rejects empty team2", () => {
    expectError({ ...VALID_INPUT, team2: "" }, "team2");
  });

  it("rejects whitespace-only team1", () => {
    expectError({ ...VALID_INPUT, team1: "   " }, "team1");
  });

  it("rejects both empty teams", () => {
    const errors = validateMatchInput({ ...VALID_INPUT, team1: "", team2: "" });
    expect(errors.length).toBe(2);
    expect(errors.some((e) => e.field === "team1")).toBe(true);
    expect(errors.some((e) => e.field === "team2")).toBe(true);
  });
});

// ─── Invalid Overs ───────────────────────────────────────────────────────────

describe("Overs validation", () => {
  it("rejects negative overs", () => {
    expectError(
      { ...VALID_INPUT, customOvers: -1 },
      "customOvers",
      "Overs must be a non-negative integer",
    );
  });

  it("rejects NaN overs", () => {
    expectError(
      { ...VALID_INPUT, customOvers: NaN },
      "customOvers",
      "Overs must be a non-negative integer",
    );
  });

  it("rejects Infinity overs", () => {
    expectError({ ...VALID_INPUT, customOvers: Infinity }, "customOvers");
  });

  it("rejects 0 overs for T20 (limited-overs format)", () => {
    expectError(
      { ...VALID_INPUT, format: MatchFormat.T20, customOvers: 0 },
      "customOvers",
      "Overs must be greater than 0 for limited-overs formats",
    );
  });

  it("rejects 0 overs for ODI (limited-overs format)", () => {
    expectError({ ...VALID_INPUT, format: MatchFormat.ODI, customOvers: 0 }, "customOvers");
  });

  it("rejects 0 overs for T10 (limited-overs format)", () => {
    expectError({ ...VALID_INPUT, format: MatchFormat.T10, customOvers: 0 }, "customOvers");
  });
});

// ─── Invalid Balls Per Over ──────────────────────────────────────────────────

describe("Balls per over validation", () => {
  it("rejects 0 balls per over", () => {
    expectError({ ...VALID_INPUT, customBallsPerOver: 0 }, "customBallsPerOver");
  });

  it("rejects negative balls per over", () => {
    expectError({ ...VALID_INPUT, customBallsPerOver: -1 }, "customBallsPerOver");
  });

  it("rejects non-integer balls per over", () => {
    expectError({ ...VALID_INPUT, customBallsPerOver: 3.5 }, "customBallsPerOver");
  });

  it("accepts unusual balls per over (5 for The Hundred)", () => {
    expectValid({ ...VALID_INPUT, customBallsPerOver: 5 });
  });

  it("accepts 10 balls per over", () => {
    expectValid({ ...VALID_INPUT, customBallsPerOver: 10 });
  });
});

// ─── Invalid Players Per Side ────────────────────────────────────────────────

describe("Players per side validation", () => {
  it("rejects 0 players", () => {
    expectError({ ...VALID_INPUT, playersPerSide: 0 }, "playersPerSide");
  });

  it("rejects negative players", () => {
    expectError({ ...VALID_INPUT, playersPerSide: -5 }, "playersPerSide");
  });

  it("rejects non-integer players", () => {
    expectError({ ...VALID_INPUT, playersPerSide: 7.5 }, "playersPerSide");
  });

  it("accepts 8 players (custom)", () => {
    expectValid({ ...VALID_INPUT, playersPerSide: 8 });
  });

  it("accepts 16 players (custom)", () => {
    expectValid({ ...VALID_INPUT, playersPerSide: 16 });
  });
});

// ─── Invalid Innings Count ───────────────────────────────────────────────────

describe("Innings count validation", () => {
  it("rejects 0 innings", () => {
    expectError({ ...VALID_INPUT, customInningsCount: 0 }, "customInningsCount");
  });

  it("rejects negative innings", () => {
    expectError({ ...VALID_INPUT, customInningsCount: -1 }, "customInningsCount");
  });

  it("rejects non-integer innings", () => {
    expectError({ ...VALID_INPUT, customInningsCount: 1.5 }, "customInningsCount");
  });

  it("accepts 2 innings (Test match)", () => {
    expectValid({ ...VALID_INPUT, format: MatchFormat.TEST, customInningsCount: 2 });
  });
});

// ─── Multiple Errors ─────────────────────────────────────────────────────────

describe("Multiple validation errors", () => {
  it("returns all errors at once", () => {
    const errors = validateMatchInput({
      format: MatchFormat.T20,
      team1: "",
      team2: "",
      customOvers: -5,
      customBallsPerOver: 0,
    });
    expect(errors.length).toBeGreaterThanOrEqual(4); // empty team1, empty team2, overs, balls
  });
});
