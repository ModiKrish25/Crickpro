/**
 * Animation Configuration — Centralized timing & physics constants
 *
 * All preloader animations reference these values so timing, spring
 * physics, and easing can be adjusted globally.
 */
import { Easing } from "react-native-reanimated";
// ─── Timeline (seconds) ──────────────────────────────────────────────────────
// Reference: the spec timeline in the design doc.

export const TIMELINE = {
  /** Dark screen → stadium ambient glow becomes visible */
  AMBIENT_APPEAR: 0.3,
  /** Cricket ball enters viewport */
  BALL_ENTRY: 0.5,
  /** Ball approaches wicket */
  BALL_APPROACH: 0.8,
  /** Ball reaches wicket → impact */
  BALL_IMPACT: 1.5,
  /** Logo transformation begins */
  LOGO_TRANSFORM_START: 2.0,
  /** Logo fully visible */
  LOGO_VISIBLE: 2.4,
  /** App name letters appear */
  APP_NAME_APPEAR: 2.6,
  /** Tagline fades in */
  TAGLINE_APPEAR: 2.8,
  /** Total minimum animation duration before exit */
  MIN_TOTAL_DURATION: 3.0,
  /** Exit transition duration */
  EXIT_DURATION: 0.6,
} as const;

// ─── Spring physics ──────────────────────────────────────────────────────────

export const SPRING = {
  /** Heavy, slow — for logo and large elements */
  HEAVY: { damping: 20, stiffness: 120, mass: 1.2 },
  /** Bouncy — for ball and playful elements */
  BOUNCY: { damping: 12, stiffness: 180, mass: 0.6 },
  /** Snappy — for micro-interactions */
  SNAPPY: { damping: 15, stiffness: 250, mass: 0.4 },
  /** Smooth — for fades and reveals */
  SMOOTH: { damping: 18, stiffness: 150, mass: 0.8 },
  /** Elastic — for wicket bails and pop effects */
  ELASTIC: { damping: 8, stiffness: 200, mass: 0.5 },
} as const;

// ─── Easing presets ──────────────────────────────────────────────────────────

export const EASING = {
  /** For cinematic object movement (ball trajectory, logo) */
  CINEMATIC: Easing.bezier(0.22, 1, 0.36, 1),
  /** For overshoot effects (bails, impact) */
  OVERSHOOT: Easing.bezier(0.68, -0.15, 0.27, 1.55),
  /** Smooth deceleration */
  DECELERATE: Easing.out(Easing.cubic),
  /** Gentle fade */
  FADE: Easing.inOut(Easing.sin),
} as const;

// ─── Ball trajectory ─────────────────────────────────────────────────────────

export const BALL = {
  /** Start position (offscreen — right side) */
  ENTRY_X: 200,
  ENTRY_Y: -150,
  /** Rotation speed during flight (revolutions per second) */
  FLIGHT_ROTATION_SPEED: 2.5,
  /** Final resting position (center) */
  CENTER_X: 0,
  CENTER_Y: 0,
  /** Size on screen (responsive, scales with device) */
  SIZE: 48,
  /** Glow intensity */
  GLOW_OPACITY: 0.3,
} as const;

// ─── Over loader ─────────────────────────────────────────────────────────────

export const OVER_LOADER = {
  /** Duration for each ball to fill (seconds) */
  BALL_DURATION: 0.3,
  /** Gap between ball completions (seconds) */
  BALL_GAP: 0.15,
  /** Bounce scale when ball fills */
  POP_SCALE: 1.4,
  /** Resting scale */
  REST_SCALE: 1,
} as const;

// ─── Logo ────────────────────────────────────────────────────────────────────

export const LOGO = {
  /** Scale when fully visible */
  TARGET_SCALE: 1,
  /** Slight overshoot before settling */
  OVERSHOOT_SCALE: 1.08,
  /** Exit scale (grows as it fades) */
  EXIT_SCALE: 1.15,
  /** Opacity at full visibility */
  FULL_OPACITY: 1,
} as const;

// ─── Exit ────────────────────────────────────────────────────────────────────

export const EXIT = {
  /** Logo scales up slightly while fading out */
  LOGO_SCALE: 1.08,
  /** Background blur increase */
  BLUR_INTENSITY: 20,
  /** Content moves upward during exit */
  TRANSLATE_Y: -60,
} as const;

// ─── Responsive sizes ────────────────────────────────────────────────────────

export function getBallSize(width: number): number {
  if (width < 375) return 40;       // Small phone
  if (width < 430) return 48;       // Standard phone
  if (width < 768) return 56;       // Large phone / small tablet
  return 64;                         // Tablet / desktop
}

export function getOverDotSize(width: number): number {
  if (width < 375) return 10;
  if (width < 430) return 12;
  return 14;
}

export function getLogoSize(width: number): number {
  if (width < 375) return 64;
  if (width < 430) return 80;
  if (width < 768) return 96;
  return 112;
}
