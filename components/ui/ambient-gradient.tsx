/**
 * AmbientGradient — Soft gradient mesh background for the entire app.
 *
 * Renders a subtle, premium gradient mesh using multiple large,
 * semi-transparent blurred circles. Creates depth without being
 * distracting. Works cross-platform (web + native).
 *
 * Design:
 * - Dark mode: deep blue / indigo / purple tones (cool, modern)
 * - Light mode: warm blue / teal / rose tones (bright, airy)
 * - Web: uses CSS radial gradients for crisp rendering
 * - Native: uses layered large-radius Views
 */
import { View, Platform } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";

interface AmbientGradientProps {
  /** Intensity multiplier 0-1 (default 1) */
  intensity?: number;
  /** Whether the gradient should fill the entire screen */
  fullscreen?: boolean;
  /** Additional class names */
  className?: string;
}

interface BlobDef {
  color: string;
  /** Horizontal position as CSS percentage e.g. "0%", "50%", "100%" */
  x: string;
  /** Vertical position as CSS percentage */
  y: string;
  /** Blob diameter in px */
  size: number;
}

/**
 * Color stops for the gradient mesh.
 * Each blob is a large, offset, semi-transparent circle.
 */
const DARK_BLOBS: BlobDef[] = [
  { color: "rgba(0, 102, 255, 0.06)", x: "0%", y: "0%", size: 600 },
  { color: "rgba(94, 92, 230, 0.04)", x: "100%", y: "20%", size: 500 },
  { color: "rgba(0, 102, 255, 0.03)", x: "50%", y: "100%", size: 550 },
  { color: "rgba(121, 80, 242, 0.03)", x: "20%", y: "60%", size: 400 },
  { color: "rgba(0, 160, 255, 0.02)", x: "80%", y: "80%", size: 350 },
];

const LIGHT_BLOBS: BlobDef[] = [
  { color: "rgba(0, 102, 255, 0.04)", x: "0%", y: "0%", size: 600 },
  { color: "rgba(90, 200, 250, 0.03)", x: "100%", y: "15%", size: 500 },
  { color: "rgba(0, 102, 255, 0.02)", x: "50%", y: "100%", size: 550 },
  { color: "rgba(200, 120, 240, 0.02)", x: "15%", y: "55%", size: 400 },
  { color: "rgba(0, 180, 255, 0.015)", x: "85%", y: "75%", size: 350 },
];

export function AmbientGradient({
  intensity = 1,
  fullscreen = true,
  className,
}: AmbientGradientProps) {
  const { colorScheme } = useThemeContext();
  const blobs = DARK_BLOBS;

  if (Platform.OS === "web") {
    // Web: Use CSS radial gradients for smooth, performant rendering
    const gradientStops = blobs
      .map(
        (b) =>
          `radial-gradient(${b.size * intensity}px at ${b.x} ${b.y}, ${b.color} 0%, transparent 70%)`,
      )
      .join(", ");

    return (
      <View
        className={cn(
          fullscreen ? "absolute inset-0 pointer-events-none" : "pointer-events-none",
          className,
        )}
        style={{ zIndex: 0 }}
      >
        <View
          className={fullscreen ? "absolute inset-0" : "w-full h-full"}
          style={{
            backgroundImage: gradientStops,
          } as any}
        />
      </View>
    );
  }

  // Native: Use large-radius circles to simulate a gradient mesh
  // Convert percentage positions to native pixel values by positioning
  // via CSS-like percentage values (React Native accepts "50%" as DimensionValue)
  return (
    <View
      className={cn(
        fullscreen ? "absolute inset-0 pointer-events-none" : "pointer-events-none",
        className,
      )}
      style={{ zIndex: 0 }}
    >
      {blobs.map((blob, idx) => (
        <View
          key={idx}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.x as any,
            top: blob.y as any,
            marginLeft: -(blob.size / 2),
            marginTop: -(blob.size / 2),
            backgroundColor: blob.color,
            opacity: intensity,
          }}
          pointerEvents="none"
        />
      ))}
    </View>
  );
}

export default AmbientGradient;
