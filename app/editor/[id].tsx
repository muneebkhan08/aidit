import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    useWindowDimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    FadeIn,
    FadeInDown,
    SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { AIGlow } from '@/src/components/ui/AIGlow';
import { useEditorStore, AITool } from '@/src/stores/editor-store';
import { geminiClient, PROMPTS } from '@/src/services/gemini';
import { imagePreprocessor } from '@/src/services/image/preprocessor';
import { imageCache } from '@/src/services/cache/image-cache';
import {
    Colors,
    Gradients,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
} from '@/src/constants/design-tokens';



// AI Tools configuration
const AI_TOOLS: {
    id: AITool;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    gradient: [string, string];
}[] = [
        { id: 'auto-enhance', icon: 'sparkles-outline', label: 'Enhance', gradient: Gradients.primary },
        { id: 'background-removal', icon: 'cut-outline', label: 'Remove BG', gradient: Gradients.gold },
        { id: 'object-removal', icon: 'close-circle-outline', label: 'Remove', gradient: Gradients.primary },
        { id: 'portrait-enhance', icon: 'person-outline', label: 'Portrait', gradient: Gradients.gold },
        { id: 'meet', icon: 'people-outline', label: 'Meet', gradient: Gradients.primary },
        { id: 'animate', icon: 'play-circle-outline', label: 'Animate', gradient: Gradients.gold },
        { id: 'smart-crop', icon: 'crop-outline', label: 'Crop', gradient: Gradients.primary },
    ];

