/**
 * ShareScorecardModal
 * Full-screen modal that previews the shareable scorecard and provides share action buttons.
 * Works cross-platform with image sharing on native and download on web.
 */
import { View, Text, TouchableOpacity, Modal, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { ScorecardShare, type ShareScorecardData } from "@/components/scorecard-share";
import { useShareScorecard } from "@/hooks/use-share-scorecard";

interface ShareScorecardModalProps {
  data: ShareScorecardData;
  onClose: () => void;
}

export function ShareScorecardModal({ data, onClose }: ShareScorecardModalProps) {
  const colors = useColors();
  const {
    scorecardRef,
    isSharing,
    shareError,
    shareAsImage,
    shareAsText,
    downloadAsImage,
  } = useShareScorecard(data);

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await shareAsImage();
  };

  const handleTextShare = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await shareAsText();
  };

  const handleDownload = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await downloadAsImage();
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-border">
          <TouchableOpacity
            className="active:opacity-70"
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onClose();
            }}
          >
            <Text className="text-primary font-semibold text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-foreground font-bold text-lg">Share Scorecard</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Scorecard Preview */}
          <View className="items-center py-6 px-4">
            <View
              ref={scorecardRef}
              collapsable={false}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <ScorecardShare data={data} />
            </View>
          </View>

          {/* Share Options */}
          <View className="px-5 gap-3">
            {/* Share as Image (primary action) */}
            <TouchableOpacity
              className="bg-accent rounded-2xl py-5 items-center active:opacity-80 flex-row justify-center gap-3"
              style={{
                shadowColor: "#22C55E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text className="text-2xl">📤</Text>
                  <View>
                    <Text className="text-background font-bold text-lg">
                      {Platform.OS === "web" ? "Download Image" : "Share as Image"}
                    </Text>
                    <Text className="text-background text-xs opacity-70">
                      {Platform.OS === "web" ? "PNG • 600×800" : "WhatsApp, Instagram, Messages"}
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Share as Text */}
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 items-center active:opacity-80 flex-row justify-center gap-2"
              onPress={handleTextShare}
              disabled={isSharing}
            >
              <Text className="text-xl">📝</Text>
              <Text className="text-background font-bold text-base">Share as Text</Text>
            </TouchableOpacity>

            {/* Download (always available) */}
            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-700 rounded-2xl py-4 items-center active:opacity-80 flex-row justify-center gap-2"
              onPress={handleDownload}
              disabled={isSharing}
            >
              <Text className="text-xl">💾</Text>
              <Text className="text-foreground font-bold text-base">Save to Device</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {shareError && (
              <View className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                <Text className="text-sm text-red-600 text-center">
                  ⚠️ {shareError}
                </Text>
              </View>
            )}

            {/* Info */}
            <View className="bg-primary/5 rounded-xl p-4 border border-primary/20 mt-2">
              <Text className="text-xs text-muted text-center leading-5">
                {Platform.OS === "web"
                  ? "The scorecard will be downloaded as a high-quality PNG image. You can then share it from your downloads folder."
                  : "Share your match result with friends on WhatsApp, Instagram, or any other app. The scorecard includes team scores, top performers, and match details."
                }
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
