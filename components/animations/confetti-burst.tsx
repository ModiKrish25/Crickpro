import { View } from "react-native";
import { ParticleEffect } from "./particle-effect";

export interface ConfettiBurstProps {
  isVisible: boolean;
  color?: string;
}

/**
 * Confetti Burst Component
 * Creates a burst of particles for celebratory moments
 */
export function ConfettiBurst({ isVisible, color = "#FFD700" }: ConfettiBurstProps) {
  if (!isVisible) return null;

  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 50,
    angle: (i / 12) * Math.PI * 2,
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 200,
        height: 200,
        marginLeft: -100,
        marginTop: -100,
        zIndex: 999,
      }}
    >
      {particles.map((particle) => (
        <ParticleEffect
          key={particle.id}
          color={color}
          delay={particle.delay}
        />
      ))}
    </View>
  );
}

