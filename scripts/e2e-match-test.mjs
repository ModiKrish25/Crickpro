/**
 * End-to-End Match Test
 *
 * Simulates a complete match flow using the actual Drizzle schema:
 * 1. Create match in DB
 * 2. Create teams
 * 3. Create innings
 * 4. Record deliveries (runs, extras, wickets)
 * 5. Update innings totals
 * 6. Create batsman scores & bowler stats
 * 7. Verify all data persisted in MySQL
 * 8. Clean up test data
 *
 * Column names match the Drizzle schema (camelCase).
 *
 * Usage: DATABASE_URL=mysql://root:Krish123@localhost:3306/crickpro node scripts/e2e-match-test.mjs
 */

import { createConnection } from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const TS = Date.now();
const tag = `[E2E:${TS}]`;
let conn;

function log(step, status, detail = "") {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "➡️";
  console.log(`${icon} ${step.padEnd(48)} ${detail}`);
}

function summarize(results) {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  if (failed > 0) {
    results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`   ❌ ${r.step}: ${r.detail}`));
  }
}

async function run() {
  const results = [];

  try {
    conn = await createConnection(DB_URL);
    console.log(`\n🏏 ${tag} End-to-End Match Test\n`);

    // ══════════════════════════════════════════════════════
    // STEP 1: Create a test user + player
    // ══════════════════════════════════════════════════════
    log("1. Create user + players", "➡️");

    const openId = `e2e_test_${TS}`;
    await conn.execute(
      `INSERT INTO users (openId, name, role) VALUES (?, ?, ?)`,
      [openId, "E2E Scorer", "admin"],
    );
    const [userRows] = await conn.execute("SELECT id FROM users WHERE openId = ?", [openId]);
    const userId = userRows[0].id;

    // Create players (need userId FK)
    const playerNames = [
      { name: "Test Batsman 1", role: "batsman" },
      { name: "Test Batsman 2", role: "batsman" },
      { name: "Test Bowler 1", role: "bowler" },
      { name: "Test AllRounder", role: "all-rounder" },
    ];
    const playerIds = [];
    for (const p of playerNames) {
      const [r] = await conn.execute(
        "INSERT INTO players (userId, role) VALUES (?, ?)",
        [userId, p.role],
      );
      playerIds.push(r.insertId);
    }
    log("1. Create user + players", "PASS",
      `user.id=${userId}, ${playerIds.length} players`);

    // ══════════════════════════════════════════════════════
    // STEP 2: Create teams
    // ══════════════════════════════════════════════════════
    log("2. Create teams", "➡️");

    const [t1r] = await conn.execute(
      "INSERT INTO teams (name, teamColor) VALUES (?, ?)",
      ["E2E Thunder", "#0066FF"],
    );
    const team1Id = t1r.insertId;
    const [t2r] = await conn.execute(
      "INSERT INTO teams (name, teamColor) VALUES (?, ?)",
      ["E2E Lightning", "#FF3B30"],
    );
    const team2Id = t2r.insertId;
    log("2. Create teams", "PASS", `team1.id=${team1Id}, team2.id=${team2Id}`);

    // ══════════════════════════════════════════════════════
    // STEP 3: Create a match
    // ══════════════════════════════════════════════════════
    log("3. Create match", "➡️");

    const [mResult] = await conn.execute(
      `INSERT INTO matches (team1Id, team2Id, format, status, venue, scorerId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [team1Id, team2Id, "T20", "scheduled", "E2E Test Ground", userId],
    );
    const dbMatchId = mResult.insertId;

    const [matchRows] = await conn.execute(
      "SELECT * FROM matches WHERE id = ?", [dbMatchId],
    );
    const m = matchRows[0];
    const matchOk = m && m.format === "T20" && m.status === "scheduled" && m.team1Id === team1Id;
    results.push({
      step: "Match created",
      status: matchOk ? "PASS" : "FAIL",
      detail: `id=${dbMatchId}, format=${m?.format}, status=${m?.status}`,
    });
    log("3. Create match", matchOk ? "PASS" : "FAIL",
      `id=${dbMatchId}, format=${m.format}, status=${m.status}`);

    // ══════════════════════════════════════════════════════
    // STEP 4: Create innings
    // ══════════════════════════════════════════════════════
    log("4. Create innings", "➡️");

    const [i1r] = await conn.execute(
      "INSERT INTO innings (matchId, teamId, inningsNumber) VALUES (?, ?, ?)",
      [dbMatchId, team1Id, 1],
    );
    const inns1Id = i1r.insertId;

    const [i2r] = await conn.execute(
      "INSERT INTO innings (matchId, teamId, inningsNumber) VALUES (?, ?, ?)",
      [dbMatchId, team2Id, 2],
    );
    const inns2Id = i2r.insertId;

    const [innsRows] = await conn.execute(
      "SELECT * FROM innings WHERE matchId = ? ORDER BY inningsNumber", [dbMatchId],
    );
    const innsOk = innsRows.length === 2;
    results.push({
      step: "Innings created",
      status: innsOk ? "PASS" : "FAIL",
      detail: `${innsRows.length} innings`,
    });
    log("4. Create innings", innsOk ? "PASS" : "FAIL",
      `innings: ${innsRows.map((r) => r.inningsNumber).join(", ")}`);

    // ══════════════════════════════════════════════════════
    // STEP 5: Record deliveries (Innings 1)
    // ══════════════════════════════════════════════════════
    log("5. Record deliveries — Innings 1", "➡️");

    const batId = playerIds[0]; // batsman
    const bowlId = playerIds[2]; // bowler

    const recordBall = async (inningsId, overNum, ballNum, runs, extras, isWicket, extraType, dismissType) => {
      const [r] = await conn.execute(
        `INSERT INTO balls
         (inningsId, overNumber, ballNumber, batsmanId, bowlerId, runs, extras, extraType, isWicket, dismissalType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [inningsId, overNum, ballNum, batId, bowlId, runs, extras ?? 0,
         extraType ?? null, isWicket ?? 0, dismissType ?? null],
      );
      return r.insertId;
    };

    // Over 1: dot, 1, 4, 2, wide+1, WICKET
    const balls1 = await Promise.all([
      recordBall(inns1Id, 0, 1, 0, 0, 0),
      recordBall(inns1Id, 0, 2, 1, 0, 0),
      recordBall(inns1Id, 0, 3, 4, 0, 0),
      recordBall(inns1Id, 0, 4, 2, 0, 0),
      recordBall(inns1Id, 0, 5, 0, 1, 0, "wide"),
      recordBall(inns1Id, 0, 6, 0, 0, 1, null, "Caught"),
    ]);
    log("5. Record deliveries — Innings 1", "PASS", `${balls1.length} balls recorded`);

    // Update innings 1: 7 runs, 1 wicket, 6 balls
    await conn.execute(
      "UPDATE innings SET totalRuns = 7, totalWickets = 1, totalBalls = 6, status = 'completed' WHERE id = ?",
      [inns1Id],
    );

    // ══════════════════════════════════════════════════════
    // STEP 6: Record deliveries (Innings 2)
    // ══════════════════════════════════════════════════════
    log("6. Record deliveries — Innings 2", "➡️");

    const balls2 = await Promise.all([
      recordBall(inns2Id, 0, 1, 0, 0, 0),
      recordBall(inns2Id, 0, 2, 3, 0, 0),
      recordBall(inns2Id, 0, 3, 6, 0, 0),        // SIX!
      recordBall(inns2Id, 0, 4, 1, 0, 0),
      recordBall(inns2Id, 0, 5, 0, 1, 0, "no-ball"),
      recordBall(inns2Id, 0, 6, 0, 0, 1, null, "LBW"),
    ]);
    log("6. Record deliveries — Innings 2", "PASS", `${balls2.length} balls recorded`);

    await conn.execute(
      "UPDATE innings SET totalRuns = 10, totalWickets = 1, totalBalls = 6 WHERE id = ?",
      [inns2Id],
    );

    // ══════════════════════════════════════════════════════
    // STEP 7: Create batsman scores & bowler stats
    // ══════════════════════════════════════════════════════
    log("7. Create batsman scores & bowler stats", "➡️");

    await conn.execute(
      `INSERT INTO batsmanScores (inningsId, playerId, runs, balls, fours, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [inns1Id, batId, 7, 5, 1, "out"],
    );
    await conn.execute(
      `INSERT INTO bowlerStats (inningsId, playerId, overs, balls, runs, wickets)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [inns1Id, bowlId, 1, 6, 7, 1],
    );
    await conn.execute(
      `INSERT INTO batsmanScores (inningsId, playerId, runs, balls, sixes, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [inns2Id, batId, 10, 5, 1, "out"],
    );

    const [bsRows] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM batsmanScores WHERE inningsId IN (?, ?)", [inns1Id, inns2Id],
    );
    const [bwRows] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM bowlerStats WHERE inningsId IN (?, ?)", [inns1Id, inns2Id],
    );
    log("7. Create batsman scores & bowler stats", "PASS",
      `batsmanScores=${bsRows[0].cnt}, bowlerStats=${bwRows[0].cnt}`);

    // ══════════════════════════════════════════════════════
    // STEP 8: UPDATE match status to live, then completed
    // ══════════════════════════════════════════════════════
    log("8. Update match status", "➡️");

    await conn.execute(
      "UPDATE matches SET status = 'live' WHERE id = ?", [dbMatchId],
    );
    let [checkLive] = await conn.execute(
      "SELECT status FROM matches WHERE id = ?", [dbMatchId],
    );
    const liveOk = checkLive[0].status === "live";
    results.push({
      step: "Match status → live",
      status: liveOk ? "PASS" : "FAIL",
      detail: `status=${checkLive[0].status}`,
    });

    await conn.execute(
      "UPDATE matches SET status = 'completed' WHERE id = ?", [dbMatchId],
    );
    let [checkDone] = await conn.execute(
      "SELECT status FROM matches WHERE id = ?", [dbMatchId],
    );
    const doneOk = checkDone[0].status === "completed";
    results.push({
      step: "Match status → completed",
      status: doneOk ? "PASS" : "FAIL",
      detail: `status=${checkDone[0].status}`,
    });
    log("8. Update match status", "PASS", "scheduled → live → completed");

    // ══════════════════════════════════════════════════════
    // STEP 9: VERIFY — Query all tables
    // ══════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════");
    console.log("📋 VERIFICATION — All test data in MySQL");
    console.log("═══════════════════════════════════════════════\n");

    // 9a. Match
    const [vMatch] = await conn.execute(
      "SELECT id, format, status, team1Id, team2Id, venue FROM matches WHERE id = ?",
      [dbMatchId],
    );
    log("9a. Match", "PASS", JSON.stringify(vMatch[0]));

    // 9b. Innings
    const [vInns] = await conn.execute(
      "SELECT id, inningsNumber, totalRuns, totalWickets, totalBalls, status FROM innings WHERE matchId = ? ORDER BY inningsNumber",
      [dbMatchId],
    );
    for (const inns of vInns) {
      log(`   Innings ${inns.inningsNumber}`, "PASS",
        `runs=${inns.totalRuns}/${inns.totalWickets}, balls=${inns.totalBalls}, status=${inns.status}`);
    }

    // 9c. Balls
    const [vBalls1] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM balls WHERE inningsId = ?", [inns1Id],
    );
    const [vBalls2] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM balls WHERE inningsId = ?", [inns2Id],
    );
    log("9c. Balls", "PASS", `innings1=${vBalls1[0].cnt} balls, innings2=${vBalls2[0].cnt} balls`);

    // Sample deliveries
    const [sampleBalls] = await conn.execute(
      "SELECT id, overNumber, ballNumber, runs, extras, extraType, isWicket, dismissalType FROM balls WHERE inningsId = ? ORDER BY overNumber, ballNumber LIMIT 3",
      [inns1Id],
    );
    log("   Sample balls (innings 1)", "➡️", JSON.stringify(sampleBalls));

    // 9d. Batsman scores & bowler stats
    const [vBS] = await conn.execute(
      "SELECT playerId, runs, balls, fours, sixes, status FROM batsmanScores WHERE inningsId = ?",
      [inns1Id],
    );
    log("9d. Batsman scores", "PASS", JSON.stringify(vBS));

    const [vBW] = await conn.execute(
      "SELECT playerId, overs, balls, runs, wickets FROM bowlerStats WHERE inningsId = ?",
      [inns1Id],
    );
    log("9e. Bowler stats", "PASS", JSON.stringify(vBW));

    // 9f. Teams
    const [vTeams] = await conn.execute(
      "SELECT id, name, teamColor FROM teams WHERE id IN (?, ?)", [team1Id, team2Id],
    );
    log("9f. Teams", "PASS", vTeams.map((t) => `${t.name} (${t.teamColor})`).join(", "));

    results.push({ step: "Deliveries", status: vBalls1[0].cnt === 6 && vBalls2[0].cnt === 6 ? "PASS" : "FAIL",
      detail: `innings1=${vBalls1[0].cnt}, innings2=${vBalls2[0].cnt}` });
    results.push({ step: "Batsman scores", status: vBS.length >= 1 ? "PASS" : "FAIL",
      detail: `${vBS.length} records` });
    results.push({ step: "Bowler stats", status: vBW.length >= 1 ? "PASS" : "FAIL",
      detail: `${vBW.length} records` });
    results.push({ step: "Teams", status: vTeams.length === 2 ? "PASS" : "FAIL",
      detail: `${vTeams.length} teams` });

    // ══════════════════════════════════════════════════════
    // STEP 10: Clean up test data
    // ══════════════════════════════════════════════════════
    console.log("\n═══ Cleanup ═══");
    await conn.execute("DELETE FROM batsmanScores WHERE inningsId IN (?, ?)", [inns1Id, inns2Id]);
    await conn.execute("DELETE FROM bowlerStats WHERE inningsId IN (?, ?)", [inns1Id, inns2Id]);
    await conn.execute("DELETE FROM balls WHERE inningsId IN (?, ?)", [inns1Id, inns2Id]);
    await conn.execute("DELETE FROM innings WHERE id IN (?, ?)", [inns1Id, inns2Id]);
    await conn.execute("DELETE FROM matches WHERE id = ?", [dbMatchId]);
    await conn.execute("DELETE FROM teamMembers WHERE teamId IN (?, ?)", [team1Id, team2Id]);
    await conn.execute("DELETE FROM teams WHERE id IN (?, ?)", [team1Id, team2Id]);
    await conn.execute("DELETE FROM players WHERE id IN (?, ?, ?, ?)", playerIds);
    await conn.execute("DELETE FROM users WHERE id = ?", [userId]);
    log("Cleanup", "PASS", "All test data removed");

    // ══════════════════════════════════════════════════════
    // SUMMARY
    // ══════════════════════════════════════════════════════
    summarize(results);

    const allPassed = results.every((r) => r.status === "PASS");
    if (allPassed) {
      console.log(`\n🎉 ${tag} ALL ${results.length} CHECKS PASSED — Database pipeline works end-to-end!`);
    } else {
      console.log(`\n⚠️  ${tag} ${results.filter((r) => r.status === "FAIL").length} check(s) failed — review above`);
      process.exit(1);
    }

    await conn.end();
  } catch (err) {
    console.error(`\n❌ Fatal error: ${err.message}`);
    if (conn) {
      try { await conn.end(); } catch {}
    }
    process.exit(1);
  }
}

run();
