/**
 * Database Access Layer
 * All Drizzle query functions for the application.
 */
import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, InsertPlayer, users, players,
  teams, InsertTeam,
  teamMembers,
  leagues, InsertLeague,
  leagueTeams,
  leagueStandings,
  matches, InsertMatch,
  innings as inningsTable, InsertInnings,
  balls, InsertBall,
  batsmanScores, InsertBatsmanScore,
  bowlerStats, InsertBowlerStat,
  playerCareerStats, InsertPlayerCareerStat,
} from "../../drizzle/schema";
import { ENV } from "../core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===================================================================
// USERS
// ===================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[DB] Cannot upsert user: DB not available"); return; }
  try {
    const values: Record<string, unknown> = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    for (const field of ["name", "email", "loginMethod", "passwordHash", "phone"] as const) {
      if (user[field] !== undefined) {
        values[field] = user[field] ?? undefined;
        updateSet[field] = user[field] ?? undefined;
      }
    }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values as InsertUser).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[DB] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}


export async function updateUserPhone(openId: string, phone: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ phone, phoneVerified: 1 }).where(eq(users.openId, openId));
}

export async function updateUserName(openId: string, name: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ name }).where(eq(users.openId, openId));
}

// ===================================================================
// PLAYERS
// ===================================================================

export async function upsertPlayerProfile(userId: number, data: {
  role?: string | null; jerseyNumber?: number | null;
  battingStyle?: string | null; bowlingStyle?: string | null;
  city?: string | null; bio?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
  if (existing.length > 0) {
    if (Object.keys(data).length > 0) await db.update(players).set(data as any).where(eq(players.id, existing[0].id));
  } else {
    const vals: Record<string, unknown> = { userId, role: data.role ?? "batsman" };
    if (data.jerseyNumber != null) vals.jerseyNumber = data.jerseyNumber;
    if (data.battingStyle != null) vals.battingStyle = data.battingStyle;
    if (data.bowlingStyle != null) vals.bowlingStyle = data.bowlingStyle;
    if (data.city != null) vals.city = data.city;
    if (data.bio != null) vals.bio = data.bio;
    await db.insert(players).values(vals as InsertPlayer);
  }
}

export async function getPlayerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
  return result[0];
}

export async function getPlayerById(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  return result[0];
}

// ===================================================================
// TEAMS
// ===================================================================

export async function createTeam(data: {
  name: string; logoUrl?: string | null; homeGround?: string | null; teamColor?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const vals: Record<string, unknown> = { name: data.name, teamColor: data.teamColor ?? "#0a7ea4" };
  if (data.logoUrl) vals.logoUrl = data.logoUrl;
  if (data.homeGround) vals.homeGround = data.homeGround;
  const result = await db.insert(teams).values(vals as InsertTeam);
  return result[0].insertId;
}

export async function getTeamById(teamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return result[0];
}

export async function listTeams(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).orderBy(asc(teams.name)).limit(limit).offset(offset);
}

export async function addTeamMember(teamId: number, playerId: number, role = "player") {
  const db = await getDb();
  if (!db) return;
  await db.insert(teamMembers).values({ teamId, playerId, role });
}

// ===================================================================
// LEAGUES
// ===================================================================

export async function createLeague(data: {
  name: string; format?: string; matchFormat?: string;
  numberOfTeams?: number; organizerId?: number;
  startDate?: Date | null; endDate?: Date | null; description?: string | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const vals: Record<string, unknown> = {
    name: data.name, format: data.format ?? "round-robin",
    matchFormat: data.matchFormat ?? "T20",
  };
  if (data.numberOfTeams != null) vals.numberOfTeams = data.numberOfTeams;
  if (data.organizerId != null) vals.organizerId = data.organizerId;
  if (data.startDate != null) vals.startDate = data.startDate;
  if (data.endDate != null) vals.endDate = data.endDate;
  if (data.description) vals.description = data.description;
  const result = await db.insert(leagues).values(vals as InsertLeague);
  return result[0].insertId;
}

export async function getLeagueById(leagueId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);
  return result[0];
}

export async function listLeagues(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leagues).orderBy(desc(leagues.createdAt)).limit(limit).offset(offset);
}

export async function addTeamToLeague(leagueId: number, teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(leagueTeams).values({ leagueId, teamId });
}

export async function getLeagueStandings(leagueId: number) {
  const db = await getDb();
  if (!db) return [];
  const standings = await db.select().from(leagueStandings).where(eq(leagueStandings.leagueId, leagueId)).orderBy(desc(leagueStandings.points), desc(leagueStandings.nrr));
  const teamsMap = new Map<number, string>();
  for (const s of standings) {
    const tid = s.teamId!;
    if (!teamsMap.has(tid)) {
      const t = await getTeamById(tid);
      if (t) teamsMap.set(tid, t.name);
    }
  }
  return standings.map(s => ({ ...s, teamName: teamsMap.get(s.teamId!) || "Unknown" }));
}

