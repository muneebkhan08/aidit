import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import {
  Colors,
  BorderRadius,
  Shadows,
  Spacing,
} from '@/src/constants/design-tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.primary.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          backgroundColor: Colors.primary.darkest,
          borderTopWidth: 1,
          borderTopColor: Colors.surface.border,
          paddingTop: Spacing.sm,
          paddingBottom: Spacing.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="add" color={color} focused={focused} isCreate />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  isCreate?: boolean;
}

function TabIcon({ name, color, focused, isCreate }: TabIconProps) {
  const scale = useSharedValue(focused ? 1.05 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, { damping: 15, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isCreate) {
    return (
      <Animated.View style={[styles.createButton, animatedStyle]}>
        <View style={[styles.createButtonInner, focused && styles.createButtonFocused]}>
          <Ionicons name="add" size={24} color={focused ? Colors.primary.black : Colors.accent.primary} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  createButton: {
    marginTop: -12,
  },
  createButtonInner: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent.primary,
    ...Shadows.md,
  },
  createButtonFocused: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
});
