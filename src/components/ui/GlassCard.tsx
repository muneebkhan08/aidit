import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows, Animation } from '@/src/constants/design-tokens';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
    glowing?: boolean;
    glowColor?: string;
}

export function GlassCard({
    children,
    style,
    elevated = false,
    glowing = false,
    glowColor = Colors.accent.primary,
}: GlassCardProps) {
    const glowOpacity = useSharedValue(glowing ? 0.4 : 0);

    React.useEffect(() => {
        if (glowing) {
            glowOpacity.value = withSpring(0.6, Animation.spring.gentle);
        } else {
            glowOpacity.value = withTiming(0, { duration: Animation.duration.normal });
        }
    }, [glowing]);

    const glowStyle = useAnimatedStyle(() => ({
        shadowColor: glowColor,
        shadowOpacity: glowOpacity.value,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
    }));

    return (
        <Animated.View
            style={[
                styles.container,
                elevated && Shadows.lg,
                glowing && glowStyle,
                style,
            ]}
        >
            <View style={styles.content}>
                {children}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.surface.border,
        backgroundColor: Colors.surface.card,
    },
    content: {
        flex: 1,
    },
});
