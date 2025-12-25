import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Pressable,
    Switch,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Layout,
} from '@/src/constants/design-tokens';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [autoSave, setAutoSave] = React.useState(true);
    const [haptics, setHaptics] = React.useState(true);
    const [highQuality, setHighQuality] = React.useState(true);

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
                    entering={FadeInDown.duration(400).delay(50)}
                    style={styles.header}
                >
                    <Text style={styles.title}>Settings</Text>
                </Animated.View>

                {/* General Section */}
                <Animated.View
                    entering={FadeInDown.duration(400).delay(100)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>General</Text>

                    <View style={styles.card}>
                        <SettingRow
                            icon="save-outline"
                            title="Auto-Save Edits"
                            subtitle="Automatically save edited photos"
                            trailing={
                                <Switch
                                    value={autoSave}
                                    onValueChange={setAutoSave}
                                    trackColor={{
                                        false: Colors.primary.dark,
                                        true: Colors.accent.muted
                                    }}
                                    thumbColor={autoSave ? Colors.accent.primary : Colors.primary.medium}
                                />
                            }
                        />
                        <View style={styles.divider} />
                        <SettingRow
                            icon="phone-portrait-outline"
                            title="Haptic Feedback"
                            subtitle="Vibration on interactions"
                            trailing={
                                <Switch
                                    value={haptics}
                                    onValueChange={setHaptics}
                                    trackColor={{
                                        false: Colors.primary.dark,
                                        true: Colors.accent.muted
                                    }}
                                    thumbColor={haptics ? Colors.accent.primary : Colors.primary.medium}
                                />
                            }
                        />
                        <View style={styles.divider} />
                        <SettingRow
                            icon="sparkles-outline"
                            title="High Quality Processing"
                            subtitle="Use maximum quality for AI edits"
                            trailing={
                                <Switch
                                    value={highQuality}
                                    onValueChange={setHighQuality}
                                    trackColor={{
                                        false: Colors.primary.dark,
                                        true: Colors.accent.muted
                                    }}
                                    thumbColor={highQuality ? Colors.accent.primary : Colors.primary.medium}
                                />
                            }
                        />
                    </View>
                </Animated.View>

                {/* Storage Section */}
                <Animated.View
                    entering={FadeInDown.duration(400).delay(150)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Storage</Text>

                    <View style={styles.card}>
                        <SettingRow
                            icon="folder-outline"
                            title="Cache Size"
                            subtitle="Temporary files for faster processing"
                            trailing={<Text style={styles.valueText}>24.5 MB</Text>}
                        />
                        <View style={styles.divider} />
                        <Pressable style={({ pressed }) => pressed && styles.pressed}>
                            <SettingRow
                                icon="trash-outline"
                                title="Clear Cache"
                                subtitle="Free up storage space"
                                trailing={<Ionicons name="chevron-forward" size={18} color={Colors.primary.muted} />}
                            />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* About Section */}
                <Animated.View
                    entering={FadeInDown.duration(400).delay(200)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>About</Text>

                    <View style={styles.card}>
                        <SettingRow
                            icon="information-circle-outline"
                            title="Version"
                            trailing={<Text style={styles.valueText}>1.0.0</Text>}
                        />
                        <View style={styles.divider} />
                        <Pressable
                            style={({ pressed }) => pressed && styles.pressed}
                            onPress={() => Linking.openURL('https://ai.google.dev/')}
                        >
                            <SettingRow
                                icon="logo-google"
                                title="Powered by Google Gemini"
                                subtitle="AI image analysis and processing"
                                trailing={<Ionicons name="open-outline" size={16} color={Colors.primary.muted} />}
                            />
                        </Pressable>
                        <View style={styles.divider} />
                        <Pressable style={({ pressed }) => pressed && styles.pressed}>
                            <SettingRow
                                icon="document-text-outline"
                                title="Privacy Policy"
                                trailing={<Ionicons name="chevron-forward" size={18} color={Colors.primary.muted} />}
                            />
                        </Pressable>
                        <View style={styles.divider} />
                        <Pressable style={({ pressed }) => pressed && styles.pressed}>
                            <SettingRow
                                icon="shield-checkmark-outline"
                                title="Terms of Service"
                                trailing={<Ionicons name="chevron-forward" size={18} color={Colors.primary.muted} />}
                            />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Bottom spacing */}
                <View style={{ height: Layout.tabBarHeight + Spacing['3xl'] }} />
            </ScrollView>
        </View>
    );
}

interface SettingRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    trailing?: React.ReactNode;
}

function SettingRow({ icon, title, subtitle, trailing }: SettingRowProps) {
    return (
        <View style={styles.row}>
            <View style={styles.rowIcon}>
                <Ionicons name={icon} size={20} color={Colors.accent.primary} />
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
            </View>
            {trailing && <View style={styles.rowTrailing}>{trailing}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.black,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
    },

    // Header
    header: {
        marginBottom: Spacing['2xl'],
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: '700',
        color: Colors.primary.white,
        letterSpacing: Typography.letterSpacing.tight,
    },

    // Section
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
        color: Colors.primary.muted,
        letterSpacing: Typography.letterSpacing.wider,
        textTransform: 'uppercase',
        marginBottom: Spacing.md,
        marginLeft: Spacing.xs,
    },
    card: {
        backgroundColor: Colors.surface.cardSolid,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surface.border,
        overflow: 'hidden',
    },

    // Row
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        backgroundColor: 'rgba(212, 165, 116, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    rowContent: {
        flex: 1,
    },
    rowTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: '500',
        color: Colors.primary.white,
    },
    rowSubtitle: {
        fontSize: Typography.fontSize.xs,
        color: Colors.primary.muted,
        marginTop: 2,
    },
    rowTrailing: {
        marginLeft: Spacing.md,
    },
    valueText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.primary.light,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surface.border,
        marginLeft: Spacing.md + 36 + Spacing.md,
    },
    pressed: {
        backgroundColor: Colors.primary.darker,
    },
});
