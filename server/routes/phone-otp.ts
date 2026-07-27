/**
 * Phone OTP Authentication
 *
 * Provides phone-based OTP authentication as an alternative to OAuth.
 *
 * Flow:
 * 1. Client sends phone number → server generates 6-digit code, stores it in-memory with 5-min expiry
 * 2. In dev mode, code is logged to console (no SMS cost)
 * 3. Client sends phone + code → server verifies, creates/upserts user, returns session token
 *
 * For production, integrate an SMS provider (Twilio Verify, AWS SNS, etc.)
 * by replacing the `sendSms` function.
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { getSessionCookieOptions } from "../core/cookies";
import { sdk } from "../core/sdk";
import * as db from "../db/db";

// ─── In-memory OTP storage ───
// Map<phoneNumber, { code, expiresAt }>
const otpStore = new Map<
  string,
  { code: string; expiresAt: number; attempts: number }
>();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a random numeric OTP code.
 */
function generateOtpCode(): string {
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Send an SMS with the OTP code.
 *
 * DEV MODE: Logs the code to console so developers can test without an SMS provider.
 * PRODUCTION: Replace with Twilio Verify, AWS SNS, or another SMS provider.
 */
async function sendSms(phone: string, code: string): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // TODO: Integrate with an SMS provider
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   body: `Your CrickPro verification code is: ${code}`,
    //   to: phone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });
    console.log(`[PhoneOTP] PRODUCTION MODE - would send SMS to ${phone}: code=${code}`);
    console.warn(
      "[PhoneOTP] No SMS provider configured! Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER env vars.",
    );
  } else {
    // Dev mode: log to console
    console.log(`[PhoneOTP] 📱 DEV MODE - OTP for ${phone}: ${code}`);
  }
}

/**
 * Normalize a phone number to E.164 format.
 * If the number doesn't start with '+', assume it's a test number and prefix '+1'.
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.trim();
  if (cleaned.startsWith("+")) return cleaned;
  // Default to US country code for test numbers without prefix
  return `+1${cleaned.replace(/^1/, "")}`;
}

/**
 * POST /api/auth/phone/send-otp
 *
 * Generates a 6-digit OTP, stores it in-memory, and "sends" it via SMS.
 * In dev mode, the code is printed to the server console.
 *
 * Body: { phone: string }
 */
async function handleSendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    // Generate and store OTP
    const code = generateOtpCode();
    otpStore.set(normalizedPhone, {
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    // Send the code via SMS (or log it in dev mode)
    await sendSms(normalizedPhone, code);

    // Clean up expired OTPs periodically
    if (otpStore.size % 10 === 0) {
      for (const [key, val] of otpStore.entries()) {
        if (Date.now() > val.expiresAt) otpStore.delete(key);
      }
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      // In dev mode, include the code for testing convenience
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (error) {
    console.error("[PhoneOTP] send-otp failed:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}

/**
 * POST /api/auth/phone/verify-otp
 *
 * Verifies the OTP code, creates/upserts a user, and returns a session token.
 * The user's openId is derived from the phone number (phone_<normalized>).
 *
 * Body: { phone: string, code: string }
 */
async function handleVerifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone, code } = req.body;

    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Verification code is required" });
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const stored = otpStore.get(normalizedPhone);

    // Check if OTP exists
    if (!stored) {
      res.status(400).json({ error: "No OTP sent to this number. Please request a new code." });
      return;
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedPhone);
      res.status(400).json({ error: "OTP has expired. Please request a new code." });
      return;
    }

    // Check attempts
    stored.attempts += 1;
    if (stored.attempts > MAX_ATTEMPTS) {
      otpStore.delete(normalizedPhone);
      res.status(400).json({ error: "Too many incorrect attempts. Please request a new code." });
      return;
    }

    // Verify code
    if (stored.code !== code) {
      res.status(400).json({
        error: "Incorrect verification code",
        attemptsRemaining: MAX_ATTEMPTS - stored.attempts,
      });
      return;
    }

    // ─── Code verified — create/upsert user ───
    const openId = `phone_${normalizedPhone}`;
    const now = new Date();

    // Find existing user by openId
    let user = await db.getUserByOpenId(openId);

    if (user) {
      // Update last signed in
      await db.upsertUser({
        openId,
        lastSignedIn: now,
        loginMethod: "phone",
      });
    } else {
      // Create new user
      await db.upsertUser({
        openId,
        name: null,
        email: null,
        loginMethod: "phone",
        lastSignedIn: now,
      });
    }

    // Persist the verified phone number to the user record
    await db.updateUserPhone(openId, normalizedPhone);

    // Re-fetch to get the full user object with id
    user = await db.getUserByOpenId(openId);
    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    // Create session token
    const sessionToken = await sdk.createSessionToken(openId, {
      name: user.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie for web auth
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    // Clear the OTP from store (one-time use)
    otpStore.delete(normalizedPhone);

    res.json({
      success: true,
      app_session_id: sessionToken,
      user: {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: "phone",
        lastSignedIn: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PhoneOTP] verify-otp failed:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
}

/**
 * Register phone OTP routes on the Express app.
 */
export function registerPhoneOtpRoutes(app: Express) {
  app.post("/api/auth/phone/send-otp", handleSendOtp);
  app.post("/api/auth/phone/verify-otp", handleVerifyOtp);
  console.log("[PhoneOTP] Routes registered: /api/auth/phone/send-otp, /api/auth/phone/verify-otp");
}