export default function EditorScreen() {
    const insets = useSafeAreaInsets();
    const [compareMode, setCompareMode] = useState(false);
    const [savingStatus, setSavingStatus] = useState<null | 'saving' | 'saved'>(null);

    const {
        currentSession,
        isProcessing,
        processingMessage,
        selectedTool,
        setTool,
        setProcessing,
        applyEdit,
        undo,
        redo,
        canUndo,
        canRedo,
        endSession,
    } = useEditorStore();

    // Gesture values
    const imageScale = useSharedValue(1);
    const imageTranslateX = useSharedValue(0);
    const imageTranslateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Double tap to reset
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            imageScale.value = withSpring(1);
            imageTranslateX.value = withSpring(0);
            imageTranslateY.value = withSpring(0);
            savedScale.value = 1;
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        });

    // Pinch to zoom
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            imageScale.value = Math.min(Math.max(savedScale.value * e.scale, 0.5), 5);
        })
        .onEnd(() => {
            savedScale.value = imageScale.value;
            if (imageScale.value < 1) {
                imageScale.value = withSpring(1);
                savedScale.value = 1;
            }
        });

    // Pan to move
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (imageScale.value > 1) {
                imageTranslateX.value = savedTranslateX.value + e.translationX;
                imageTranslateY.value = savedTranslateY.value + e.translationY;
            }
        })
        .onEnd(() => {
            savedTranslateX.value = imageTranslateX.value;
            savedTranslateY.value = imageTranslateY.value;
        });

    const composedGesture = Gesture.Simultaneous(
        Gesture.Race(doubleTap, pinchGesture),
        panGesture
    );

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: imageScale.value },
            { translateX: imageTranslateX.value },
            { translateY: imageTranslateY.value },
        ],
    }));

    // Handle AI tool selection
    const handleToolPress = async (tool: AITool) => {
        if (isProcessing || !currentSession) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTool(tool);

        // Process with AI
        await processWithAI(tool);
    };

    const processWithAI = async (tool: AITool) => {
        if (!currentSession) return;

        setProcessing(true, `Applying ${tool.replace('-', ' ')}...`);

        try {
            // Initialize Gemini if needed
            if (!geminiClient.isReady()) {
                geminiClient.initialize();
            }

            // Prepare image for Gemini
            const prepared = await imagePreprocessor.prepareForGemini(currentSession.currentUri);

            let response;

            switch (tool) {
                case 'auto-enhance':
                    response = await geminiClient.analyzeImageJSON(
                        prepared.uri,
                        PROMPTS.AUTO_ENHANCE.analyze,
                        PROMPTS.AUTO_ENHANCE.system
                    );
                    break;

                case 'background-removal':
                    response = await geminiClient.analyzeImage(
                        prepared.uri,
                        PROMPTS.BACKGROUND_REMOVAL.detect,
                        PROMPTS.BACKGROUND_REMOVAL.system
                    );
                    break;

                case 'object-removal':
                    response = await geminiClient.analyzeImage(
                        prepared.uri,
                        PROMPTS.OBJECT_REMOVAL.analyze,
                        PROMPTS.OBJECT_REMOVAL.system
                    );
                    break;

                case 'portrait-enhance':
                    response = await geminiClient.analyzeImageJSON(
                        prepared.uri,
                        PROMPTS.PORTRAIT_ENHANCE.analyze,
                        PROMPTS.PORTRAIT_ENHANCE.system
                    );
                    break;

                case 'meet':
                    response = await geminiClient.analyzeImage(
                        prepared.uri,
                        PROMPTS.PERSON_INSERTION.analyze_scene,
                        PROMPTS.PERSON_INSERTION.system
                    );
                    break;

                case 'animate':
                    response = await geminiClient.analyzeImageJSON(
                        prepared.uri,
                        PROMPTS.IMAGE_ANIMATION.analyze,
                        PROMPTS.IMAGE_ANIMATION.system
                    );
                    break;

                case 'smart-crop':
                    response = await geminiClient.analyzeImageJSON(
                        prepared.uri,
                        PROMPTS.SMART_CROP.analyze('1:1'),
                        PROMPTS.SMART_CROP.system
                    );
                    break;

                default:
                    response = await geminiClient.analyzeImage(
                        prepared.uri,
                        PROMPTS.ANALYZE_IMAGE.general,
                        PROMPTS.ANALYZE_IMAGE.system
                    );
            }

            if (response.success) {
                // For demo, cache the current image and show success
                // In production, you would process the AI response and apply edits
                const cachedUri = await imageCache.cacheImage(currentSession.currentUri, tool);
                applyEdit(cachedUri, tool);

                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'AI Analysis Complete',
                    `${tool.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} analysis:\n\n${typeof response.data === 'string'
                        ? response.data.substring(0, 300)
                        : JSON.stringify(response.data, null, 2).substring(0, 300)
                    }...`
                );
            } else {
                throw new Error(response.error || 'AI processing failed');
            }
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'AI Processing Error',
                error instanceof Error ? error.message : 'Failed to process image'
            );
        } finally {
            setProcessing(false);
            setTool(null);
        }
    };

    const handleSave = async () => {
        if (!currentSession) return;

        setSavingStatus('saving');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Request permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant access to save photos');
                setSavingStatus(null);
                return;
            }

            // Save to library
            await MediaLibrary.saveToLibraryAsync(currentSession.currentUri);

            // Also save to app storage
            await imageCache.saveEdit(currentSession.currentUri);

            setSavingStatus('saved');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setTimeout(() => setSavingStatus(null), 2000);
        } catch (error) {
            Alert.alert('Save Failed', 'Could not save image to library');
            setSavingStatus(null);
        }
    };

    const handleClose = () => {
        endSession();
        router.back();
    };

    if (!currentSession) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>No image selected</Text>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View
                entering={FadeIn.duration(300)}
                style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
            >
                <Pressable onPress={handleClose} style={styles.headerButton}>
                    <GlassCard style={styles.headerButtonInner}>
                        <Ionicons name="close" size={24} color={Colors.primary.white} />
                    </GlassCard>
                </Pressable>

                <View style={styles.headerActions}>
                    {/* Undo/Redo */}
                    <Pressable
                        onPress={undo}
                        disabled={!canUndo() || isProcessing}
                        style={[styles.headerButton, !canUndo() && styles.disabled]}
                    >
                        <Ionicons
                            name="arrow-undo"
                            size={22}
                            color={canUndo() ? Colors.primary.white : Colors.primary.muted}
                        />
                    </Pressable>

                    <Pressable
                        onPress={redo}
                        disabled={!canRedo() || isProcessing}
                        style={[styles.headerButton, !canRedo() && styles.disabled]}
                    >
                        <Ionicons
                            name="arrow-redo"
                            size={22}
                            color={canRedo() ? Colors.primary.white : Colors.primary.muted}
                        />
                    </Pressable>

                    {/* Compare */}
                    <Pressable
                        onPress={() => setCompareMode(!compareMode)}
                        style={styles.headerButton}
                    >
                        <Ionicons
                            name="git-compare"
                            size={22}
                            color={compareMode ? Colors.accent.primary : Colors.primary.white}
                        />
                    </Pressable>

                    {/* Save */}
                    <Pressable onPress={handleSave} disabled={isProcessing} style={styles.saveButton}>
                        <LinearGradient
                            colors={Gradients.primary}
                            style={styles.saveButtonGradient}
                        >
                            {savingStatus === 'saving' ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : savingStatus === 'saved' ? (
                                <Ionicons name="checkmark" size={20} color="white" />
                            ) : (
                                <Ionicons name="download" size={20} color="white" />
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Image Preview */}
            <View style={styles.imageContainer}>
                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
                        <AIGlow active={isProcessing} intensity="high">
                            <Image
                                source={{ uri: currentSession.currentUri }}
                                style={styles.image}
                                contentFit="contain"
                            />
                        </AIGlow>
                    </Animated.View>
                </GestureDetector>

                {/* Processing overlay */}
                {isProcessing && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        style={styles.processingOverlay}
                    >
                        <GlassCard style={styles.processingCard}>
                            <ActivityIndicator size="large" color={Colors.accent.primary} />
                            <Text style={styles.processingText}>{processingMessage}</Text>
                        </GlassCard>
                    </Animated.View>
                )}
            </View>

            {/* AI Tools Dock */}
            <Animated.View
                entering={FadeInDown.duration(400).delay(200)}
                style={[styles.toolsDock, { paddingBottom: insets.bottom + Spacing.md }]}
            >
                <GlassCard style={styles.toolsDockInner}>
                    <Animated.ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.toolsScroll}
                    >
                        {AI_TOOLS.map((tool, index) => (
                            <Animated.View
                                key={tool.id}
                                entering={SlideInRight.duration(300).delay(index * 50)}
                            >
                                <ToolButton
                                    tool={tool}
                                    selected={selectedTool === tool.id}
                                    disabled={isProcessing}
                                    onPress={() => handleToolPress(tool.id)}
                                />
                            </Animated.View>
                        ))}
                    </Animated.ScrollView>
                </GlassCard>
            </Animated.View>
        </View>
    );
}

