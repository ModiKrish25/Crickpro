/**
 * Email/Password Authentication Routes
 *
 * Provides local sign-up and sign-in that works without external OAuth.
 * Uses Node.js built-in `crypto` for password hashing (PBKDF2-SHA256).
 * Issues the same JWT session cookie used by OAuth for full compatibility.
 */
import { createHash, randomBytes, pbkdf2Sync } from "crypto";
import type { Express, Request, Response } from "express";
import { getUserByEmail, upsertUser, getUserByOpenId } from "../db/db";
import { getSessionCookieOptions } from "../core/cookies";
import { sdk } from "../core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";

// ---- Password utilities (PBKDF2-SHA256) ----

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = "sha256";
const SEP = ":";

function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, s, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${s}${SEP}${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt] = stored.split(SEP);
  if (!salt) return false;
  const candidate = hashPassword(password, salt);
  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(candidate);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Generate a deterministic openId for email users: "email:<sha256(email)>" */
function emailOpenId(email: string): string {
  const hash = createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
  return `email:${hash}`;
}

function buildUserResponse(user: { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; lastSignedIn: Date }) {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "email",
    lastSignedIn: user.lastSignedIn.toISOString(),
  };
}

export function registerEmailAuthRoutes(app: Express) {
  /**
   * POST /api/auth/email/register
   * Body: { name: string, email: string, password: string }
   */
  app.post("/api/auth/email/register", async (req: Request, res: Response) => {
    const { name, email, password } = req.body ?? {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email address required" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    try {
      // Check if email already registered
      const existing = await getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      const openId = emailOpenId(email);
      const passwordHash = hashPassword(password);
      const lastSignedIn = new Date();

      await upsertUser({
        openId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        loginMethod: "email",
        lastSignedIn,
      });

      const user = await getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create account" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name.trim(),
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.status(201).json({
        success: true,
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[EmailAuth] Register failed:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  /**
   * POST /api/auth/email/login
   * Body: { email: string, password: string }
   */
  app.post("/api/auth/email/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    try {
      const user = await getUserByEmail(email.toLowerCase().trim());

      if (!user || !user.passwordHash) {
        // Use same error message for both "not found" and "no password" to prevent user enumeration
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Update lastSignedIn
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        app_session_id: sessionToken,
        user: buildUserResponse(user as any),
      });
    } catch (error) {
      console.error("[EmailAuth] Login failed:", error);
      res.status(500).json({ error: "Sign in failed. Please try again." });
    }
  });
}
