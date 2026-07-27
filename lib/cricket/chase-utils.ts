/**
 * Chase Calculator Utilities
 *
 * Pure functions for computing chase/result messages.
 * Extracted from the React component so they can be unit-tested
 * without needing JSX parsing (vitest limitation).
 */

export interface ChaseMessageInput {
  teamName: string;
  target: number;
  currentRuns: number;
  currentWickets: number;
  totalLegalDeliveries: number;
  maxOvers: number;
  ballsPerOver: number;
  isComplete: boolean;
  isAllOut: boolean;
  resultWinner?: string;
  playersPerSide: number;
}

/**
 * Pure function that returns the contextual chase/result message.
 * Matches Cricbuzz/ESPN Cricinfo style. Fully testable without React.
 */
export function getChaseMessage(input: ChaseMessageInput): string {
  const {
    teamName,
    target,
    currentRuns,
    currentWickets,
    totalLegalDeliveries,
    maxOvers,
    ballsPerOver,
    isComplete,
    isAllOut,
    resultWinner,
    playersPerSide,
  } = input;

  const totalLegalBalls = maxOvers > 0 ? maxOvers * ballsPerOver : Infinity;
  const ballsRemaining = Math.max(0, totalLegalBalls - totalLegalDeliveries);
  const runsRemaining = Math.max(0, target - currentRuns);

  const hasWon = isComplete && resultWinner === teamName;
  const hasLost = isComplete && !!resultWinner && resultWinner !== teamName;
  const isTied = isComplete && !resultWinner;
  const isAllOutLost = isAllOut && !hasWon;

  if (hasWon) {
    const wicketsInHand = playersPerSide - 1 - currentWickets;
    const withBalls = isFinite(ballsRemaining) && ballsRemaining > 0
      ? ` with ${ballsRemaining} ball${ballsRemaining !== 1 ? "s" : ""} remaining`
      : "";
    return `${teamName} won by ${wicketsInHand} wicket${wicketsInHand !== 1 ? "s" : ""}${withBalls}`;
  }

  if (hasWon) {
    // ...checked above, intentional fall-through to keep logic flow visible
  } else if (hasLost) {
    if (!resultWinner) return `Won by ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""}`;
    return `${resultWinner} won by ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""}`;
  }

  if (isTied) {
    return "Match Tied";
  }

  // All out — check if it's a tie first, then use resultWinner if available
  if (isAllOutLost) {
    if (runsRemaining === 0 || currentRuns === target) return "Match Tied";
    if (resultWinner) return `${resultWinner} won by ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""}`;
    return `Won by ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""}`;
  }

  if (isFinite(ballsRemaining) && ballsRemaining <= 0) {
    if (currentRuns === target) return "Match Tied";
    if (resultWinner) {
      return `${resultWinner} won by ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""}`;
    }
    return `Won by ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""}`;
  }

  if (runsRemaining <= 0) {
    const wicketsInHand = playersPerSide - 1 - currentWickets;
    const withBalls = isFinite(ballsRemaining)
      ? ` with ${ballsRemaining} ball${ballsRemaining !== 1 ? "s" : ""} remaining`
      : "";
    return `${teamName} won by ${wicketsInHand} wicket${wicketsInHand !== 1 ? "s" : ""}${withBalls}`;
  }

  // Active chase messages
  if (!isFinite(ballsRemaining)) {
    return `${teamName} need ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""} to win`;
  }
  return `${teamName} need ${runsRemaining} run${runsRemaining !== 1 ? "s" : ""} in ${ballsRemaining} ball${ballsRemaining !== 1 ? "s" : ""} to win`;
}
