/**
 * GridRow — Responsive grid row that distributes children in columns.
 *
 * Design: Flex-wrap row with configurable column count and gap.
 * Adapts to screen width for responsive layouts.
 */
import { View } from "react-native";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/use-responsive";

interface GridRowProps {
  /** Number of columns */
  columns?: number;
  /** Gap between items */
  gap?: number;
  /** Whether items should have equal flex */
  equal?: boolean;
  /** Additional class names */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function GridRow({
  columns = 2,
  gap = 10,
  equal = true,
  className,
  children,
}: GridRowProps) {
  const r = useResponsive();
  const cols = r.isPhone ? Math.min(columns, 2) : columns;

  return (
    <View
      className={cn("flex-row flex-wrap", className)}
      style={{ gap, margin: -gap / 2 }}
    >
      {children}
    </View>
  );
}

/**
 * GridItem — Individual item within a GridRow.
 * Wraps each child to enforce column width.
 */
interface GridItemProps {
  /** Total columns in the parent grid */
  columns?: number;
  /** Additional class names */
  className?: string;
  children: React.ReactNode;
}

export function GridItem({ columns = 2, className, children }: GridItemProps) {
  return (
    <View
      className={cn(className)}
      style={{ width: `${100 / columns}%` }}
    >
      {children}
    </View>
  );
}

export default GridRow;
