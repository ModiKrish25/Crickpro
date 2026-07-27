/**
 * Phone OTP Input Component
 *
 * Premium glass-styled two-step phone authentication:
 * Step 1: Enter phone number, tap "Send Code"
 * Step 2: Enter 6-digit OTP from SMS
 *
 * Features:
 * - Glass card with blur background
 * - Country code selector (+1 default)
 * - Phone number formatting (xxx) xxx-xxxx
 * - 6-digit OTP input with auto-advance
 * - Resend timer (30s countdown)
 * - Loading states for send/verify
 * - Error and validation feedback
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { GlassInput } from "@/components/ui/glass-input";
import * as Haptics from "expo-haptics";

// ─── Types ───

export type OtpStage = "phone" | "otp";

interface PhoneOtpInputProps {
  /** Called when the user wants to send an OTP */
  onSendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  /** Called when the user enters the 6-digit code */
  onVerifyOtp: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  /** Current loading state from parent */
  isLoading?: boolean;
  /** Error message from parent */
  error?: string | null;
  /** Dark mode */
  isDark?: boolean;
}

// ─── Constants ───

const RESEND_COOLDOWN = 30; // seconds
const OTP_LENGTH = 6;

// ─── Helpers ───

function formatPhoneNumber(text: string): string {
  const cleaned = text.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

function unformatPhoneNumber(display: string): string {
  return `+1${display.replace(/\D/g, "")}`;
}

// ─── Component ───

export default function PhoneOtpInput({
  onSendOtp,
  onVerifyOtp,
  isLoading = false,
  error: externalError,
  isDark = false,
}: PhoneOtpInputProps) {
  // Step management
  const [stage, setStage] = useState<OtpStage>("phone");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [otpCode, setOtpCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Refs for OTP digit inputs
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Clear error when stage changes or inputs change
  useEffect(() => {
    setInternalError(null);
  }, [stage, phoneDisplay, otpCode]);

  // ─── Phone Step ───

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setPhoneRaw(`+1${digits}`);
    setPhoneDisplay(formatPhoneNumber(digits));
  };

  const isPhoneValid = phoneRaw.length === 12; // +1 + 10 digits

  const handleSendOtp = async () => {
    if (!isPhoneValid || isSending) return;
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsSending(true);
    setInternalError(null);

    try {
      const result = await onSendOtp(phoneRaw);
      if (result.success) {
        setStage("otp");
        setResendTimer(RESEND_COOLDOWN);
        // Focus first OTP input after a moment
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setInternalError(result.error || "Failed to send code");
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      setInternalError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await onSendOtp(phoneRaw);
      setResendTimer(RESEND_COOLDOWN);
      setOtpCode(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (err) {
      setInternalError("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  // ─── OTP Step ───

  const handleOtpDigitChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const newCode = [...otpCode];
    newCode[index] = digit;
    setOtpCode(newCode);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (digits.length === 0) return;
    const newCode = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < digits.length; i++) {
      newCode[i] = digits[i];
    }
    setOtpCode(newCode);
    // Focus the next empty or last input
    const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const isOtpComplete = otpCode.every((d) => d !== "");

  const handleVerifyOtp = async () => {
    if (!isOtpComplete || isVerifying) return;
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsVerifying(true);
    setInternalError(null);

    try {
      const code = otpCode.join("");
      const result = await onVerifyOtp(phoneRaw, code);
      if (result.success) {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setInternalError(result.error || "Invalid code");
        // Shake animation — just clear and refocus first input
        setOtpCode(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 200);
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      setInternalError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Go Back ───

  const handleGoBack = () => {
    setStage("phone");
    setOtpCode(Array(OTP_LENGTH).fill(""));
    setInternalError(null);
  };

  // ─── Render ───

  const displayError = externalError || internalError;

  return (
    <GlassCard
      intensity="high"
      glowColor="#0066FF"
      padding="lg"
      radius="xl"
      gradientBorder
      glowAccents={false}
      depth={false}
    >
      <LiquidGlassOverlay color="#0066FF" variant="sheen" speed={0.8} intensity={0.3} />

      {stage === "phone" ? (
        /* ─── STEP 1: Phone Number ─── */
        <View className="gap-6">
          {/* Header */}
          <View className="items-center">
            <View className="w-14 h-14 rounded-full bg-[#0066FF]/10 items-center justify-center mb-3">
              <Text className="text-2xl">📱</Text>
            </View>
            <Text className="text-lg font-bold text-foreground text-center tracking-tight">
              Sign in with Phone
            </Text>
            <Text className="text-sm text-muted text-center mt-1.5 leading-5">
              Enter your phone number to receive a verification code
            </Text>
          </View>

          {/* Phone Input */}
          <View className="flex-row items-center gap-3">
            {/* Country Code Badge */}
            <View className="bg-[#0066FF]/10 rounded-xl px-3.5 py-3.5">
              <Text className="text-sm font-bold text-[#0066FF]">🇺🇸 +1</Text>
            </View>

            {/* Number Input */}
            <View className="flex-1 relative">
              <View
                className="rounded-xl border border-border/20 overflow-hidden"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                }}
              >
                <TextInput
                  className="text-foreground text-lg font-semibold px-4 py-3.5 tracking-wider"
                  placeholder="(555) 123-4567"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                  value={phoneDisplay}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={14}
                  autoFocus
                  returnKeyType="go"
                  onSubmitEditing={handleSendOtp}
                />
              </View>
            </View>
          </View>

          {/* Error */}
          {displayError && (
            <View className="bg-red-500/10 rounded-xl px-4 py-3">
              <Text className="text-xs font-medium text-red-500 text-center">
                {displayError}
              </Text>
            </View>
          )}

          {/* Send Button */}
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              isPhoneValid && !isSending
                ? "bg-[#0066FF]"
                : "bg-[#0066FF]/30"
            }`}
            onPress={handleSendOtp}
            disabled={!isPhoneValid || isSending}
            style={
              isPhoneValid && !isSending
                ? {
                    shadowColor: "#0066FF",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  }
                : {}
            }
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold text-base">Send Verification Code</Text>
            )}
          </TouchableOpacity>

          <Text className="text-[11px] text-muted text-center leading-4">
            Standard SMS rates may apply. We&apos;ll send a one-time code to verify your number.
          </Text>
        </View>
      ) : (
        /* ─── STEP 2: OTP Code ─── */
        <View className="gap-6">
          {/* Header */}
          <View className="items-center">
            <View className="w-14 h-14 rounded-full bg-[#34C759]/10 items-center justify-center mb-3">
              <Text className="text-2xl">✉️</Text>
            </View>
            <Text className="text-lg font-bold text-foreground text-center tracking-tight">
              Enter verification code
            </Text>
            <Text className="text-sm text-muted text-center mt-1.5">
              Sent to{" "}
              <Text className="font-semibold text-foreground">
                {phoneDisplay}
              </Text>
            </Text>
            <TouchableOpacity onPress={handleGoBack} className="mt-1">
              <Text className="text-xs font-medium text-[#0066FF]">Change number</Text>
            </TouchableOpacity>
          </View>

          {/* OTP Digit Boxes */}
          <View className="flex-row gap-2.5 justify-center">
            {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => { inputRefs.current[idx] = ref; }}
                className={`w-12 h-14 rounded-xl text-center text-lg font-bold text-foreground
                  border ${otpCode[idx] ? "border-[#0066FF]" : "border-border/20"}`}
                style={{
                  backgroundColor: otpCode[idx]
                    ? isDark
                      ? "rgba(0,102,255,0.12)"
                      : "rgba(0,102,255,0.08)"
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                }}
                value={otpCode[idx]}
                onChangeText={(text) => handleOtpDigitChange(text, idx)}
                onKeyPress={({ nativeEvent }) =>
                  handleOtpKeyPress(nativeEvent.key, idx)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Paste hint (web only) */}
          {Platform.OS === "web" && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  handleOtpPaste(text);
                } catch {}
              }}
              className="items-center"
            >
              <Text className="text-xs text-muted">Paste from clipboard</Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {displayError && (
            <View className="bg-red-500/10 rounded-xl px-4 py-3">
              <Text className="text-xs font-medium text-red-500 text-center">
                {displayError}
              </Text>
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              isOtpComplete && !isVerifying
                ? "bg-[#0066FF]"
                : "bg-[#0066FF]/30"
            }`}
            onPress={handleVerifyOtp}
            disabled={!isOtpComplete || isVerifying}
            style={
              isOtpComplete && !isVerifying
                ? {
                    shadowColor: "#0066FF",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  }
                : {}
            }
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold text-base">Verify & Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-xs text-muted">Didn&apos;t get a code?</Text>
            {resendTimer > 0 ? (
              <Text className="text-xs font-semibold text-muted">
                Resend in {resendTimer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#0066FF" />
                ) : (
                  <Text className="text-xs font-semibold text-[#0066FF]">Resend code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );
}
