import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useEditorStore } from '@/src/stores/editor-store';
import {
  Colors,
  Gradients,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from '@/src/constants/design-tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const recentEdits = useEditorStore((state) => state.recentEdits);

  // Subtle pulse animation for AI indicator
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleNewProject = () => {
    router.push('/(tabs)/create' as any);
  };

  const handleOpenGallery = () => {
    router.push('/(tabs)/create?mode=gallery' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.header}
        >
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>aidit</Text>
            <Animated.View style={[styles.aiIndicator, pulseStyle]}>
              <View style={styles.aiDot} />
              <Text style={styles.aiText}>AI Ready</Text>
            </Animated.View>
          </View>
          <Text style={styles.tagline}>Professional Photo Editing</Text>
        </Animated.View>

        {/* Main Actions */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={styles.actionsSection}
        >
          <Pressable
            onPress={handleNewProject}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && styles.actionPressed
            ]}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionGradient}
            >
              <Ionicons name="camera" size={24} color={Colors.primary.black} />
              <Text style={styles.primaryActionText}>New Photo</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleOpenGallery}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && styles.actionPressed
            ]}
          >
            <Ionicons name="images-outline" size={22} color={Colors.primary.lighter} />
            <Text style={styles.secondaryActionText}>Open Gallery</Text>
          </Pressable>
        </Animated.View>

        {/* AI Tools Preview */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={styles.toolsSection}
        >
          <Text style={styles.sectionTitle}>AI Editing Tools</Text>

          <View style={styles.toolsGrid}>
            {AI_TOOLS.map((tool, index) => (
              <Animated.View
                key={tool.id}
                entering={FadeIn.duration(300).delay(350 + index * 50)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.toolCard,
                    pressed && styles.toolCardPressed
                  ]}
                >
                  <View style={[styles.toolIcon, { backgroundColor: tool.bgColor }]}>
                    <Ionicons name={tool.icon} size={20} color={Colors.accent.primary} />
                  </View>
                  <Text style={styles.toolName}>{tool.name}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Edits */}
        {recentEdits.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.recentSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Projects</Text>
              <Pressable>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentEdits.map((edit) => (
                <Pressable
                  key={edit.id}
                  onPress={() => router.push(`/editor/${edit.id}` as any)}
                  style={({ pressed }) => [
                    styles.recentCard,
                    pressed && styles.recentCardPressed
                  ]}
                >
                  <Image
                    source={{ uri: edit.currentUri }}
                    style={styles.recentImage}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={Gradients.overlay}
                    style={styles.recentOverlay}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Empty State for Recent */}
        {recentEdits.length === 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.emptyState}
          >
            <View style={styles.emptyIcon}>
              <Ionicons name="folder-open-outline" size={32} color={Colors.primary.muted} />
            </View>
            <Text style={styles.emptyTitle}>No Recent Projects</Text>
            <Text style={styles.emptyText}>
              Start by taking a photo or opening an image from your gallery
            </Text>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: Layout.tabBarHeight + Spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const AI_TOOLS = [
  { id: 'enhance', name: 'Enhance', icon: 'sparkles-outline' as const, bgColor: 'rgba(212, 165, 116, 0.1)' },
  { id: 'remove-bg', name: 'Remove BG', icon: 'cut-outline' as const, bgColor: 'rgba(212, 165, 116, 0.1)' },
  { id: 'retouch', name: 'Retouch', icon: 'brush-outline' as const, bgColor: 'rgba(212, 165, 116, 0.1)' },
  { id: 'crop', name: 'Smart Crop', icon: 'crop-outline' as const, bgColor: 'rgba(212, 165, 116, 0.1)' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },

  // Header
  header: {
    marginBottom: Spacing['3xl'],
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.primary.white,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.primary,
    marginRight: Spacing.xs,
  },
  aiText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary.muted,
    marginTop: Spacing.xs,
  },

  // Actions
  actionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  primaryAction: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  primaryActionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary.black,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface.cardSolid,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  secondaryActionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
    color: Colors.primary.lighter,
  },
  actionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Tools Section
  toolsSection: {
    marginBottom: Spacing['3xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary.white,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent.primary,
    fontWeight: '500',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  toolCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface.cardSolid,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    minWidth: 85,
  },
  toolCardPressed: {
    backgroundColor: Colors.primary.dark,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  toolName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.primary.light,
    textAlign: 'center',
  },

  // Recent Section
  recentSection: {
    marginBottom: Spacing['2xl'],
  },
  recentScroll: {
    gap: Spacing.md,
  },
  recentCard: {
    width: 140,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface.cardSolid,
  },
  recentCardPressed: {
    opacity: 0.8,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  recentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary.light,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
