import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Alert,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useEditorStore } from '@/src/stores/editor-store';
import { imagePreprocessor } from '@/src/services/image/preprocessor';
import {
    Colors,
    Gradients,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
} from '@/src/constants/design-tokens';

type CameraFacing = 'front' | 'back';

export default function CreateScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isSmallScreen = width < 380;
    const params = useLocalSearchParams<{ mode?: string }>();

    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraFacing>('back');
    const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
    const [isCapturing, setIsCapturing] = useState(false);

    const cameraRef = useRef<CameraView>(null);
    const startSession = useEditorStore((state) => state.startSession);

    const captureScale = useSharedValue(1);
    const flashOpacity = useSharedValue(0);

    React.useEffect(() => {
        if (params.mode === 'gallery') {
            pickImage();
        }
    }, [params.mode]);

    const captureButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: captureScale.value }],
    }));

    const flashOverlayStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 1,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets[0]) {
                await processAndNavigate(result.assets[0].uri);
            } else if (params.mode === 'gallery') {
                router.back();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const takePhoto = async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        captureScale.value = withSequence(
            withSpring(0.9),
            withSpring(1.1),
            withSpring(1)
        );

        flashOpacity.value = withSequence(
            withSpring(1, { damping: 20 }),
            withSpring(0)
        );

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.9,
                skipProcessing: false,
            });

            if (photo?.uri) {
                // Save to media library (only on native platforms, skip on Expo Go if permission fails)
                if (Platform.OS !== 'web') {
                    try {
                        const { status } = await MediaLibrary.requestPermissionsAsync(false);
                        if (status === 'granted') {
                            await MediaLibrary.saveToLibraryAsync(photo.uri);
                        } else if (status === 'denied') {
                            // User denied permission - show one-time message
                            Alert.alert(
                                'Photo Not Saved',
                                'Enable photo library access in Settings to automatically save captured photos.',
                                [{ text: 'OK' }]
                            );
                        }
                    } catch {
                        // Expo Go doesn't support full MediaLibrary - silently skip
                        // Photos will still be available for editing, just not saved to gallery
                    }
                }

                await processAndNavigate(photo.uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to capture photo');
        } finally {
            setIsCapturing(false);
        }
    };

    const processAndNavigate = async (uri: string) => {
        try {
            const processed = await imagePreprocessor.preprocess(uri, {
                maxWidth: 2048,
                maxHeight: 2048,
                quality: 0.95,
            });

            startSession(processed.uri);
            router.push('/editor/current' as any);
        } catch (error) {
            Alert.alert('Error', 'Failed to process image');
        }
    };

    const toggleFacing = () => {
        setFacing((f) => (f === 'back' ? 'front' : 'back'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const toggleFlash = () => {
        setFlashMode((f) => (f === 'off' ? 'on' : 'off'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered]}>
                <View style={styles.permissionCard}>
                    <View style={styles.permissionIcon}>
                        <Ionicons name="camera-outline" size={32} color={Colors.accent.primary} />
                    </View>
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        Allow camera access to capture photos for AI-powered editing
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.permissionButton,
                            pressed && { opacity: 0.8 }
                        ]}
                        onPress={requestPermission}
                    >
                        <LinearGradient
                            colors={Gradients.primary}
                            style={styles.permissionButtonGradient}
                        >
                            <Text style={styles.permissionButtonText}>Allow Access</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                flash={flashMode}
            >
                <Animated.View
                    style={[styles.flashOverlay, flashOverlayStyle]}
                    pointerEvents="none"
                />

                {/* Top Bar */}
                <Animated.View
                    entering={FadeIn.duration(300)}
                    style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.topButton, pressed && styles.buttonPressed]}
                    >
                        <Ionicons name="close" size={24} color={Colors.primary.white} />
                    </Pressable>

                    <View style={styles.topCenter}>
                        <View style={styles.modeBadge}>
                            <View style={styles.modeIndicator} />
                            <Text style={styles.modeText}>PHOTO</Text>
                        </View>
                    </View>

                    <View style={styles.topRight}>
                        <Pressable
                            onPress={toggleFlash}
                            style={({ pressed }) => [styles.topButton, pressed && styles.buttonPressed]}
                        >
                            <Ionicons
                                name={flashMode === 'on' ? 'flash' : 'flash-off'}
                                size={20}
                                color={flashMode === 'on' ? Colors.accent.primary : Colors.primary.white}
                            />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Bottom Controls */}
                <Animated.View
                    entering={FadeIn.duration(300).delay(100)}
                    style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}
                >
                    {/* Gallery Button */}
                    <Pressable
                        onPress={pickImage}
                        style={({ pressed }) => [styles.sideButton, pressed && styles.buttonPressed]}
                    >
                        <Ionicons name="images-outline" size={24} color={Colors.primary.white} />
                    </Pressable>

                    {/* Capture Button */}
                    <Animated.View style={captureButtonStyle}>
                        <Pressable
                            onPress={takePhoto}
                            disabled={isCapturing}
                            style={({ pressed }) => [
                                styles.captureButton,
                                isSmallScreen && styles.captureButtonSmall,
                                pressed && styles.capturePressed
                            ]}
                        >
                            <View style={[
                                styles.captureOuter,
                                isSmallScreen && styles.captureOuterSmall
                            ]}>
                                <View style={[
                                    styles.captureInner,
                                    isSmallScreen && styles.captureInnerSmall
                                ]} />
                            </View>
                        </Pressable>
                    </Animated.View>

                    {/* Flip Button */}
                    <Pressable
                        onPress={toggleFacing}
                        style={({ pressed }) => [styles.sideButton, pressed && styles.buttonPressed]}
                    >
                        <Ionicons name="camera-reverse-outline" size={24} color={Colors.primary.white} />
                    </Pressable>
                </Animated.View>
            </CameraView>
        </View>
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
        padding: Spacing.xl,
    },
    camera: {
        flex: 1,
    },

    // Flash Overlay
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primary.white,
    },

    // Top Bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    topButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topCenter: {
        flex: 1,
        alignItems: 'center',
    },
    topRight: {
        width: 44,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
    },
    modeIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.functional.error,
    },
    modeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
        color: Colors.primary.white,
        letterSpacing: Typography.letterSpacing.wider,
    },
    buttonPressed: {
        opacity: 0.7,
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing['2xl'],
        gap: Spacing['3xl'],
    },
    sideButton: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        padding: 3,
        backgroundColor: Colors.primary.white,
        ...Shadows.lg,
    },
    captureButtonSmall: {
        width: 68,
        height: 68,
        borderRadius: 34,
    },
    capturePressed: {
        opacity: 0.9,
    },
    captureOuter: {
        flex: 1,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: Colors.primary.black,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureOuterSmall: {
        borderRadius: 31,
    },
    captureInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: Colors.primary.white,
    },
    captureInnerSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    // Permission Screen
    permissionCard: {
        backgroundColor: Colors.surface.cardSolid,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        alignItems: 'center',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: Colors.surface.border,
    },
    permissionIcon: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(212, 165, 116, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    permissionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: '600',
        color: Colors.primary.white,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.primary.muted,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    permissionButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        ...Shadows.glow,
    },
    permissionButtonGradient: {
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing.md,
    },
    permissionButtonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: '600',
        color: Colors.primary.black,
    },
});
