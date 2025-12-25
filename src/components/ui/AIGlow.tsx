import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { Colors, Animation } from '@/src/constants/design-tokens';

interface AIGlowProps {
    children: React.ReactNode;
    active?: boolean;
    color?: string;
    intensity?: 'low' | 'medium' | 'high';
    style?: StyleProp<ViewStyle>;
}

export function AIGlow({
    children,
    active = false,
    color = Colors.accent.primary,
    intensity = 'medium',
    style,
}: AIGlowProps) {
    const glowScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    const intensityValues = {
        low: { scaleMax: 1.02, opacity: 0.2 },
        medium: { scaleMax: 1.04, opacity: 0.35 },
        high: { scaleMax: 1.06, opacity: 0.5 },
    };

    const { scaleMax, opacity } = intensityValues[intensity];

    useEffect(() => {
        if (active) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(opacity, {
                        duration: Animation.duration.slow,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    withTiming(opacity * 0.4, {
                        duration: Animation.duration.slow,
                        easing: Easing.inOut(Easing.ease),
                    })
                ),
                -1,
                true
            );

            glowScale.value = withRepeat(
                withSequence(
                    withTiming(scaleMax, {
                        duration: Animation.duration.slower,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    withTiming(1, {
                        duration: Animation.duration.slower,
                        easing: Easing.inOut(Easing.ease),
                    })
                ),
                -1,
                true
            );
        } else {
            cancelAnimation(glowOpacity);
            cancelAnimation(glowScale);
            glowOpacity.value = withTiming(0, { duration: Animation.duration.normal });
            glowScale.value = withTiming(1, { duration: Animation.duration.normal });
        }

        return () => {
            cancelAnimation(glowOpacity);
            cancelAnimation(glowScale);
        };
    }, [active]);

    const glowStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: -16,
        left: -16,
        right: -16,
        bottom: -16,
        borderRadius: 32,
        backgroundColor: color,
        opacity: glowOpacity.value,
        transform: [{ scale: glowScale.value }],
    }));

    return (
        <View style={[styles.container, style]}>
            <Animated.View style={glowStyle} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    content: {
        zIndex: 1,
    },
});
