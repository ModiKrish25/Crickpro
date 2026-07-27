/**
 * CricketPreloader — Premium cinematic splash screen.
 *
 * Web: Uses a native <div> with CSS transitions (100% reliable fade/callback).
 * Native: Uses React Native View/Text with simple opacity state.
 *
 * onExitComplete is GUARANTEED via direct setTimeout — no Animated callback needed.
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
  "Ready to Play!",
];

export function CricketPreloader({
  state,
  onExitComplete,
  appName = "CRICKPRO",
  tagline = "Every Ball. Every Moment.",
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
    }, 380);
    return () => clearTimeout(timer);
  }, [state.phase, onExitComplete]);

  if (state.phase === "hidden") return null;

  const completedBalls = Math.min(6, Math.floor(state.loadingProgress * 6));
  const msgIndex = Math.min(MESSAGES.length - 1, Math.floor(state.loadingProgress * MESSAGES.length));
  const currentMsg = MESSAGES[msgIndex];
  const progressPct = Math.round(state.loadingProgress * 100);

  if (Platform.OS === "web") {
    return <WebPreloader fading={fading} insets={insets} appName={appName} tagline={tagline} completedBalls={completedBalls} currentMsg={currentMsg} progressPct={progressPct} phase={state.phase} />;
  }

  return (
    <View style={[styles.container, { opacity: fading ? 0 : 1, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.glowCircle} />
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <View style={styles.pulseRing} />
          <View style={styles.cricketBall}>
            <View style={[styles.seam, { transform: [{ rotate: "35deg" }] }]} />
            <View style={[styles.seam, { transform: [{ rotate: "-35deg" }] }]} />
            <View style={styles.seamCenter} />
          </View>
        </View>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>{appName}</Text>
          <Text style={styles.brandTagline}>{tagline}</Text>
        </View>
        <View style={styles.loaderContainer}>
          <View style={styles.ballsRow}>
            {[1, 2, 3, 4, 5, 6].map((b) => {
              const active = b <= completedBalls;
              return (
                <View key={b} style={[styles.ballDot, active ? styles.ballDotActive : styles.ballDotInactive]}>
                  <Text style={[styles.ballText, active && styles.ballTextActive]}>{b}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={styles.loadingMessage}>{currentMsg}</Text>
        </View>
      </View>
      <Text style={styles.footerText}>CRICKPRO v1.0 • LIVE SCORING ENGINE</Text>
    </View>
  );
}

// ─── Web Preloader ────────────────────────────────────────────────────────────
function WebPreloader({
  fading, insets, appName, tagline, completedBalls, currentMsg, progressPct, phase,
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
        backgroundColor: "#050806",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity 350ms ease-out",
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        pointerEvents: phase === "exit" ? ("none" as const) : ("auto" as const),
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute" as const, inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, rgba(0,102,255,0.09) 0%, transparent 70%)",
        pointerEvents: "none" as const,
      }} />
      <div style={{
        position: "absolute" as const, width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,199,89,0.06) 0%, transparent 70%)",
        pointerEvents: "none" as const,
      }} />

      {/* Main content card */}
      <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", animation: "cp-rise 0.5s ease-out both" }}>
        {/* Cricket ball */}
        <div style={{ position: "relative" as const, width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <div style={{
            position: "absolute" as const, width: 96, height: 96, borderRadius: "50%",
            border: "2px solid rgba(52,199,89,0.35)", background: "rgba(52,199,89,0.08)",
            animation: "cp-pulse 1.8s ease-in-out infinite",
          }} />
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ef5350 0%, #b71c1c 100%)",
            boxShadow: "0 6px 28px rgba(255,77,77,0.55), inset 0 2px 6px rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative" as const, overflow: "hidden" as const,
          }}>
            <div style={{ position: "absolute" as const, width: "100%", height: 2, background: "rgba(255,255,255,0.6)", transform: "rotate(35deg)" }} />
            <div style={{ position: "absolute" as const, width: "100%", height: 2, background: "rgba(255,255,255,0.6)", transform: "rotate(-35deg)" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />
          </div>
        </div>

        {/* Brand */}
        <div style={{ textAlign: "center" as const, marginBottom: 36 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: 5, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {appName}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#34C759", letterSpacing: 1.8, marginTop: 8, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {tagline}
          </div>
        </div>

        {/* 6-Ball Over Loader */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
          {[1, 2, 3, 4, 5, 6].map((b) => {
            const active = b <= completedBalls;
            return (
              <div key={b} style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: active ? "1.5px solid #34C759" : "1.5px solid rgba(255,255,255,0.15)",
                background: active ? "#34C759" : "rgba(255,255,255,0.04)",
                boxShadow: active ? "0 2px 10px rgba(52,199,89,0.55)" : "none",
                transition: "all 0.25s ease",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#000" : "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif" }}>
                  {b}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ width: 300, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" as const, marginBottom: 16 }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, #0066FF, #34C759)",
            width: `${progressPct}%`,
            transition: "width 0.12s linear",
          }} />
        </div>

        {/* Status message */}
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)", textAlign: "center" as const, letterSpacing: 0.5, fontFamily: "'Inter', system-ui, sans-serif" }}>
          {currentMsg}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute" as const, bottom: 28, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: 2, fontFamily: "system-ui, sans-serif" }}>
        CRICKPRO v1.0 • LIVE SCORING ENGINE
      </div>

      <style>{`
        @keyframes cp-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes cp-rise {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Native Styles ────────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050806",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
  glowCircle: {
    position: "absolute", width: Math.min(width * 0.9, 420), height: Math.min(width * 0.9, 420),
    borderRadius: 210, backgroundColor: "rgba(52, 199, 89, 0.05)",
  },
  content: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  logoWrapper: { width: 100, height: 100, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  pulseRing: {
    position: "absolute", width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: "rgba(52,199,89,0.35)", backgroundColor: "rgba(52,199,89,0.08)",
  },
  cricketBall: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#D32F2F",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF4D4D", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  seam: { position: "absolute", width: "100%", height: 2, backgroundColor: "rgba(255,255,255,0.65)" },
  seamCenter: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFFFFF", opacity: 0.7 },
  brandContainer: { alignItems: "center", marginBottom: 32 },
  brandTitle: { fontSize: 34, fontWeight: "800", color: "#FFFFFF", letterSpacing: 3, marginBottom: 6, textAlign: "center" },
  brandTagline: { fontSize: 14, fontWeight: "500", color: "#34C759", letterSpacing: 1.2, textAlign: "center" },
  loaderContainer: { alignItems: "center", width: Math.min(width - 64, 320) },
  ballsRow: { flexDirection: "row", gap: 8, marginBottom: 16, justifyContent: "center" },
  ballDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  ballDotInactive: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" },
  ballDotActive: { backgroundColor: "#34C759", borderColor: "#34C759", shadowColor: "#34C759", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 6 },
  ballText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  ballTextActive: { color: "#000000" },
  progressBarBg: { width: "100%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: 14 },
  progressBarFill: { height: "100%", backgroundColor: "#0066FF", borderRadius: 2 },
  loadingMessage: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)", textAlign: "center", letterSpacing: 0.5 },
  footerText: { position: "absolute", bottom: 24, fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textAlign: "center" },
});

export default CricketPreloader;