export async function updateLeagueStanding(leagueId: number, teamId: number, data: Partial<{
  played: number; won: number; lost: number; tied: number;
  points: number; nrr: number; runsFor: number; runsAgainst: number;
}>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(leagueStandings)
    .where(and(eq(leagueStandings.leagueId, leagueId), eq(leagueStandings.teamId, teamId))).limit(1);
  if (existing.length > 0) {
    await db.update(leagueStandings).set(data as any).where(eq(leagueStandings.id, existing[0]!.id));
  } else {
    await db.insert(leagueStandings).values({ leagueId, teamId, ...data as any });
  }
}

// ===================================================================
// MATCHES
// ===================================================================

export async function createMatch(data: {
  leagueId?: number | null; team1Name: string; team2Name: string;
  format: string; venue?: string | null; scorerId?: number | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [t1] = await db.select().from(teams).where(eq(teams.name, data.team1Name)).limit(1);
  const [t2] = await db.select().from(teams).where(eq(teams.name, data.team2Name)).limit(1);
  const team1Id = t1?.id;
  const team2Id = t2?.id;
  const vals: Record<string, unknown> = { format: data.format, status: "scheduled" };
  if (data.leagueId != null) vals.leagueId = data.leagueId;
  if (team1Id != null) vals.team1Id = team1Id;
  if (team2Id != null) vals.team2Id = team2Id;
  if (data.venue) vals.venue = data.venue;
  if (data.scorerId != null) vals.scorerId = data.scorerId;
  const result = await db.insert(matches).values(vals as InsertMatch);
  return result[0].insertId;
}

export async function getMatchById(matchId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  return result[0];
}

export async function listMatches(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit).offset(offset);
}

