/**
 * Toast — Temporary notification popup for success, error, info messages.
 *
 * Design: Glass frosted card sliding in from top, auto-dismiss.
 * Global toast manager via useToast() hook.
 */
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
  showWithAction: (message: string, action: { label: string; onPress: () => void }, type?: ToastType, duration?: number) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: "rgba(52,199,89,0.15)", icon: "✅", border: "rgba(52,199,89,0.3)" },
  error: { bg: "rgba(255,59,48,0.15)", icon: "❌", border: "rgba(255,59,48,0.3)" },
  info: { bg: "rgba(0,102,255,0.15)", icon: "ℹ️", border: "rgba(0,102,255,0.3)" },
  warning: { bg: "rgba(255,159,10,0.15)", icon: "⚠️", border: "rgba(255,159,10,0.3)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 250, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => setCurrent(null), 300);
  }, []);

  const show = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = `${Date.now()}_${Math.random()}`;
    setCurrent({ id, message, type, duration });
    translateY.value = withSequence(
      withTiming(-100, { duration: 0 }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
    );
    opacity.value = withTiming(1, { duration: 300 });
    setTimeout(() => dismiss(), duration);
  }, [dismiss]);

  const showWithAction = useCallback(
    (message: string, action: { label: string; onPress: () => void }, type: ToastType = "info", duration = 5000) => {
      const id = `${Date.now()}_${Math.random()}`;
      setCurrent({ id, message, type, duration, action });
      translateY.value = withSequence(
        withTiming(-100, { duration: 0 }),
        withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
      );
      opacity.value = withTiming(1, { duration: 300 });
      setTimeout(() => dismiss(), duration);
    },
    [dismiss],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const ctx: ToastContextValue = { show, showWithAction, dismiss };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {current && (
        <Animated.View
          className="absolute left-4 right-4 z-[9999]"
          style={[
            animatedStyle,
            { top: insets.top + 8 },
          ]}
          pointerEvents="box-none"
        >
          <View
            className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 border"
            style={{
              backgroundColor: Platform.OS === "web"
                ? `${TYPE_STYLES[current.type].bg}`
                : TYPE_STYLES[current.type].bg,
              borderColor: TYPE_STYLES[current.type].border,
              ...(Platform.OS === "web"
                ? {
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  }
                : {}),
            }}
          >
            <Text style={{ fontSize: 16 }}>{TYPE_STYLES[current.type].icon}</Text>
            <Text className="flex-1 text-sm font-medium text-foreground">
              {current.message}
            </Text>
            {current.action && (
              <TouchableOpacity
                onPress={() => {
                  current.action?.onPress();
                  dismiss();
                }}
                className="bg-[#0066FF]/20 rounded-lg px-3 py-1.5"
              >
                <Text className="text-xs font-bold text-[#0066FF]">
                  {current.action.label}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={dismiss} hitSlop={8}>
              <Text className="text-muted text-lg font-bold">×</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export default ToastProvider;
