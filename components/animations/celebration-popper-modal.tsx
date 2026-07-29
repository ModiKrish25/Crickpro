/**
 * Celebration Popper Modal — High-Impact Fullscreen 4, 6 & Wicket Celebration
 * 
 * Features:
 * - Root React Native Modal (unclipped by parent scroll or CSS transforms)
 * - Multi-colored confetti popper animation
 * - Custom styled glassmorphic banner for FOUR, SIX, and WICKET
 * - Auto-dismiss after 1.8 seconds
 */
import React, { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

export type CelebrationType = "four" | "six" | "wicket" | null;

export interface CelebrationPopperModalProps {
  type: CelebrationType;
  playerName?: string;
  dismissalType?: string;
  onClose: () => void;
}

const CONFETTI_COLORS = ["#10B981", "#FBBF24", "#3B82F6", "#EF4444", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"];

// Generate 32 confetti particles with random trajectories
const PARTICLES = Array.from({ length: 32 }, (_, i) => {
  const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
  const distance = 90 + Math.random() * 140;
  return {
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance - 40,
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
    isRibbon: i % 3 === 0,
  };
});

export function CelebrationPopperModal({
  type,
  playerName = "Batter",
  dismissalType = "Out",
  onClose,
}: CelebrationPopperModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [type, onClose]);

  if (!type || !visible) return null;

  const isFour = type === "four";
  const isSix = type === "six";
  const isWicket = type === "wicket";

  const bannerBg = isSix
    ? "bg-[#10B981] border-[#34D399]"
    : isFour
      ? "bg-[#3B82F6] border-[#60A5FA]"
      : "bg-[#EF4444] border-[#F87171]";

  const shadowGlow = isSix
    ? "shadow-emerald-500/60"
    : isFour
      ? "shadow-blue-500/60"
      : "shadow-red-500/60";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.overlay}
      >
        {/* Confetti Particles Layer */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {PARTICLES.map((p) => (
            <View
              key={p.id}
              style={{
                position: "absolute",
                width: p.isRibbon ? p.size * 2 : p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.isRibbon ? 2 : p.size / 2,
                transform: [
                  { translateX: p.dx },
                  { translateY: p.dy },
                  { rotate: `${p.rotation}deg` },
                ],
                opacity: 0.9,
              }}
            />
          ))}
        </View>

        {/* Main Banner Popup */}
        <View
          className={`px-8 py-6 rounded-3xl items-center justify-center border-4 ${bannerBg} ${shadowGlow} shadow-2xl`}
          style={{ minWidth: 260, maxWidth: 340, elevation: 30 }}
        >
          {isFour && (
            <>
              <Text className="text-4xl font-black text-white text-center tracking-tight">
                🎉 FOUR! 🎉
              </Text>
              <Text className="text-lg font-black text-white text-center mt-1">
                +4 RUNS BOUNDARY!
              </Text>
            </>
          )}

          {isSix && (
            <>
              <Text className="text-4xl font-black text-white text-center tracking-tight">
                🎆 MAXIMUM SIX! 🎆
              </Text>
              <Text className="text-lg font-black text-white text-center mt-1">
                +6 RUNS OVER THE ROPES!
              </Text>
            </>
          )}

          {isWicket && (
            <>
              <Text className="text-3xl font-black text-white text-center tracking-wider">
                🚨 WICKET! 🚨
              </Text>
              <Text className="text-xl font-black text-white text-center mt-2">
                {playerName}
              </Text>
              <Text className="text-xs font-black text-white/90 text-center mt-1 uppercase tracking-widest">
                {dismissalType}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 11, 8, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
  },
  particlesContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 300,
    height: 300,
  },
});
