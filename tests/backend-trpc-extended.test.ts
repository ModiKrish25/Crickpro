import { describe, it, expect } from "vitest";
import { appRouter } from "../server/routes/routers";

describe("Extended tRPC Router & Database Helpers", () => {
  it("should define appRouter with extended procedures", () => {
    expect(appRouter).toBeDefined();
    expect(appRouter.match).toBeDefined();
    expect(appRouter.match.getLiveMatches).toBeDefined();
    expect(appRouter.match.getSummary).toBeDefined();
    expect(appRouter.leagues.getFixtures).toBeDefined();
    expect(appRouter.leagues.getTeams).toBeDefined();
    expect(appRouter.leagues.recalculateStandings).toBeDefined();
    expect(appRouter.players.getTopPerformers).toBeDefined();
    expect(appRouter.players.getAll).toBeDefined();
  });

  it("should have correct router structure for match endpoints", () => {
    const matchRouter = appRouter.match;
    expect(typeof matchRouter.create).toBe("function");
    expect(typeof matchRouter.getById).toBe("function");
    expect(typeof matchRouter.list).toBe("function");
    expect(typeof matchRouter.getLiveMatches).toBe("function");
    expect(typeof matchRouter.getSummary).toBe("function");
  });

  it("should have correct router structure for leagues endpoints", () => {
    const leaguesRouter = appRouter.leagues;
    expect(typeof leaguesRouter.create).toBe("function");
    expect(typeof leaguesRouter.getById).toBe("function");
    expect(typeof leaguesRouter.list).toBe("function");
    expect(typeof leaguesRouter.getFixtures).toBe("function");
    expect(typeof leaguesRouter.getTeams).toBe("function");
    expect(typeof leaguesRouter.recalculateStandings).toBe("function");
  });

  it("should have correct router structure for players endpoints", () => {
    const playersRouter = appRouter.players;
    expect(typeof playersRouter.getProfile).toBe("function");
    expect(typeof playersRouter.updateProfile).toBe("function");
    expect(typeof playersRouter.getCareerStats).toBe("function");
    expect(typeof playersRouter.getTopPerformers).toBe("function");
    expect(typeof playersRouter.getAll).toBe("function");
  });
});
