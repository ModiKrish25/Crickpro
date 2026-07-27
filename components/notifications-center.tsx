/**
 * Notifications Center - Home screen notification widget
 * 
 * Displays a list of recent notifications with categories:
 * - Match alerts (scores, milestones)
 * - Tournament updates (fixtures, results)
 * - Team invitations
 * - Achievement unlocks
 * 
 * Design: Premium glassmorphism with notification cards grouped by type
 */
import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import * as Haptics from "expo-haptics";

export interface AppNotification {
  id: string;
  type: "match" | "tournament" | "team" | "achievement" | "invite" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionable?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

interface NotificationsCenterProps {
  notifications: AppNotification[];
  maxDisplay?: number;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  showInHome?: boolean;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  match: "🏏",
  tournament: "🏆",
  team: "👥",
  achievement: "⭐",
  invite: "📨",
  system: "🔔",
};

export function NotificationsCenter({
  notifications,
  maxDisplay = 5,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  showInHome = false,
}: NotificationsCenterProps) {
  const [expanded, setExpanded] = useState(false);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length,
  [notifications]);

  const displayed = useMemo(() => {
    const items = expanded ? notifications : notifications.slice(0, maxDisplay);
    return items.sort((a, b) => {
      if (a.isRead === b.isRead) return 0;
      return a.isRead ? 1 : -1;
    });
  }, [notifications, expanded, maxDisplay]);

  const handleAction = async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  };

  if (showInHome && notifications.length === 0) return null;

  return (
    <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-white/10 dark:border-white/[0.06]">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-foreground tracking-tight">🔔 Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-[#FF3B30] rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
              <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
            </View>
          )}
        </View>
        <View className="flex-row gap-2">
          {unreadCount > 0 && onMarkAllRead && (
            <TouchableOpacity
              className="bg-[#0066FF]/10 rounded-full px-3 py-1"
              onPress={() => handleAction(() => onMarkAllRead?.())}
            >
              <Text className="text-[10px] font-semibold text-[#0066FF]">Mark all read</Text>
            </TouchableOpacity>
          )}
          {onViewAll && (
            <TouchableOpacity
              className="bg-white/50 dark:bg-white/[0.08] rounded-full px-3 py-1"
              onPress={() => handleAction(() => onViewAll?.())}
            >
              <Text className="text-[10px] font-semibold text-foreground">View all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <View className="py-8 items-center gap-2">
          <Text className="text-2xl">🔔</Text>
          <Text className="text-sm font-semibold text-muted">No notifications</Text>
          <Text className="text-xs text-muted">You&apos;re all caught up!</Text>
        </View>
      ) : (
        <>
          {/* Notification list */}
          {displayed.map((notif, idx) => {
            const icon = notif.icon || NOTIFICATION_ICONS[notif.type] || "🔔";
            return (
              <TouchableOpacity
                key={notif.id}
                className={`px-4 py-3 flex-row items-start gap-3 ${
                  idx < displayed.length - 1 ? "border-b border-white/10 dark:border-white/[0.06]" : ""
                } ${notif.isRead ? "opacity-60" : ""}`}
                onPress={() => handleAction(() => onMarkRead?.(notif.id))}
              >
                <View className={`w-9 h-9 rounded-full items-center justify-center ${
                  notif.type === "match" ? "bg-[#34C759]/10" :
                  notif.type === "tournament" ? "bg-[#5E5CE6]/10" :
                  notif.type === "team" ? "bg-[#FF9F0A]/10" :
                  notif.type === "achievement" ? "bg-[#FFD60A]/10" :
                  notif.type === "invite" ? "bg-[#0066FF]/10" :
                  "bg-white/30 dark:bg-white/[0.06]"
                }`}>
                  <Text className="text-base">{icon}</Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-xs font-bold text-foreground">{notif.title}</Text>
                  <Text className="text-[11px] text-muted leading-4" numberOfLines={2}>{notif.message}</Text>
                  <Text className="text-[9px] text-muted/60 mt-0.5">{notif.timestamp}</Text>
                </View>
                {!notif.isRead && (
                  <View className="w-2 h-2 rounded-full bg-[#0066FF] mt-1.5" />
                )}
                {notif.actionable && notif.actionLabel && (
                  <TouchableOpacity
                    className="bg-[#0066FF] rounded-lg px-3 py-1.5 self-center"
                    onPress={() => handleAction(() => notif.onAction?.())}
                  >
                    <Text className="text-[10px] font-bold text-white">{notif.actionLabel}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Show more / less */}
          {notifications.length > maxDisplay && (
            <TouchableOpacity
              className="py-3 items-center border-t border-white/10 dark:border-white/[0.06]"
              onPress={() => handleAction(() => setExpanded(!expanded))}
            >
              <Text className="text-[11px] font-semibold text-[#0066FF]">
                {expanded ? "Show less" : `Show all ${notifications.length} notifications`}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </GlassCard>
  );
}

export default NotificationsCenter;
