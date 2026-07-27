/**
 * Sign In Screen — Premium Cricket Auth with Clerk Integration
 *
 * Design: Cinematic dark theme, glassmorphism cards, smooth micro-interactions
 * Auth Methods: Clerk Social Auth (Google, GitHub, Apple), Email/Password, Phone OTP
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import PhoneOtpInput from "@/components/phone-otp-input";
import Svg, { Circle, Path, Defs, RadialGradient, LinearGradient, Stop, Ellipse } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { useResponsive } from "@/hooks/use-responsive";
import {
  CLERK_PUBLISHABLE_KEY,
  IS_CLERK_CONFIGURED,
  CLERK_SOCIAL_PROVIDERS,
  type ClerkProviderType,
} from "@/constants/clerk";

// ─── Cricket Ball Hero Illustration ─────────────────────────────────────────

function CricketBallHero() {
  return (
    <View style={{ alignItems: "center", marginBottom: 8 }}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="ballGrad" cx="38%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#FF4444" />
            <Stop offset="50%" stopColor="#CC0000" />
            <Stop offset="100%" stopColor="#7A0000" />
          </RadialGradient>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF2222" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#CC0000" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="seamGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Circle cx={60} cy={60} r={56} fill="url(#glowGrad)" />
        <Circle cx={60} cy={60} r={46} fill="url(#ballGrad)" />
        <Ellipse cx={44} cy={42} rx={14} ry={10} fill="#FFFFFF" opacity={0.18} />
        <Path d="M60 16 Q80 38 80 60 Q80 82 60 104" stroke="url(#seamGrad)" strokeWidth={2.5} fill="none" />
        <Path d="M60 16 Q40 38 40 60 Q40 82 60 104" stroke="url(#seamGrad)" strokeWidth={2.5} fill="none" />
        <Path d="M42 40 Q38 42 44 44" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M40 50 Q36 52 42 54" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M40 60 Q36 62 42 64" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M42 70 Q38 72 44 74" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M78 40 Q82 42 76 44" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M80 50 Q84 52 78 54" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M80 60 Q84 62 78 64" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
        <Path d="M78 70 Q82 72 76 74" stroke="#FFFFFF" strokeWidth={1.2} fill="none" opacity={0.7} />
      </Svg>
    </View>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────

interface InputFieldProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
  showToggle?: boolean;
  onToggle?: () => void;
  isDark: boolean;
}

function InputField({
  icon, placeholder, value, onChangeText,
  secureTextEntry, keyboardType = "default", autoCapitalize = "none",
  showToggle, onToggle, isDark,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? "#22C55E"
    : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const bgColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const textColor = isDark ? "#F5F5F7" : "#1A1A1A";
  const placeholderColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: bgColor,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "ios" ? 14 : 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 18, marginRight: 10 }}>{icon}</Text>
      <TextInput
        style={{
          flex: 1,
          fontSize: 15,
          color: textColor,
          fontWeight: "500",
          outline: "none",
        } as any}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 16, opacity: 0.6 }}>{secureTextEntry ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(239,68,68,0.12)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.35)",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 15 }}>⚠️</Text>
      <Text style={{ flex: 1, fontSize: 13, color: "#EF4444", fontWeight: "500" }}>{message}</Text>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider({ isDark, label = "OR CLERK AUTH" }: { isDark: boolean; label?: string }) {
  const lineColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const textColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
      <Text style={{ marginHorizontal: 12, fontSize: 11, color: textColor, fontWeight: "700", letterSpacing: 0.8 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
    </View>
  );
}

// ─── Tab Selector ─────────────────────────────────────────────────────────────

type Tab = "signin" | "signup" | "phone";

function TabBar({ active, onChange, isDark }: { active: Tab; onChange: (t: Tab) => void; isDark: boolean }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "signin", label: "Sign In", icon: "🔑" },
    { id: "signup", label: "Sign Up", icon: "✨" },
    { id: "phone", label: "Phone", icon: "📱" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        borderRadius: 14,
        padding: 4,
        marginBottom: 24,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderRadius: 11,
              gap: 5,
              backgroundColor: isActive
                ? isDark ? "rgba(34,197,94,0.18)" : "rgba(34,197,94,0.12)"
                : "transparent",
              borderWidth: isActive ? 1 : 0,
              borderColor: isActive ? "rgba(34,197,94,0.35)" : "transparent",
            }}
          >
            <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: isActive ? "700" : "500",
                color: isActive ? "#22C55E" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Clerk Authentication Component ───────────────────────────────────────────

interface ClerkAuthSectionProps {
  isDark: boolean;
  onClerkSignIn: (provider: ClerkProviderType) => void;
  isSubmitting: boolean;
}

function ClerkAuthSection({ isDark, onClerkSignIn, isSubmitting }: ClerkAuthSectionProps) {
  return (
    <View>
      <Divider isDark={isDark} label="OR CONTINUE WITH CLERK" />

      {/* Clerk Security Badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.06)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.18)",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginBottom: 14,
          gap: 6,
        }}
      >
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: "#6366F1",
          }}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: isDark ? "#A5B4FC" : "#4F46E5",
            letterSpacing: 0.5,
          }}
        >
          🔒 SECURED BY CLERK AUTHENTICATION
        </Text>
      </View>

      {/* Social Provider Buttons */}
      <View style={{ gap: 10 }}>
        {CLERK_SOCIAL_PROVIDERS.map((prov) => (
          <TouchableOpacity
            key={prov.id}
            onPress={() => onClerkSignIn(prov.id)}
            disabled={isSubmitting}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 16,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>{prov.icon}</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#F5F5F7" : "#1A1A1A",
              }}
            >
              Continue with {prov.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const router = useRouter();
  const { login, loading, phoneSendOtp, phoneVerifyOtp, emailLogin, emailRegister } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const r = useResponsive();
  const isDark = colorScheme === "dark";

  const [tab, setTab] = useState<Tab>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sign in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPw, setSiShowPw] = useState(false);

  // Sign up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suShowPw, setSuShowPw] = useState(false);

  const bg = isDark ? "#080C10" : "#F4F6F9";

  const navigateAfterAuth = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  const handleSignIn = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError("");
    if (!siEmail.trim()) { setError("Please enter your email address"); return; }
    if (!siPassword) { setError("Please enter your password"); return; }
    setIsSubmitting(true);
    try {
      const result = await emailLogin(siEmail.trim(), siPassword);
      if (result.success) {
        navigateAfterAuth();
      } else {
        setError(result.error || "Invalid email or password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError("");
    if (!suName.trim() || suName.trim().length < 2) { setError("Please enter your full name (min 2 characters)"); return; }
    if (!suEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) { setError("Please enter a valid email address"); return; }
    if (!suPassword || suPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setIsSubmitting(true);
    try {
      const result = await emailRegister(suName.trim(), suEmail.trim(), suPassword);
      if (result.success) {
        navigateAfterAuth();
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClerkSignIn = async (provider: ClerkProviderType) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");
    setIsSubmitting(true);
    try {
      // Execute Clerk authentication flow (fallback to context login / auth session)
      await login();
      navigateAfterAuth();
    } catch {
      setError(`Clerk ${provider} sign-in failed. Please try another method.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSendOtp = useCallback(async (phone: string) => {
    return phoneSendOtp(phone);
  }, [phoneSendOtp]);

  const handlePhoneVerifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await phoneVerifyOtp(phone, code);
    if (result.success) navigateAfterAuth();
    return result;
  }, [phoneVerifyOtp, navigateAfterAuth]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setError("");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bg }}
      edges={["top", "left", "right"]}
    >
      {/* Ambient background glow */}
      {isDark && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: [
              "radial-gradient(ellipse 80% 40% at 20% -10%, rgba(34,197,94,0.07) 0%, transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 80% 10%, rgba(0,102,255,0.05) 0%, transparent 60%)",
            ].join(", "),
          } as any}
        />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero Section ── */}
          <View style={{ alignItems: "center", paddingTop: 40, paddingBottom: 16, paddingHorizontal: 24 }}>
            {/* Logo Card */}
            <GlassCard
              intensity="high"
              glowColor="#22C55E"
              padding="none"
              radius="full"
              glowAccents={false}
              depth={false}
              style={{
                width: 88,
                height: 88,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                shadowColor: "#22C55E",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.45 : 0.25,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              <CricketBallHero />
            </GlassCard>

            {/* Title */}
            <Text
              style={{
                fontSize: r.isPhone ? 36 : 46,
                fontWeight: "800",
                color: isDark ? "#F5F5F7" : "#111111",
                letterSpacing: -1.2,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              CrickPro
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
                textAlign: "center",
                letterSpacing: 0.3,
                lineHeight: 20,
                maxWidth: 260,
              }}
            >
              Professional cricket scoring &{"\n"}tournament management
            </Text>
          </View>

          {/* ── Auth Card ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <GlassCard
              intensity="high"
              glowColor={isDark ? "#22C55E" : "#16A34A"}
              padding="lg"
              radius="xl"
              glowAccents={false}
              depth={false}
              style={{
                shadowColor: "#22C55E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.2 : 0.08,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              {/* Tab Bar */}
              <TabBar active={tab} onChange={handleTabChange} isDark={isDark} />

              {/* Error Message */}
              {error ? <ErrorBanner message={error} /> : null}

              {/* ── Sign In Form ── */}
              {tab === "signin" && (
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: isDark ? "#F5F5F7" : "#111", marginBottom: 16 }}>
                    Welcome back 👋
                  </Text>
                  <InputField
                    icon="📧"
                    placeholder="Email address"
                    value={siEmail}
                    onChangeText={setSiEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    isDark={isDark}
                  />
                  <InputField
                    icon="🔒"
                    placeholder="Password"
                    value={siPassword}
                    onChangeText={setSiPassword}
                    secureTextEntry={!siShowPw}
                    showToggle
                    onToggle={() => setSiShowPw(!siShowPw)}
                    isDark={isDark}
                  />

                  {/* Sign In Button */}
                  <TouchableOpacity
                    onPress={handleSignIn}
                    disabled={isSubmitting || loading}
                    style={{
                      backgroundColor: isSubmitting ? "rgba(34,197,94,0.5)" : "#22C55E",
                      borderRadius: 14,
                      paddingVertical: 15,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 4,
                      shadowColor: "#22C55E",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ fontSize: 16 }}>🏏</Text>
                    )}
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 }}>
                      {isSubmitting ? "Signing in…" : "Sign In"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleTabChange("signup")}
                    style={{ marginTop: 14, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                      No account?{" "}
                      <Text style={{ color: "#22C55E", fontWeight: "700" }}>Create one →</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Sign Up Form ── */}
              {tab === "signup" && (
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: isDark ? "#F5F5F7" : "#111", marginBottom: 16 }}>
                    Join CrickPro ✨
                  </Text>
                  <InputField
                    icon="👤"
                    placeholder="Full name"
                    value={suName}
                    onChangeText={setSuName}
                    autoCapitalize="words"
                    isDark={isDark}
                  />
                  <InputField
                    icon="📧"
                    placeholder="Email address"
                    value={suEmail}
                    onChangeText={setSuEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    isDark={isDark}
                  />
                  <InputField
                    icon="🔒"
                    placeholder="Password (min 6 characters)"
                    value={suPassword}
                    onChangeText={setSuPassword}
                    secureTextEntry={!suShowPw}
                    showToggle
                    onToggle={() => setSuShowPw(!suShowPw)}
                    isDark={isDark}
                  />

                  {/* Create Account Button */}
                  <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={isSubmitting || loading}
                    style={{
                      backgroundColor: isSubmitting ? "rgba(34,197,94,0.5)" : "#22C55E",
                      borderRadius: 14,
                      paddingVertical: 15,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 4,
                      shadowColor: "#22C55E",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ fontSize: 16 }}>🏆</Text>
                    )}
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 }}>
                      {isSubmitting ? "Creating account…" : "Create Account"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleTabChange("signin")}
                    style={{ marginTop: 14, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                      Already have an account?{" "}
                      <Text style={{ color: "#22C55E", fontWeight: "700" }}>Sign in →</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Phone OTP Form ── */}
              {tab === "phone" && (
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: isDark ? "#F5F5F7" : "#111", marginBottom: 16 }}>
                    Phone Sign In 📱
                  </Text>
                  <PhoneOtpInput
                    onSendOtp={handlePhoneSendOtp}
                    onVerifyOtp={handlePhoneVerifyOtp}
                    isLoading={isSubmitting}
                    isDark={isDark}
                  />
                </View>
              )}

              {/* ── Clerk Authentication Section ── */}
              {(tab === "signin" || tab === "signup") && (
                <ClerkAuthSection
                  isDark={isDark}
                  onClerkSignIn={handleClerkSignIn}
                  isSubmitting={isSubmitting}
                />
              )}
            </GlassCard>
          </View>

          {/* ── Features Quick Peek ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { icon: "🏏", label: "Ball-by-Ball\nScoring" },
                { icon: "📊", label: "Career\nStats" },
                { icon: "🏆", label: "Leagues &\nTournaments" },
                { icon: "🤝", label: "Team\nManagement" },
              ].map((feat) => (
                <GlassCard
                  key={feat.label}
                  intensity="subtle"
                  padding="sm"
                  radius="lg"
                  glowAccents={false}
                  depth={false}
                  highlight={false}
                  style={{ flex: 1, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{feat.icon}</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
                      textAlign: "center",
                      lineHeight: 13,
                    }}
                  >
                    {feat.label}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* ── Footer ── */}
          <Text
            style={{
              fontSize: 11,
              color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)",
              textAlign: "center",
              marginTop: 24,
              paddingHorizontal: 32,
              lineHeight: 16,
            }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
