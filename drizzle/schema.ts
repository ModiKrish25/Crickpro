import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Phone number in E.164 format (e.g., +14155550123) for phone OTP auth */
  phone: varchar("phone", { length: 20 }),
  /** Whether the phone number has been verified via OTP */
  phoneVerified: int("phoneVerified").default(0),
  /** Bcrypt/SHA-256 hashed password for local email/password auth (null for OAuth/phone users) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Players
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  role: varchar("role", { length: 50 }).default("batsman"), // batsman, bowler, all-rounder, wicket-keeper
  battingStyle: varchar("battingStyle", { length: 50 }), // right-handed, left-handed
  bowlingStyle: varchar("bowlingStyle", { length: 50 }), // right-arm-fast, etc.
  city: varchar("city", { length: 100 }),
  jerseyNumber: int("jerseyNumber"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Teams
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  homeGround: varchar("homeGround", { length: 255 }),
  teamColor: varchar("teamColor", { length: 7 }).default("#0a7ea4"),
  captainId: int("captainId").references(() => players.id),
  viceCaptainId: int("viceCaptainId").references(() => players.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Team Members
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").references(() => teams.id),
  playerId: int("playerId").references(() => players.id),
  role: varchar("role", { length: 50 }).default("player"), // captain, vice-captain, player
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// Leagues and Tournaments
export const leagues = mysqlTable("leagues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  format: varchar("format", { length: 50 }).default("round-robin"), // round-robin, knockout, league
  matchFormat: varchar("matchFormat", { length: 50 }).default("T20"), // T20, ODI, T10, custom
  numberOfTeams: int("numberOfTeams"),
  organizerId: int("organizerId").references(() => users.id),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// League Teams
export const leagueTeams = mysqlTable("leagueTeams", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId").references(() => leagues.id),
  teamId: int("teamId").references(() => teams.id),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// League Standings
export const leagueStandings = mysqlTable("leagueStandings", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId").references(() => leagues.id),
  teamId: int("teamId").references(() => teams.id),
  played: int("played").default(0),
  won: int("won").default(0),
  lost: int("lost").default(0),
  tied: int("tied").default(0),
  points: int("points").default(0),
  nrr: int("nrr").default(0), // Net Run Rate (stored as integer, divide by 100 for display)
  runsFor: int("runsFor").default(0),
  runsAgainst: int("runsAgainst").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Matches
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId").references(() => leagues.id),
  team1Id: int("team1Id").references(() => teams.id),
  team2Id: int("team2Id").references(() => teams.id),
  format: varchar("format", { length: 50 }).default("T20"),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, live, completed, cancelled
  venue: varchar("venue", { length: 255 }),
  umpireId: int("umpireId").references(() => users.id),
  scorerId: int("scorerId").references(() => users.id),
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Innings
export const innings = mysqlTable("innings", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id),
  teamId: int("teamId").references(() => teams.id),
  inningsNumber: int("inningsNumber"),
  totalRuns: int("totalRuns").default(0),
  totalWickets: int("totalWickets").default(0),
  totalOvers: int("totalOvers").default(0),
  totalBalls: int("totalBalls").default(0),
  status: varchar("status", { length: 50 }).default("in-progress"), // in-progress, completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Balls
export const balls = mysqlTable("balls", {
  id: int("id").autoincrement().primaryKey(),
  inningsId: int("inningsId").references(() => innings.id),
  overNumber: int("overNumber"),
  ballNumber: int("ballNumber"),
  batsmanId: int("batsmanId").references(() => players.id),
  bowlerId: int("bowlerId").references(() => players.id),
  runs: int("runs").default(0),
  extras: int("extras").default(0),
  extraType: varchar("extraType", { length: 50 }), // wide, no-ball, bye, leg-bye
  isWicket: int("isWicket").default(0), // 0 or 1
  dismissalType: varchar("dismissalType", { length: 50 }), // bowled, caught, lbw, etc.
  fielderId: int("fielderId").references(() => players.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Batsman Scores
export const batsmanScores = mysqlTable("batsmanScores", {
  id: int("id").autoincrement().primaryKey(),
  inningsId: int("inningsId").references(() => innings.id),
  playerId: int("playerId").references(() => players.id),
  runs: int("runs").default(0),
  balls: int("balls").default(0),
  fours: int("fours").default(0),
  sixes: int("sixes").default(0),
  dismissalType: varchar("dismissalType", { length: 50 }),
  fielderId: int("fielderId").references(() => players.id),
  status: varchar("status", { length: 50 }).default("batting"), // batting, out, dnb
});

// Bowler Stats
export const bowlerStats = mysqlTable("bowlerStats", {
  id: int("id").autoincrement().primaryKey(),
  inningsId: int("inningsId").references(() => innings.id),
  playerId: int("playerId").references(() => players.id),
  overs: int("overs").default(0),
  balls: int("balls").default(0),
  runs: int("runs").default(0),
  wickets: int("wickets").default(0),
  maidens: int("maidens").default(0),
});

// Player Career Stats
export const playerCareerStats = mysqlTable("playerCareerStats", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id),
  format: varchar("format", { length: 50 }).default("T20"),
  matchesPlayed: int("matchesPlayed").default(0),
  innings: int("innings").default(0),
  runsScored: int("runsScored").default(0),
  highestScore: int("highestScore").default(0),
  average: int("average").default(0), // Stored as integer, divide by 100 for display
  strikeRate: int("strikeRate").default(0), // Stored as integer, divide by 100 for display
  centuries: int("centuries").default(0),
  fifties: int("fifties").default(0),
  fours: int("fours").default(0),
  sixes: int("sixes").default(0),
  ballsBowled: int("ballsBowled").default(0),
  runsConceded: int("runsConceded").default(0),
  wicketsTaken: int("wicketsTaken").default(0),
  economyRate: int("economyRate").default(0), // Stored as integer, divide by 100 for display
  bestFigures: varchar("bestFigures", { length: 50 }),
  catches: int("catches").default(0),
  stumpings: int("stumpings").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Type exports
export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type League = typeof leagues.$inferSelect;
export type InsertLeague = typeof leagues.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
export type Innings = typeof innings.$inferSelect;
export type InsertInnings = typeof innings.$inferInsert;
export type Ball = typeof balls.$inferSelect;
export type InsertBall = typeof balls.$inferInsert;
export type BatsmanScore = typeof batsmanScores.$inferSelect;
export type InsertBatsmanScore = typeof batsmanScores.$inferInsert;
export type BowlerStat = typeof bowlerStats.$inferSelect;
export type InsertBowlerStat = typeof bowlerStats.$inferInsert;
export type PlayerCareerStat = typeof playerCareerStats.$inferSelect;
export type InsertPlayerCareerStat = typeof playerCareerStats.$inferInsert;
