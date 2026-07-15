/**
 * Live Match Store
 * Simple singleton store that persists match data across screens.
 * The live scoring screen publishes match snapshots here, and the
 * home screen / scorecard list reads from it to show real data.
 * Data is persisted to AsyncStorage so matches survive app restarts.
 */
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { type MatchState, MatchStatus } from "@/lib/cricket/advanced-rules-engine";

const STORAGE_KEY = "@crickpro/match_store";

export interface MatchSummary {
  id: string;
  team1: string;
  team2: string;
  format: string;
  status: "live" | "completed" | "upcoming";
  score1?: string;
  score2?: string;
  crr1?: string;
  crr2?: string;
  overs?: string;
  result?: string;
  venue?: string;
  date?: string;
}

type Listener = (matches: MatchSummary[]) => void;

// In-memory fallback when AsyncStorage is unavailable (e.g. SSR)
function getStorage(): typeof AsyncStorage | null {
  try {
    if (Platform.OS === "web") {
      // localStorage is used by AsyncStorage on web
      return AsyncStorage;
    }
    return AsyncStorage;
  } catch {
    return null;
  }
}

class MatchStore {
  private matches: Map<string, MatchSummary> = new Map();
  private listeners: Set<Listener> = new Set();
  private loaded = false;

  /** Initialise by loading persisted data from AsyncStorage */
  async loadPersisted(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    const storage = getStorage();
    if (!storage) return;

    try {
      const raw = await storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: MatchSummary[] = JSON.parse(raw);
        for (const match of parsed) {
          // Don't overwrite entries that were already added live
          // (e.g. by setMatchFromState during the async gap)
          if (!this.matches.has(match.id)) {
            this.matches.set(match.id, match);
          }
        }
      }
    } catch (e) {
      console.warn("[MatchStore] Failed to load persisted data:", e);
    }
  }

  /** Persist current matches to AsyncStorage */
  private async persist(): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    try {
      const all = this.getAll();
      await storage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("[MatchStore] Failed to persist data:", e);
    }
  }

  /** Register or update a match from its engine state */
  setMatchFromState(state: MatchState): void {
    const matchId = state.matchId;
    const existing = this.matches.get(matchId);

    const innings1 = state.innings[0];
    const innings2 = state.innings[1];

    const formatLabel = state.format.toUpperCase();
    const isLive = state.status === MatchStatus.IN_PROGRESS;
    const isCompleted = state.status === MatchStatus.COMPLETED;

    const status: "live" | "completed" = isLive ? "live" : "completed";

    const score1 = innings1
      ? `${innings1.totalRuns}/${innings1.totalWickets}`
      : undefined;
    const score2 = innings2
      ? `${innings2.totalRuns}/${innings2.totalWickets}`
      : undefined;

    const overs1 = innings1 ? this.formatOvers(innings1.totalBalls, state.ballsPerOver) : undefined;
    const overs2 = innings2 ? this.formatOvers(innings2.totalBalls, state.ballsPerOver) : undefined;

    const crr1 = innings1 && innings1.totalBalls > 0
      ? (innings1.totalRuns / (innings1.totalBalls / state.ballsPerOver)).toFixed(2)
      : undefined;
    const crr2 = innings2 && innings2.totalBalls > 0
      ? (innings2.totalRuns / (innings2.totalBalls / state.ballsPerOver)).toFixed(2)
      : undefined;

    const oversDisplay = innings1
      ? `${overs1} ov`
      : existing?.overs;

    let result: string | undefined;
    if (isCompleted && state.result) {
      result = state.result.description;
    }

    const summary: MatchSummary = {
      id: matchId,
      team1: state.team1,
      team2: state.team2,
      format: formatLabel,
      status,
      score1,
      score2,
      crr1,
      crr2,
      overs: oversDisplay,
      result,
      venue: state.venue || existing?.venue,
      date: existing?.date || new Date().toLocaleDateString(),
    };

    this.matches.set(matchId, summary);
    this.notify();
  }

  /** Add a match as "upcoming" (before toss) */
  addUpcomingMatch(state: MatchState): void {
    const summary: MatchSummary = {
      id: state.matchId,
      team1: state.team1,
      team2: state.team2,
      format: state.format.toUpperCase(),
      status: "upcoming",
      venue: state.venue,
      date: new Date().toLocaleDateString(),
    };
    this.matches.set(state.matchId, summary);
    this.notify();
  }

  /** Get all matches */
  getAll(): MatchSummary[] {
    return Array.from(this.matches.values());
  }

  /** Get live matches */
  getLive(): MatchSummary[] {
    return Array.from(this.matches.values()).filter(m => m.status === "live");
  }

  /** Get completed matches */
  getCompleted(): MatchSummary[] {
    return Array.from(this.matches.values()).filter(m => m.status === "completed");
  }

  /** Subscribe to changes — returns unsubscribe function */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Clear all stored matches (both in-memory and persisted) */
  async clearAll(): Promise<void> {
    this.matches.clear();
    this.notify();
    const storage = getStorage();
    if (storage) {
      try {
        await storage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }

  private notify(): void {
    const all = this.getAll();
    // Fire listeners first (so UI updates immediately)
    this.listeners.forEach(fn => fn(all));
    // Then persist asynchronously
    this.persist();
  }

  private formatOvers(totalBalls: number, ballsPerOver: number): string {
    const completed = Math.floor(totalBalls / ballsPerOver);
    const remaining = totalBalls % ballsPerOver;
    return `${completed}.${remaining}`;
  }
}

/** Singleton instance */
export const matchStore = new MatchStore();

/**
 * React hook to access live/store match data.
 * Re-renders whenever the store updates.
 */
export function useMatchRegistry() {
  const [matches, setMatches] = useState<MatchSummary[]>(() => matchStore.getAll());

  // Load persisted data, then subscribe to further updates
  useEffect(() => {
    matchStore.loadPersisted().then(() => {
      setMatches(matchStore.getAll());
    });

    const unsub = matchStore.subscribe((updated) => {
      // The listener fires on every in-memory update.
      // Once loadPersisted resolves above, it replaces state with
      // the most recent snapshot (which includes any updates that
      // arrived while loading). This avoids the race where a
      // setMatchFromState call from live.tsx overwrites stale
      // persisted data.
      setMatches(updated);
    });
    return unsub;
  }, []);

  const live = matches.filter(m => m.status === "live");
  const completed = matches.filter(m => m.status === "completed");
  const upcoming = matches.filter(m => m.status === "upcoming");

  const getActiveMatch = useCallback(() => {
    return live.length > 0 ? live[0] : null;
  }, [live]);

  const getRecentScorecards = useCallback(() => {
    return completed.slice(-5).reverse();
  }, [completed]);

  return {
    matches,
    live,
    completed,
    upcoming,
    getActiveMatch,
    getRecentScorecards,
    loaded,
  };
}
