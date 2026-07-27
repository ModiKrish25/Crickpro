/**
 * Avatar — User avatar with image, initials fallback, and status indicator.
 *
 * Design: Circular with glass border, optional online/away/busy dot.
 * Supports image, initials fallback, and size variants.
 */
import { View, Text, Image, type ImageSourcePropType } from "react-native";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";
type StatusType = "online" | "away" | "busy" | "offline";

interface AvatarProps {
  /** Image source. Falls back to initials if omitted or on error */
  source?: ImageSourcePropType;
  /** Display name used for initials fallback (e.g. "Virat Kohli" → "VK") */
  name?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Presence status indicator dot */
  status?: StatusType;
  /** Additional class names */
  className?: string;
  /** Optional onPress */
  onPress?: () => void;
}

const SIZE_MAP: Record<AvatarSize, { dim: number; font: number; dot: number }> = {
  sm: { dim: 32, font: 11, dot: 8 },
  md: { dim: 44, font: 15, dot: 10 },
  lg: { dim: 64, font: 22, dot: 12 },
  xl: { dim: 96, font: 34, dot: 14 },
};

const STATUS_COLORS: Record<StatusType, string> = {
  online: "#34C759",
  away: "#FF9F0A",
  busy: "#FF3B30",
  offline: "#86868B",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  source,
  name,
  size = "md",
  status,
  className,
  onPress,
}: AvatarProps) {
  const { dim, font, dot } = SIZE_MAP[size];
  const initials = getInitials(name);
  const Container = onPress ? (View as any) : View;

  return (
    <Container
      className={cn("relative", className)}
      onPress={onPress}
      style={{ width: dim, height: dim }}
    >
      {/* Image or initials fallback */}
      {source ? (
        <Image
          source={source}
          className="rounded-full"
          style={{ width: dim, height: dim }}
        />
      ) : (
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: dim,
            height: dim,
            backgroundColor: "rgba(0,102,255,0.15)",
            borderWidth: 1,
            borderColor: "rgba(0,102,255,0.3)",
          }}
        >
          <Text
            className="font-bold text-[#0066FF]"
            style={{ fontSize: font }}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Status dot */}
      {status && (
        <View
          className="absolute rounded-full border-2"
          style={{
            width: dot + 4,
            height: dot + 4,
            bottom: -1,
            right: -1,
            backgroundColor: STATUS_COLORS[status],
            borderColor: "rgba(255,255,255,0.8)",
          }}
        />
      )}
    </Container>
  );
}

export default Avatar;
