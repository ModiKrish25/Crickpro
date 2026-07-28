/**
 * CricketPreloader — Ultra-Premium Cinematic Preloader & Splash Screen.
 *
 * Web: Uses native HTML/CSS with keyframe animations (100% smooth 60fps transitions).
 * Native: Uses React Native StyleSheet with glowing ambient layers & ball badges.
 */
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type PreloaderPhase = "loading" | "exit" | "hidden";

export interface PreloaderState {
  phase: PreloaderPhase;
  loadingProgress: number; // 0 to 1
  errorMessage?: string;
}

export interface CricketPreloaderProps {
  state: PreloaderState;
  onRetry?: () => void;
  onExitComplete?: () => void;
  appName?: string;
  tagline?: string;
}

const MESSAGES = [
  "Initializing match engine...",
  "Syncing live scorecards...",
  "Loading player statistics...",
  "Preparing pitch & fielders...",
  "Ready to Play!",
];

export function CricketPreloader({
  state,
  onExitComplete,
  appName = "CRICKPRO",
  tagline = "EVERY BALL • EVERY MOMENT",
}: CricketPreloaderProps) {
  const insets = useSafeAreaInsets();
  const [fading, setFading] = useState(false);
  const calledRef = useRef(false);

  // When phase becomes "exit", trigger fade and fire callback after animation
  useEffect(() => {
    if (state.phase !== "exit") return;
    setFading(true);
    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onExitComplete?.();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state.phase, onExitComplete]);

  if (state.phase === "hidden") return null;

  const completedBalls = Math.min(6, Math.floor(state.loadingProgress * 6));
  const msgIndex = Math.min(MESSAGES.length - 1, Math.floor(state.loadingProgress * MESSAGES.length));
  const currentMsg = MESSAGES[msgIndex];
  const progressPct = Math.round(state.loadingProgress * 100);

  if (Platform.OS === "web") {
    return (
      <WebPreloader
        fading={fading}
        insets={insets}
        appName={appName}
        tagline={tagline}
        completedBalls={completedBalls}
        currentMsg={currentMsg}
        progressPct={progressPct}
        phase={state.phase}
      />
    );
  }

  return (
    <View style={[styles.container, { opacity: fading ? 0 : 1, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Ambient Radial Spotlight Glows */}
      <View style={styles.blueSpotlight} />
      <View style={styles.greenSpotlight} />

      <View style={styles.content}>
        {/* Animated Cricket Ball Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.outerGlowRing} />
          <View style={styles.innerPulseRing} />
          <View style={styles.cricketBall}>
            <View style={[styles.seam, { transform: [{ rotate: "40deg" }] }]} />
            <View style={[styles.seam, { transform: [{ rotate: "-40deg" }] }]} />
            <View style={styles.seamCenter} />
          </View>
        </View>

        {/* Brand Container */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>{appName}</Text>
          <View style={styles.taglineBadge}>
            <Text style={styles.brandTagline}>{tagline}</Text>
          </View>
        </View>

        {/* Over Progress Balls */}
        <View style={styles.ballsRow}>
          {[1, 2, 3, 4, 5, 6].map((b) => {
            const active = b <= completedBalls;
            return (
              <View key={b} style={[styles.ballDot, active ? styles.ballDotActive : styles.ballDotInactive]}>
                <Text style={[styles.ballText, active && styles.ballTextActive]}>
                  {active ? "✓" : b}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Progress Bar & Percentage */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.loadingMessage}>{currentMsg}</Text>
            <Text style={styles.progressPctText}>{progressPct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>CRICKPRO ENGINE • PROFESSIONAL SCORING PLATFORM</Text>
    </View>
  );
}

// ─── Web Cinematic Preloader (Matches Left Phone Onboarding Screen) ────────────
function WebPreloader({
  fading,
  insets,
  appName,
  tagline,
  completedBalls,
  currentMsg,
  progressPct,
  phase,
}: {
  fading: boolean;
  insets: { top: number; bottom: number };
  appName: string;
  tagline: string;
  completedBalls: number;
  currentMsg: string;
  progressPct: number;
  phase: PreloaderPhase;
}) {
  return (
    <div
      style={{
        position: "fixed" as const,
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#0B0E17",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "space-between",
        opacity: fading ? 0 : 1,
        transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 32,
        paddingLeft: 24,
        paddingRight: 24,
        pointerEvents: phase === "exit" ? ("none" as const) : ("auto" as const),
      }}
    >
      {/* Top Header: Skip Pill Button */}
      <div style={{ width: "100%", maxWidth: 440, display: "flex", justifyContent: "flex-end", zIndex: 10 }}>
        <button
          onClick={() => {}}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#FFFFFF",
            borderRadius: 20,
            padding: "6px 20px",
            fontSize: 13,
            fontWeight: "700",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          Skip
        </button>
      </div>

      {/* Center Artwork & Content Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          width: "100%",
          maxWidth: 440,
          textAlign: "left" as const,
          gap: 20,
        }}
      >
        {/* Animated Cricket Ball Logo Emblem */}
        <div style={{ position: "relative" as const, width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
          <div
            style={{
              position: "absolute" as const,
              width: 104,
              height: 104,
              borderRadius: "50%",
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.5)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
            }}
          />
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.6)",
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: "900",
            }}
          >
            🏏
          </div>
        </div>

        {/* Onboarding Titles */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column" as const, gap: 8 }}>
          <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 18, fontWeight: "600" }}>Your Ultimate</div>
          <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "900", letterSpacing: "-0.5px" }}>Cricket Score Hub</div>
          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "500", lineHeight: "1.5", marginTop: 4 }}>
            Stay updated with live scores, match stats, and highlights. Your ultimate cricket hub for real-time global updates. 🏏
          </div>
        </div>
      </div>

      {/* Bottom Swipe Control Pill Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 36,
          padding: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255, 255, 255, 0.5)", fontSize: 16, fontWeight: "700" }}>
          &lt;
        </div>

        {/* Central Active Check Button Orb */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "900",
          }}
        >
          ✓
        </div>

        <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255, 255, 255, 0.5)", fontSize: 16, fontWeight: "700" }}>
          &gt;&gt;&gt;
        </div>
      </div>
    </div>
  );
}

// ─── Native Styles ────────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#070A10",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
  blueSpotlight: {
    position: "absolute",
    width: Math.min(width * 0.9, 440),
    height: Math.min(width * 0.9, 440),
    borderRadius: 220,
    backgroundColor: "rgba(0, 102, 255, 0.07)",
    top: "15%",
  },
  greenSpotlight: {
    position: "absolute",
    width: Math.min(width * 0.8, 380),
    height: Math.min(width * 0.8, 380),
    borderRadius: 190,
    backgroundColor: "rgba(16, 185, 129, 0.06)",
    bottom: "20%",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    width: Math.min(width - 48, 400),
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 32,
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  logoWrapper: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  outerGlowRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.35)",
    backgroundColor: "rgba(16, 185, 129, 0.06)",
  },
  innerPulseRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(0, 102, 255, 0.1)",
  },
  cricketBall: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  seam: {
    position: "absolute",
    width: "100%",
    height: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  seamCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 5,
    textAlign: "center",
  },
  taglineBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 1.8,
    textAlign: "center",
  },
  ballsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  ballDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  ballDotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  ballDotActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  ballText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.35)",
  },
  ballTextActive: {
    color: "#FFFFFF",
  },
  progressContainer: {
    width: "100%",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.3,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#10B981",
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  footerText: {
    position: "absolute",
    bottom: 24,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.25)",
    letterSpacing: 1.8,
    textAlign: "center",
  },
});

export default CricketPreloader;