export async function updateMatchStatus(matchId: number, status: string, additional?: {
  startedAt?: Date; completedAt?: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(matches).set({ status, ...additional }).where(eq(matches.id, matchId));
}

// ===================================================================
// INNINGS
// ===================================================================

export async function createInnings(data: {
  matchId: number; teamId?: number | null; inningsNumber: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const vals: Record<string, unknown> = { matchId: data.matchId, inningsNumber: data.inningsNumber };
  if (data.teamId != null) vals.teamId = data.teamId;
  const result = await db.insert(inningsTable).values(vals as InsertInnings);
  return result[0].insertId;
}

export async function getInningsByMatch(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inningsTable).where(eq(inningsTable.matchId, matchId)).orderBy(asc(inningsTable.inningsNumber));
}

export async function updateInnings(inningsId: number, data: Partial<{
  totalRuns: number; totalWickets: number; totalOvers: number; totalBalls: number; status: string;
}>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(inningsTable).set(data as any).where(eq(inningsTable.id, inningsId));
}

// ===================================================================
// BALLS (Deliveries)
// ===================================================================

export async function createBall(data: {
  inningsId: number; overNumber: number; ballNumber: number;
  batsmanId?: number | null; bowlerId?: number | null;
  runs: number; extras?: number; extraType?: string | null;
  isWicket?: number; dismissalType?: string | null; fielderId?: number | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const vals: Record<string, unknown> = {
    inningsId: data.inningsId, overNumber: data.overNumber, ballNumber: data.ballNumber,
    runs: data.runs, extras: data.extras ?? 0, isWicket: data.isWicket ?? 0,
  };
  if (data.batsmanId != null) vals.batsmanId = data.batsmanId;
  if (data.bowlerId != null) vals.bowlerId = data.bowlerId;
  if (data.extraType) vals.extraType = data.extraType;
  if (data.dismissalType) vals.dismissalType = data.dismissalType;
  if (data.fielderId != null) vals.fielderId = data.fielderId;
  const result = await db.insert(balls).values(vals as InsertBall);
  return result[0].insertId;
}

export async function getBallsByInnings(inningsId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(balls).where(eq(balls.inningsId, inningsId)).orderBy(asc(balls.overNumber), asc(balls.ballNumber));
}

// ===================================================================
// BATSMAN SCORES
// ===================================================================

export async function upsertBatsmanScore(data: {
  inningsId: number; playerId: number;
  runs?: number; balls?: number; fours?: number; sixes?: number;
  dismissalType?: string | null; fielderId?: number | null; status?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(batsmanScores)
    .where(and(eq(batsmanScores.inningsId, data.inningsId), eq(batsmanScores.playerId, data.playerId))).limit(1);
  if (existing.length > 0) {
    await db.update(batsmanScores).set(data as any).where(eq(batsmanScores.id, existing[0]!.id));
  } else {
    await db.insert(batsmanScores).values(data as InsertBatsmanScore);
  }
}

export async function getBatsmanScoresByInnings(inningsId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batsmanScores).where(eq(batsmanScores.inningsId, inningsId));
}

// ===================================================================
// BOWLER STATS
// ===================================================================

export async function upsertBowlerStat(data: {
  inningsId: number; playerId: number;
  overs?: number; balls?: number; runs?: number;
  wickets?: number; maidens?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(bowlerStats)
    .where(and(eq(bowlerStats.inningsId, data.inningsId), eq(bowlerStats.playerId, data.playerId))).limit(1);
  if (existing.length > 0) {
    await db.update(bowlerStats).set(data as any).where(eq(bowlerStats.id, existing[0]!.id));
  } else {
    await db.insert(bowlerStats).values(data as InsertBowlerStat);
  }
}

export async function getBowlerStatsByInnings(inningsId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bowlerStats).where(eq(bowlerStats.inningsId, inningsId));
}

// ===================================================================
// PLAYER CAREER STATS
// ===================================================================

export async function getCareerStatsByPlayerId(playerId: number, format?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(playerCareerStats.playerId, playerId)];
  if (format) conditions.push(eq(playerCareerStats.format, format));
  return db.select().from(playerCareerStats).where(and(...conditions));
}

export async function upsertCareerStats(data: {
  playerId: number; format: string;
  matchesPlayed?: number; innings?: number; runsScored?: number;
  highestScore?: number; average?: number; strikeRate?: number;
  centuries?: number; fifties?: number; fours?: number; sixes?: number;
  ballsBowled?: number; runsConceded?: number; wicketsTaken?: number;
  economyRate?: number; bestFigures?: string | null;
  catches?: number; stumpings?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(playerCareerStats)
    .where(and(eq(playerCareerStats.playerId, data.playerId), eq(playerCareerStats.format, data.format))).limit(1);
  if (existing.length > 0) {
    await db.update(playerCareerStats).set(data as any).where(eq(playerCareerStats.id, existing[0]!.id));
  } else {
    await db.insert(playerCareerStats).values(data as InsertPlayerCareerStat);
  }
}

export async function updatePlayerCareerStatsAfterMatch(
  playerId: number, matchFormat: string,
  runsScored: number, ballsFaced: number, fours: number, sixes: number,
  isOut: boolean, wicketsTaken: number, runsConceded: number, ballsBowled: number,
  catches: number, stumpings: number,
): Promise<void> {
  const existing = await getCareerStatsByPlayerId(playerId, matchFormat);
  if (existing.length > 0) {
    const s = existing[0];
    const newRuns = (s.runsScored ?? 0) + runsScored;
    const newInnings = (s.innings ?? 0) + (ballsFaced > 0 ? 1 : 0);
    const newOuts = (s.innings ?? 0) + (isOut ? 1 : 0) - (isOut ? 0 : 1);
    await upsertCareerStats({
      playerId, format: matchFormat,
      matchesPlayed: (s.matchesPlayed ?? 0) + 1,
      innings: newInnings,
      runsScored: newRuns,
      highestScore: Math.max(s.highestScore ?? 0, runsScored),
      average: newOuts > 0 ? Math.round((newRuns / newOuts) * 100) : (s.average ?? 0),
      strikeRate: ballsFaced > 0 ? Math.round((runsScored / ballsFaced) * 10000) : (s.strikeRate ?? 0),
      centuries: (s.centuries ?? 0) + (runsScored >= 100 ? 1 : 0),
      fifties: (s.fifties ?? 0) + (runsScored >= 50 && runsScored < 100 ? 1 : 0),
      fours: (s.fours ?? 0) + fours, sixes: (s.sixes ?? 0) + sixes,
      ballsBowled: (s.ballsBowled ?? 0) + ballsBowled,
      runsConceded: (s.runsConceded ?? 0) + runsConceded,
      wicketsTaken: (s.wicketsTaken ?? 0) + wicketsTaken,
      economyRate: ballsBowled > 0 ? Math.round((runsConceded / ballsBowled) * 600) : (s.economyRate ?? 0),
      catches: (s.catches ?? 0) + catches, stumpings: (s.stumpings ?? 0) + stumpings,
    });
  } else {
    await upsertCareerStats({
      playerId, format: matchFormat,
      matchesPlayed: 1, innings: ballsFaced > 0 ? 1 : 0,
      runsScored, highestScore: runsScored,
      average: isOut ? Math.round((runsScored / 1) * 100) : runsScored * 100,
      strikeRate: ballsFaced > 0 ? Math.round((runsScored / ballsFaced) * 10000) : 0,
      centuries: runsScored >= 100 ? 1 : 0, fifties: runsScored >= 50 && runsScored < 100 ? 1 : 0,
      fours, sixes,
      ballsBowled, runsConceded, wicketsTaken,
      economyRate: ballsBowled > 0 ? Math.round((runsConceded / ballsBowled) * 600) : 0,
      catches, stumpings,
    });
  }
}

// ===================================================================
// EXTENDED ENHANCEMENTS: LIVE MATCHES, TOP PERFORMERS, LEAGUE FIXTURES
// ===================================================================

export async function listLiveMatches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).where(eq(matches.status, "live")).orderBy(desc(matches.updatedAt));
}