interface ToolButtonProps {
    tool: typeof AI_TOOLS[number];
    selected: boolean;
    disabled: boolean;
    onPress: () => void;
}

function ToolButton({ tool, selected, disabled, onPress }: ToolButtonProps) {
    const { width } = useWindowDimensions();
    const isSmall = width < 380;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                onPressIn={() => {
                    scale.value = withSpring(0.92);
                }}
                onPressOut={() => {
                    scale.value = withSpring(1);
                }}
                onPress={onPress}
                disabled={disabled}
                style={[styles.toolButton, disabled && styles.disabled]}
            >
                <LinearGradient
                    colors={
                        selected
                            ? tool.gradient
                            : ['transparent', 'transparent'] as [string, string]
                    }
                    style={[
                        styles.toolButtonGradient,
                        isSmall && { width: 44, height: 44 },
                        selected && styles.toolButtonSelected
                    ]}
                >
                    <Ionicons
                        name={tool.icon}
                        size={22}
                        color={selected ? Colors.primary.black : Colors.primary.light}
                    />
                </LinearGradient>
                <Text
                    style={[styles.toolButtonLabel, selected && styles.toolButtonLabelSelected]}
                >
                    {tool.label}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.black,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: Colors.primary.white,
        fontSize: Typography.fontSize.lg,
        marginBottom: Spacing.md,
    },
    backLink: {
        color: Colors.accent.primary,
        fontSize: Typography.fontSize.base,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonInner: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BorderRadius.md,
        padding: 0,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    disabled: {
        opacity: 0.4,
    },
    saveButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Image
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },

    // Processing
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    processingCard: {
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    processingText: {
        fontSize: Typography.fontSize.base,
        color: Colors.primary.white,
        fontWeight: '500',
    },

    // Tools dock
    toolsDock: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
    },
    toolsDockInner: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    toolsScroll: {
        gap: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    toolButton: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    toolButtonGradient: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface.cardSolid,
        borderWidth: 1,
        borderColor: Colors.surface.border,
    },
    toolButtonSelected: {
        ...Shadows.glow,
        borderColor: Colors.accent.primary,
    },
    toolButtonLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.primary.muted,
        fontWeight: '500',
    },
    toolButtonLabelSelected: {
        color: Colors.accent.primary,
    },
});
