/**
 * Chip — Compact label/tag for filters, categories, and selections.
 *
 * Design: Glass pill with optional icon, avatar, and remove button.
 */
import { View, Text, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";

type ChipVariant = "default" | "primary" | "outlined" | "subtle";

interface ChipProps {
  label: string;
  /** Visual variant */
  variant?: ChipVariant;
  /** Whether chip is selected/active */
  selected?: boolean;
  /** Emoji or icon prefix */
  icon?: string;
  /** Show remove "×" button */
  removable?: boolean;
  /** Called when remove is tapped */
  onRemove?: () => void;
  /** Called when chip is tapped */
  onPress?: () => void;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

function ChipContent({
  label, icon, variant, selected, size, removable, onRemove,
}: ChipProps) {
  const fontSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;
  const iconSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  return (
    <>
      {icon && <Text style={{ fontSize: iconSize, marginRight: 3 }}>{icon}</Text>}
      <Text
        className={cn(
          "font-semibold",
          variant === "primary" || selected ? "text-white" : "text-foreground",
        )}
        style={{ fontSize }}
      >
        {label}
      </Text>
      {removable && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="ml-1.5"
        >
          <Text
            className={cn(
              variant === "primary" || selected ? "text-white/70" : "text-muted",
            )}
            style={{ fontSize: iconSize, fontWeight: "700" }}
          >
            ×
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

export function Chip(props: ChipProps) {
  const {
    variant = "default",
    selected = false,
    size = "md",
    onPress,
    className,
  } = props;

  const paddingY = size === "sm" ? 4 : size === "lg" ? 8 : 6;
  const paddingX = size === "sm" ? 8 : size === "lg" ? 14 : 10;

  const bgColor = selected || variant === "primary"
    ? "#0066FF"
    : variant === "subtle"
      ? "rgba(128,128,128,0.08)"
      : variant === "outlined"
        ? "transparent"
        : "rgba(128,128,128,0.12)";

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      className={cn(
        "flex-row items-center rounded-full",
        variant === "outlined" && "border border-[rgba(128,128,128,0.3)]",
        className,
      )}
      style={{
        paddingVertical: paddingY,
        paddingHorizontal: paddingX,
        backgroundColor: bgColor,
      }}
    >
      <ChipContent {...props} />
    </Component>
  );
}

export const ChipToggle = Chip;
export default Chip;
