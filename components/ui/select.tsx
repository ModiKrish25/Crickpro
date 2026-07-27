/**
 * Select — Dropdown/picker for choosing from a list of options.
 *
 * Design: Glass trigger that opens a bottom sheet or inline list.
 * Supports search filtering when many options.
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export interface SelectOption {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface SelectProps {
  /** Array of options */
  options: SelectOption[];
  /** Currently selected option ID */
  value?: string;
  /** Called when an option is selected */
  onSelect: (option: SelectOption) => void;
  /** Placeholder text when nothing selected */
  placeholder?: string;
  /** Label above the select */
  label?: string;
  /** Error message */
  error?: string;
  /** Enable search filtering */
  searchable?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

export function Select({
  options,
  value,
  onSelect,
  placeholder = "Select...",
  label,
  error,
  searchable = false,
  size = "md",
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOption = options.find((o) => o.id === value);

  const filtered = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const height = size === "sm" ? 36 : size === "lg" ? 52 : 44;
  const fontSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  return (
    <View className={cn("gap-1", className)}>
      {label && (
        <Text className="text-sm font-semibold text-foreground mb-0.5">{label}</Text>
      )}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={cn(
          "flex-row items-center rounded-xl px-3 border",
          error
            ? "border-[#FF3B30]"
            : "border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/[0.05]",
        )}
        style={{ height }}
      >
        {selectedOption?.icon && (
          <Text className="mr-2" style={{ fontSize }}>{selectedOption.icon}</Text>
        )}
        <Text
          className={cn(
            "flex-1",
            selectedOption ? "text-foreground" : "text-muted",
          )}
          style={{ fontSize }}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text className="text-muted ml-2" style={{ fontSize: 10 }}>▼</Text>
      </TouchableOpacity>

      {error && (
        <Text className="text-xs text-[#FF3B30] px-1">{error}</Text>
      )}

      {/* Dropdown modal */}
      {open && (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <TouchableOpacity
            className="flex-1 justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <GlassCard
                intensity="high"
                padding="md"
                radius="xl"
                className="max-h-[60%]"
                blurAmount={30}
              >
                {searchable && (
                  <View className="px-2 pb-2">
                    <TextInput
                      className="text-sm text-foreground bg-white/30 dark:bg-white/[0.05] rounded-xl px-3 py-2.5 border border-white/30 dark:border-white/10"
                      placeholder="Search..."
                      placeholderTextColor="rgba(128,128,128,0.6)"
                      value={search}
                      onChangeText={setSearch}
                      autoFocus
                    />
                  </View>
                )}
                <ScrollView className="max-h-80">
                  {filtered.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      disabled={opt.disabled}
                      className={cn(
                        "flex-row items-center gap-2 px-3 py-3 rounded-xl",
                        opt.id === value && "bg-[#0066FF]/10",
                        opt.disabled && "opacity-40",
                      )}
                      onPress={() => {
                        onSelect(opt);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      {opt.icon && <Text className="text-base">{opt.icon}</Text>}
                      <Text
                        className={cn(
                          "flex-1 text-sm font-medium",
                          opt.id === value ? "text-[#0066FF]" : "text-foreground",
                        )}
                      >
                        {opt.label}
                      </Text>
                      {opt.id === value && (
                        <Text className="text-[#0066FF] font-bold">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {filtered.length === 0 && (
                    <View className="py-8 items-center">
                      <Text className="text-sm text-muted">No options found</Text>
                    </View>
                  )}
                </ScrollView>
              </GlassCard>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

export default Select;
