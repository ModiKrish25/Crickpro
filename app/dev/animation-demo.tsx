import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { BoundaryCelebration } from "@/components/animations/boundary-celebration";
import { WicketAnimation } from "@/components/animations/wicket-animation";
import { ConfettiBurst } from "@/components/animations/confetti-burst";

/**
 * Animation Demo Screen
 * Showcases all animations available in the app
 */
export default function AnimationDemoScreen() {
  const [showBoundary4, setShowBoundary4] = useState(false);
  const [showBoundary6, setShowBoundary6] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">Animation Demo</Text>
            <Text className="text-base text-muted">Test all visual animations</Text>
          </View>

          {/* Boundary 4 Demo */}
          <View className="bg-surface rounded-xl p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground">Boundary (4 Runs)</Text>
            <Text className="text-sm text-muted">Green celebration with upward motion</Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center active:opacity-80"
              onPress={() => setShowBoundary4(true)}
            >
              <Text className="text-background font-semibold">Trigger Animation</Text>
            </TouchableOpacity>
            {showBoundary4 && (
              <BoundaryCelebration
                runs={4}
                onAnimationComplete={() => setShowBoundary4(false)}
              />
            )}
          </View>

          {/* Boundary 6 Demo */}
          <View className="bg-surface rounded-xl p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground">Boundary (6 Runs)</Text>
            <Text className="text-sm text-muted">Orange celebration with confetti burst</Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center active:opacity-80"
              onPress={() => setShowBoundary6(true)}
            >
              <Text className="text-background font-semibold">Trigger Animation</Text>
            </TouchableOpacity>
            {showBoundary6 && (
              <>
                <BoundaryCelebration
                  runs={6}
                  onAnimationComplete={() => setShowBoundary6(false)}
                />
                <ConfettiBurst isVisible={true} color="#FFD700" />
              </>
            )}
          </View>

          {/* Wicket Demo */}
          <View className="bg-surface rounded-xl p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground">Wicket</Text>
            <Text className="text-sm text-muted">Red alert with rotation and shake effect</Text>
            <TouchableOpacity
              className="bg-error rounded-lg py-3 items-center active:opacity-80"
              onPress={() => setShowWicket(true)}
            >
              <Text className="text-background font-semibold">Trigger Animation</Text>
            </TouchableOpacity>
            {showWicket && (
              <WicketAnimation
                playerName="Rohit Sharma"
                dismissalType="Bowled by Bumrah"
                onAnimationComplete={() => setShowWicket(false)}
              />
            )}
          </View>

          {/* Confetti Demo */}
          <View className="bg-surface rounded-xl p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground">Confetti Burst</Text>
            <Text className="text-sm text-muted">Golden particles floating upward</Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center active:opacity-80"
              onPress={() => setShowConfetti(true)}
            >
              <Text className="text-background font-semibold">Trigger Animation</Text>
            </TouchableOpacity>
            {showConfetti && (
              <ConfettiBurst
                isVisible={true}
                color="#FFD700"
              />
            )}
          </View>

          {/* Animation Info */}
          <View className="bg-surface rounded-xl p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground">Animation Details</Text>
            <View className="gap-2">
              <Text className="text-sm text-muted">
                <Text className="font-semibold text-foreground">Boundary (4):</Text> Green badge, scales up to 1.2x, fades out after 1.5s
              </Text>
              <Text className="text-sm text-muted">
                <Text className="font-semibold text-foreground">Boundary (6):</Text> Orange badge with gold confetti particles
              </Text>
              <Text className="text-sm text-muted">
                <Text className="font-semibold text-foreground">Wicket:</Text> Red alert with rotation shake and slide effect
              </Text>
              <Text className="text-sm text-muted">
                <Text className="font-semibold text-foreground">Confetti:</Text> 12 particles burst outward and fade
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
