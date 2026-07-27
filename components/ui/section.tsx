/**
 * Section — Screen section wrapper with title, subtitle, and optional action.
 *
 * Design: Consistent spacing with optional "View All" link.
 */
import { View, Text, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";

interface SectionProps {
  /** Section title */
  title?: string;
  /** Subtitle below title */
  subtitle?: string;
  /** Action link text (e.g. "View All") */
  action?: string;
  /** Called when action is tapped */
  onAction?: () => void;
  /** Use card-style background */
  card?: boolean;
  /** Additional class names */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function Section({
  title,
  subtitle,
  action,
  onAction,
  card = false,
  className,
  children,
}: SectionProps) {
  return (
    <View className={cn(card && "rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      {(title || action) && (
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            {title && (
              <Text className="text-lg font-bold text-foreground tracking-tight">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="text-sm text-muted mt-0.5">{subtitle}</Text>
            )}
          </View>
          {action && (
            <TouchableOpacity onPress={onAction} className="ml-2">
              <Text className="text-sm font-semibold text-[#0066FF]">{action}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {children}
    </View>
  );
}

export default Section;