export async function getMatchSummary(matchId: number) {
  const match = await getMatchById(matchId);
  if (!match) return null;
  const inningsList = await getInningsByMatch(matchId);
  const inningsWithDetails = await Promise.all(
    inningsList.map(async (inn) => {
      const batsmen = await getBatsmanScoresByInnings(inn.id);
      const bowlers = await getBowlerStatsByInnings(inn.id);
      const recentBalls = await getBallsByInnings(inn.id);
      return {
        ...inn,
        batsmen,
        bowlers,
        balls: recentBalls.slice(-24),
      };
    })
  );
  return { match, innings: inningsWithDetails };
}

export async function getTopPerformers(limit = 10) {
  const db = await getDb();
  if (!db) return { topBatsmen: [], topBowlers: [] };
  const topBatsmen = await db.select().from(playerCareerStats).orderBy(desc(playerCareerStats.runsScored)).limit(limit);
  const topBowlers = await db.select().from(playerCareerStats).orderBy(desc(playerCareerStats.wicketsTaken)).limit(limit);
  return { topBatsmen, topBowlers };
}

export async function getAllPlayers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).limit(limit).offset(offset);
}

export async function getLeagueFixtures(leagueId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).where(eq(matches.leagueId, leagueId)).orderBy(asc(matches.createdAt));
}

export async function getLeagueTeamsList(leagueId: number) {
  const db = await getDb();
  if (!db) return [];
  const lt = await db.select().from(leagueTeams).where(eq(leagueTeams.leagueId, leagueId));
  const teamList = await Promise.all(
    lt.map(async (item) => {
      if (item.teamId) return getTeamById(item.teamId);
      return null;
    })
  );
  return teamList.filter(Boolean);
}

export async function recalculateLeagueStandings(leagueId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const leagueMatches = await getLeagueFixtures(leagueId);
  const completedMatches = leagueMatches.filter((m) => m.status === "completed");

  const standingsMap = new Map<number, {
    played: number; won: number; lost: number; tied: number;
    points: number; runsFor: number; oversFor: number;
    runsAgainst: number; oversAgainst: number;
  }>();

  const getOrCreate = (tid: number) => {
    if (!standingsMap.has(tid)) {
      standingsMap.set(tid, { played: 0, won: 0, lost: 0, tied: 0, points: 0, runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0 });
    }
    return standingsMap.get(tid)!;
  };

  for (const m of completedMatches) {
    if (!m.team1Id || !m.team2Id) continue;
    const s1 = getOrCreate(m.team1Id);
    const s2 = getOrCreate(m.team2Id);
    s1.played += 1;
    s2.played += 1;

    const inn = await getInningsByMatch(m.id);
    const inn1 = inn.find((i) => i.teamId === m.team1Id) || inn[0];
    const inn2 = inn.find((i) => i.teamId === m.team2Id) || inn[1];

    const r1 = inn1?.totalRuns ?? 0;
    const r2 = inn2?.totalRuns ?? 0;
    const o1 = (inn1?.totalOvers ?? 0) + (inn1?.totalBalls ?? 0) / 6;
    const o2 = (inn2?.totalOvers ?? 0) + (inn2?.totalBalls ?? 0) / 6;

    s1.runsFor += r1; s1.oversFor += o1;
    s1.runsAgainst += r2; s1.oversAgainst += o2;

    s2.runsFor += r2; s2.oversFor += o2;
    s2.runsAgainst += r1; s2.oversAgainst += o1;

    if (r1 > r2) {
      s1.won += 1; s1.points += 2;
      s2.lost += 1;
    } else if (r2 > r1) {
      s2.won += 1; s2.points += 2;
      s1.lost += 1;
    } else {
      s1.tied += 1; s1.points += 1;
      s2.tied += 1; s2.points += 1;
    }
  }

  for (const [teamId, s] of standingsMap.entries()) {
    const rrFor = s.oversFor > 0 ? s.runsFor / s.oversFor : 0;
    const rrAgainst = s.oversAgainst > 0 ? s.runsAgainst / s.oversAgainst : 0;
    const nrr = Math.round((rrFor - rrAgainst) * 100);

    await updateLeagueStanding(leagueId, teamId, {
      played: s.played,
      won: s.won,
      lost: s.lost,
      tied: s.tied,
      points: s.points,
      nrr,
      runsFor: s.runsFor,
      runsAgainst: s.runsAgainst,
    });
  }
}

