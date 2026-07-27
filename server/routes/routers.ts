import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "../core/cookies";
import { systemRouter } from "./systemRouter";
import { publicProcedure, protectedProcedure, router } from "../core/trpc";
import * as db from "../db/db";
import {
  MatchFormat,
  assertValidMatchInput,
} from "../../lib/cricket/advanced-rules-engine";
import { wsManager } from "../core/websocket";

export const appRouter = router({
  system: systemRouter,

  // ===================================================================
  // AUTH
  // ===================================================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===================================================================
  // MATCHES
  // ===================================================================
  match: router({
    create: protectedProcedure
      .input(
        z.object({
          format: z.nativeEnum(MatchFormat),
          team1: z.string().min(1, "Team 1 is required"),
          team2: z.string().min(1, "Team 2 is required"),
          customOvers: z.number().int().nonnegative().optional(),
          customBallsPerOver: z.number().int().positive().optional(),
          playersPerSide: z.number().int().positive().optional(),
          customInningsCount: z.number().int().positive().optional(),
          venue: z.string().max(100).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Step 1: Run engine-level match creation validation
        try {
          assertValidMatchInput({
            format: input.format,
            team1: input.team1,
            team2: input.team2,
            customOvers: input.customOvers,
            customBallsPerOver: input.customBallsPerOver,
            playersPerSide: input.playersPerSide,
            customInningsCount: input.customInningsCount,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid match input";
          throw new TRPCError({ code: "BAD_REQUEST", message: `Validation failed: ${message}` });
        }

        // Step 2: Persist to database
        const matchId = await db.createMatch({
          team1Name: input.team1,
          team2Name: input.team2,
          format: input.format,
          venue: input.venue ?? null,
          scorerId: ctx.user.id,
        });

        return { success: true, matchId: String(matchId), message: `Match ${input.team1} vs ${input.team2} created` };
      }),

    getById: protectedProcedure
      .input(z.object({ matchId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const match = await db.getMatchById(input.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
        const innings = await db.getInningsByMatch(input.matchId);
        return { match, innings };
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().int().default(50), offset: z.number().int().default(0) }))
      .query(async ({ input }) => {
        return db.listMatches(input.limit, input.offset);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        matchId: z.number().int().positive(),
        status: z.enum(["scheduled", "live", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateMatchStatus(input.matchId, input.status);
        return { success: true };
      }),

    getLiveMatches: publicProcedure.query(async () => {
      return db.listLiveMatches();
    }),

    getSummary: publicProcedure
      .input(z.object({ matchId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const summary = await db.getMatchSummary(input.matchId);
        if (!summary) throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
        return summary;
      }),
  }),

  // ===================================================================
  // TEAMS
  // ===================================================================
  teams: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        logoUrl: z.string().optional(),
        homeGround: z.string().max(255).optional(),
        teamColor: z.string().max(7).optional(),
      }))
      .mutation(async ({ input }) => {
        const teamId = await db.createTeam(input);
        return { success: true, teamId: String(teamId) };
      }),

    getById: publicProcedure
      .input(z.object({ teamId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const team = await db.getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        return team;
      }),

    list: publicProcedure
      .input(z.object({ limit: z.number().int().default(50), offset: z.number().int().default(0) }))
      .query(async ({ input }) => {
        return db.listTeams(input.limit, input.offset);
      }),
  }),

  // ===================================================================
  // LEAGUES
  // ===================================================================
  leagues: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        format: z.enum(["round-robin", "knockout", "league"]).optional(),
        matchFormat: z.string().max(50).optional(),
        numberOfTeams: z.number().int().positive().optional(),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const leagueId = await db.createLeague({
          ...input, organizerId: ctx.user.id,
        });
        return { success: true, leagueId: String(leagueId) };
      }),

    getById: publicProcedure
      .input(z.object({ leagueId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const league = await db.getLeagueById(input.leagueId);
        if (!league) throw new TRPCError({ code: "NOT_FOUND", message: "League not found" });
        const standings = await db.getLeagueStandings(input.leagueId);
        return { league, standings };
      }),

    list: publicProcedure
      .input(z.object({ limit: z.number().int().default(50), offset: z.number().int().default(0) }))
      .query(async ({ input }) => {
        return db.listLeagues(input.limit, input.offset);
      }),

    getFixtures: publicProcedure
      .input(z.object({ leagueId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getLeagueFixtures(input.leagueId);
      }),

    getTeams: publicProcedure
      .input(z.object({ leagueId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getLeagueTeamsList(input.leagueId);
      }),

    addTeam: protectedProcedure
      .input(z.object({ leagueId: z.number().int().positive(), teamId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.addTeamToLeague(input.leagueId, input.teamId);
        return { success: true };
      }),

    updateStanding: protectedProcedure
      .input(z.object({
        leagueId: z.number().int().positive(),
        teamId: z.number().int().positive(),
        played: z.number().int().optional(),
        won: z.number().int().optional(),
        lost: z.number().int().optional(),
        tied: z.number().int().optional(),
        points: z.number().int().optional(),
        nrr: z.number().int().optional(),
        runsFor: z.number().int().optional(),
        runsAgainst: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        const { leagueId, teamId, ...data } = input;
        await db.updateLeagueStanding(leagueId, teamId, data);
        return { success: true };
      }),

    recalculateStandings: protectedProcedure
      .input(z.object({ leagueId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.recalculateLeagueStandings(input.leagueId);
        return { success: true };
      }),
  }),

  // ===================================================================
  // PLAYERS (Profile + Career Stats)
  // ===================================================================
  players: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const player = await db.getPlayerByUserId(ctx.user.id);
      return {
        name: ctx.user.name,
        role: player?.role ?? null,
        jerseyNumber: player?.jerseyNumber ?? null,
        battingStyle: player?.battingStyle ?? null,
        bowlingStyle: player?.bowlingStyle ?? null,
        city: player?.city ?? null,
        bio: player?.bio ?? null,
        playerId: player?.id ?? null,
      };
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(50).optional(),
          role: z.enum(["batsman", "bowler", "all-rounder", "wicket-keeper"]).optional(),
          jerseyNumber: z.number().int().positive().max(999).optional(),
          battingStyle: z.enum(["right-handed", "left-handed"]).optional(),
          bowlingStyle: z.string().min(1).max(50).optional(),
          city: z.string().min(1).max(100).optional(),
          bio: z.string().min(1).max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { user } = ctx;
        if (input.name) await db.updateUserName(user.openId, input.name);
        const hasPlayerFields = input.role !== undefined || input.jerseyNumber !== undefined ||
          input.battingStyle !== undefined || input.bowlingStyle !== undefined ||
          input.city !== undefined || input.bio !== undefined;
        if (hasPlayerFields) {
          await db.upsertPlayerProfile(user.id, {
            role: input.role ?? null, jerseyNumber: input.jerseyNumber ?? null,
            battingStyle: input.battingStyle ?? null, bowlingStyle: input.bowlingStyle ?? null,
            city: input.city ?? null, bio: input.bio ?? null,
          });
        }
        return { success: true };
      }),

    getCareerStats: protectedProcedure
      .input(z.object({
        playerId: z.number().int().positive(),
        format: z.string().max(50).optional(),
      }))
      .query(async ({ input }) => {
        return db.getCareerStatsByPlayerId(input.playerId, input.format);
      }),

    getTopPerformers: publicProcedure
      .input(z.object({ limit: z.number().int().default(10) }))
      .query(async ({ input }) => {
        return db.getTopPerformers(input.limit);
      }),

    getAll: publicProcedure
      .input(z.object({ limit: z.number().int().default(50), offset: z.number().int().default(0) }))
      .query(async ({ input }) => {
        return db.getAllPlayers(input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ playerId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });
        return player;
      }),
  }),


  // ===================================================================
  // SCORING (Innings + Balls + Player Scores — for live scoring)
  // ===================================================================
  scoring: router({
    createInnings: protectedProcedure
      .input(z.object({
        matchId: z.number().int().positive(),
        inningsNumber: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        const inningsId = await db.createInnings(input);
        return { success: true, inningsId: String(inningsId) };
      }),

    getInnings: protectedProcedure
      .input(z.object({ matchId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getInningsByMatch(input.matchId);
      }),

    updateInnings: protectedProcedure
      .input(z.object({
        inningsId: z.number().int().positive(),
        totalRuns: z.number().int().optional(),
        totalWickets: z.number().int().optional(),
        totalOvers: z.number().int().optional(),
        totalBalls: z.number().int().optional(),
        status: z.enum(["in-progress", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { inningsId, ...data } = input;
        await db.updateInnings(inningsId, data);
        return { success: true };
      }),

    recordBall: protectedProcedure
      .input(z.object({
        matchId: z.string().optional(), // DB match ID for WebSocket broadcast room
        inningsId: z.number().int().positive(),
        overNumber: z.number().int().nonnegative(),
        ballNumber: z.number().int().positive(),
        batsmanId: z.number().int().positive().optional(),
        bowlerId: z.number().int().positive().optional(),
        runs: z.number().int().nonnegative(),
        extras: z.number().int().default(0),
        extraType: z.string().max(50).optional(),
        isWicket: z.number().int().default(0),
        dismissalType: z.string().max(50).optional(),
        fielderId: z.number().int().positive().optional(),
      }))
      .mutation(async ({ input }) => {
        const ballId = await db.createBall(input);

        // Broadcast delivery to all WebSocket watchers of this match
        if (input.matchId) {
          try {
            wsManager.broadcast(input.matchId, {
              type: "match_update",
              matchId: input.matchId,
              state: {
                inningsId: input.inningsId,
                runs: input.runs,
                extras: input.extras,
                isWicket: input.isWicket,
                overNumber: input.overNumber,
                ballNumber: input.ballNumber,
              },
              summary: input.isWicket
                ? "WICKET!"
                : `${input.runs} run${input.runs !== 1 ? "s" : ""}${input.extras > 0 ? ` (+${input.extras} extras)` : ""}`,
              timestamp: Date.now(),
            });
          } catch (e) {
            // Broadcast failure is non-critical
            console.warn("[Scoring] Failed to broadcast delivery:", e);
          }
        }

        return { success: true, ballId: String(ballId) };
      }),

    getBalls: protectedProcedure
      .input(z.object({ inningsId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getBallsByInnings(input.inningsId);
      }),

    upsertBatsmanScore: protectedProcedure
      .input(z.object({
        inningsId: z.number().int().positive(),
        playerId: z.number().int().positive(),
        runs: z.number().int().optional(),
        balls: z.number().int().optional(),
        fours: z.number().int().optional(),
        sixes: z.number().int().optional(),
        dismissalType: z.string().max(50).optional(),
        status: z.string().max(50).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertBatsmanScore(input);
        return { success: true };
      }),

    getBatsmanScores: protectedProcedure
      .input(z.object({ inningsId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getBatsmanScoresByInnings(input.inningsId);
      }),

    upsertBowlerStat: protectedProcedure
      .input(z.object({
        inningsId: z.number().int().positive(),
        playerId: z.number().int().positive(),
        overs: z.number().int().optional(),
        balls: z.number().int().optional(),
        runs: z.number().int().optional(),
        wickets: z.number().int().optional(),
        maidens: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertBowlerStat(input);
        return { success: true };
      }),

    getBowlerStats: protectedProcedure
      .input(z.object({ inningsId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getBowlerStatsByInnings(input.inningsId);
      }),

    updateCareerStats: protectedProcedure
      .input(z.object({
        playerId: z.number().int().positive(),
        matchFormat: z.string().max(50),
        runsScored: z.number().int().default(0),
        ballsFaced: z.number().int().default(0),
        fours: z.number().int().default(0),
        sixes: z.number().int().default(0),
        isOut: z.boolean().default(false),
        wicketsTaken: z.number().int().default(0),
        runsConceded: z.number().int().default(0),
        ballsBowled: z.number().int().default(0),
        catches: z.number().int().default(0),
        stumpings: z.number().int().default(0),
      }))
      .mutation(async ({ input }) => {
        await db.updatePlayerCareerStatsAfterMatch(
          input.playerId, input.matchFormat,
          input.runsScored, input.ballsFaced, input.fours, input.sixes,
          input.isOut, input.wicketsTaken, input.runsConceded, input.ballsBowled,
          input.catches, input.stumpings,
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
