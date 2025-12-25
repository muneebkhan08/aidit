import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

// Types
export interface ImageInfo {
    uri: string;
    width: number;
    height: number;
    fileSize?: number;
    mimeType: string;
}

export interface PreprocessOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: PreprocessOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    format: 'jpeg',
};

/**
 * Image Preprocessor for optimizing images before AI processing
 */
export const imagePreprocessor = {
    /**
     * Resize and compress image for optimal API transmission
     */
    async preprocess(
        uri: string,
        options: PreprocessOptions = {}
    ): Promise<ImageInfo> {
        const opts = { ...DEFAULT_OPTIONS, ...options };

        try {
            // Get original image info
            const info = await FileSystem.getInfoAsync(uri);

            // Manipulate image
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [
                    {
                        resize: {
                            width: opts.maxWidth,
                            height: opts.maxHeight,
                        },
                    },
                ],
                {
                    compress: opts.quality,
                    format: opts.format === 'png'
                        ? ImageManipulator.SaveFormat.PNG
                        : ImageManipulator.SaveFormat.JPEG,
                }
            );

            return {
                uri: result.uri,
                width: result.width,
                height: result.height,
                fileSize: info.exists && 'size' in info ? info.size : undefined,
                mimeType: opts.format === 'png' ? 'image/png' : 'image/jpeg',
            };
        } catch (error) {
            throw new Error(`Failed to preprocess image: ${error}`);
        }
    },

    /**
     * Crop image to specific region
     */
    async crop(
        uri: string,
        region: { x: number; y: number; width: number; height: number }
    ): Promise<ImageInfo> {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ crop: { originX: region.x, originY: region.y, width: region.width, height: region.height } }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );

            return {
                uri: result.uri,
                width: result.width,
                height: result.height,
                mimeType: 'image/jpeg',
            };
        } catch (error) {
            throw new Error(`Failed to crop image: ${error}`);
        }
    },

    /**
     * Rotate image by degrees
     */
    async rotate(uri: string, degrees: 90 | 180 | 270): Promise<ImageInfo> {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ rotate: degrees }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );

            return {
                uri: result.uri,
                width: result.width,
                height: result.height,
                mimeType: 'image/jpeg',
            };
        } catch (error) {
            throw new Error(`Failed to rotate image: ${error}`);
        }
    },

    /**
     * Flip image horizontally or vertically
     */
    async flip(
        uri: string,
        direction: 'horizontal' | 'vertical'
    ): Promise<ImageInfo> {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{
                    flip: direction === 'horizontal'
                        ? ImageManipulator.FlipType.Horizontal
                        : ImageManipulator.FlipType.Vertical
                }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );

            return {
                uri: result.uri,
                width: result.width,
                height: result.height,
                mimeType: 'image/jpeg',
            };
        } catch (error) {
            throw new Error(`Failed to flip image: ${error}`);
        }
    },

    /**
     * Create thumbnail for preview
     */
    async createThumbnail(uri: string, size = 200): Promise<ImageInfo> {
        return this.preprocess(uri, {
            maxWidth: size,
            maxHeight: size,
            quality: 0.7,
            format: 'jpeg',
        });
    },

    /**
     * Prepare image for Gemini API (optimal size and format)
     */
    async prepareForGemini(uri: string): Promise<ImageInfo> {
        // Gemini works best with images around 1024px
        return this.preprocess(uri, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.9,
            format: 'jpeg',
        });
    },

    /**
     * Get image dimensions without processing
     */
    async getDimensions(uri: string): Promise<{ width: number; height: number }> {
        const result = await ImageManipulator.manipulateAsync(uri, [], {});
        return { width: result.width, height: result.height };
    },
};
