/**
 * usePreloaderSound — Subtle haptic + audio feedback for the wicket impact
 * moment in the cricket preloader.
 *
 * - Haptic: uses expo-haptics (native only, Medium impact)
 * - Audio (web): uses Web Audio API — generates a short 50ms click/thud
 *   with frequency sweep (800Hz→200Hz) and rapid decay
 * - Skips haptics when reduced motion is preferred
 * - Uses static imports matching codebase conventions
 */
import { useCallback } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface UsePreloaderSoundOptions {
  /** Enable/disable haptic feedback (default: true) */
  hapticsEnabled?: boolean;
  /** Enable/disable impact sound on web (default: true) */
  soundEnabled?: boolean;
}

// ─── Web Audio: generate a subtle cricket-ball impact click ─────────────

function playWebImpactSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 0.05; // 50ms
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const progress = i / buffer.length;

      // Frequency sweep: 800Hz → 200Hz (thud feel)
      const freq = 800 - progress * 600;
      // Envelope: sharp 2ms attack → fast exponential decay
      const envelope = progress < 0.04
        ? progress / 0.04
        : Math.exp(-(progress - 0.04) * 60);
      // Mix sine (70%) + noise (30%) for wooden texture
      const sine = Math.sin(2 * Math.PI * freq * t);
      const noise = (Math.random() * 2 - 1) * 0.3;
      data[i] = (sine * 0.7 + noise) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Low-pass filter: soften the impact
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;

    // Gain ramp: subtle volume, smooth decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);

    // Close context after playback to free resources
    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {
    // Web Audio API unavailable — silent fallback
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────

export function usePreloaderSound(options: UsePreloaderSoundOptions = {}) {
  const {
    hapticsEnabled = true,
    soundEnabled = true,
  } = options;

  const reducedMotion = useReducedMotion();

  const playImpact = useCallback(() => {
    // Haptic feedback (native only)
    if (hapticsEnabled && !reducedMotion && Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Haptics unavailable — ignore
      }
    }

    // Impact sound (web only — native respects silent mode via OS)
    if (soundEnabled && Platform.OS === "web") {
      playWebImpactSound();
    }
  }, [hapticsEnabled, soundEnabled, reducedMotion]);

  return { playImpact };
}

export default usePreloaderSound;
