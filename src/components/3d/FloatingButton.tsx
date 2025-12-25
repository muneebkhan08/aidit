import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
    Layout,
    Animation,
} from '@/src/constants/design-tokens';

interface FloatingButtonProps {
    icon: React.ReactNode;
    label?: string;
    onPress: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    gradient: [string, string];
    disabled?: boolean;
}

export function FloatingButton({
    icon,
    label,
    onPress,
    size = 'lg',
    gradient,
    disabled = false,
}: FloatingButtonProps) {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    const buttonSize = Layout.floatingButton[size];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, Animation.spring.snappy);
        translateY.value = withSpring(2, Animation.spring.snappy);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, Animation.spring.snappy);
        translateY.value = withSpring(0, Animation.spring.snappy);
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={disabled}
                style={[disabled && styles.disabled]}
            >
                <View style={[styles.buttonWrapper, { width: buttonSize, height: buttonSize }]}>
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.button,
                            {
                                width: buttonSize,
                                height: buttonSize,
                                borderRadius: BorderRadius.xl,
                            },
                        ]}
                    >
                        {icon}
                    </LinearGradient>
                </View>

                {label && (
                    <Text style={styles.label}>{label}</Text>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    buttonWrapper: {
        borderRadius: BorderRadius.xl,
        ...Shadows.glow,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        marginTop: Spacing.sm,
        fontSize: Typography.fontSize.sm,
        fontWeight: '500',
        color: Colors.primary.light,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});
