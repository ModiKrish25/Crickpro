/**
 * FormField — Wrapper for form inputs with label, error, and helper text.
 *
 * Design: Consistent field layout with label, optional helper/error text,
 * and required asterisk. Wraps any child input component.
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  /** Label text above the input */
  label?: string;
  /** Error message (shows in red below input) */
  error?: string;
  /** Helper text (shows in muted below input, hidden when error is present) */
  helper?: string;
  /** Mark field as required (shows red asterisk) */
  required?: boolean;
  /** Additional class names */
  className?: string;
  /** Children (the input component) */
  children?: React.ReactNode;
}

export function FormField({
  label,
  error,
  helper,
  required = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <View className={cn("gap-1.5", className)}>
      {label && (
        <Text className="text-sm font-semibold text-foreground">
          {label}
          {required && <Text className="text-[#FF3B30] ml-0.5"> *</Text>}
        </Text>
      )}
      {children}
      {error ? (
        <Text className="text-xs text-[#FF3B30] px-1">{error}</Text>
      ) : helper ? (
        <Text className="text-xs text-muted px-1">{helper}</Text>
      ) : null}
    </View>
  );
}

export default FormField;
