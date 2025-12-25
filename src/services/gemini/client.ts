import {
    GoogleGenerativeAI,
    GenerativeModel,
    HarmCategory,
    HarmBlockThreshold,
} from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// Types
export interface GeminiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    rawText?: string;
}

export interface ImageInput {
    uri: string;
    mimeType?: string;
}

// Configuration
const GEMINI_CONFIG = {
    model: 'gemini-2.0-flash-exp', // Latest multimodal model
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000,
};

// Safety settings for image processing
const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

class GeminiClient {
    private client: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private visionModel: GenerativeModel | null = null;

    /**
     * Initialize the Gemini client with API key from environment
     */
    initialize(): boolean {
        const apiKey = Constants.expoConfig?.extra?.geminiApiKey
            || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            console.warn('Gemini API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in .env');
            return false;
        }

        try {
            this.client = new GoogleGenerativeAI(apiKey);

            // Text-only model
            this.model = this.client.getGenerativeModel({
                model: 'gemini-2.0-flash-exp',
                safetySettings: SAFETY_SETTINGS,
            });

            // Vision model for image processing
            this.visionModel = this.client.getGenerativeModel({
                model: 'gemini-2.0-flash-exp',
                safetySettings: SAFETY_SETTINGS,
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize Gemini client:', error);
            return false;
        }
    }

    /**
     * Check if client is ready
     */
    isReady(): boolean {
        return this.visionModel !== null;
    }

    /**
     * Convert local image URI to base64 for Gemini API
     */
    private async imageToBase64(uri: string): Promise<string> {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            return base64;
        } catch (error) {
            throw new Error(`Failed to read image: ${error}`);
        }
    }

    /**
     * Get MIME type from URI
     */
    private getMimeType(uri: string): string {
        const extension = uri.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        };
        return mimeTypes[extension || ''] || 'image/jpeg';
    }

    /**
     * Send a text-only prompt to Gemini
     */
    async generateText(prompt: string): Promise<GeminiResponse<string>> {
        if (!this.model) {
            return { success: false, error: 'Client not initialized' };
        }

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            return {
                success: true,
                data: text,
                rawText: text,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send image + prompt to Gemini Vision
     */
    async analyzeImage(
        imageUri: string,
        prompt: string,
        systemPrompt?: string
    ): Promise<GeminiResponse<string>> {
        if (!this.visionModel) {
            return { success: false, error: 'Client not initialized' };
        }

        try {
            const base64Data = await this.imageToBase64(imageUri);
            const mimeType = this.getMimeType(imageUri);

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType,
                },
            };

            const textPart = {
                text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
            };

            const result = await this.visionModel.generateContent([imagePart, textPart]);
            const response = result.response;
            const text = response.text();

            return {
                success: true,
                data: text,
                rawText: text,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Analyze image and parse JSON response
     */
    async analyzeImageJSON<T>(
        imageUri: string,
        prompt: string,
        systemPrompt?: string
    ): Promise<GeminiResponse<T>> {
        const response = await this.analyzeImage(imageUri, prompt, systemPrompt);

        if (!response.success || !response.data) {
            return { success: false, error: response.error };
        }

        try {
            // Extract JSON from response (may be wrapped in markdown code blocks)
            let jsonStr = response.data;

            // Remove markdown code blocks if present
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            const parsed = JSON.parse(jsonStr.trim()) as T;
            return {
                success: true,
                data: parsed,
                rawText: response.rawText,
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to parse JSON response: ${error}`,
                rawText: response.rawText,
            };
        }
    }

    /**
     * Process multiple images together (for compositing)
     */
    async processMultipleImages(
        images: ImageInput[],
        prompt: string,
        systemPrompt?: string
    ): Promise<GeminiResponse<string>> {
        if (!this.visionModel) {
            return { success: false, error: 'Client not initialized' };
        }

        try {
            const imageParts = await Promise.all(
                images.map(async (img) => {
                    const base64Data = await this.imageToBase64(img.uri);
                    return {
                        inlineData: {
                            data: base64Data,
                            mimeType: img.mimeType || this.getMimeType(img.uri),
                        },
                    };
                })
            );

            const textPart = {
                text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
            };

            const result = await this.visionModel.generateContent([
                ...imageParts,
                textPart,
            ]);

            const response = result.response;
            const text = response.text();

            return {
                success: true,
                data: text,
                rawText: text,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Generate image edit instructions with retry logic
     */
    async generateWithRetry<T>(
        operation: () => Promise<GeminiResponse<T>>,
        maxRetries = GEMINI_CONFIG.maxRetries
    ): Promise<GeminiResponse<T>> {
        let lastError: string | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const result = await operation();

            if (result.success) {
                return result;
            }

            lastError = result.error;

            // Wait before retry with exponential backoff
            if (attempt < maxRetries - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, GEMINI_CONFIG.retryDelay * Math.pow(2, attempt))
                );
            }
        }

        return {
            success: false,
            error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
        };
    }
}

// Singleton instance
export const geminiClient = new GeminiClient();

// Initialize on import
geminiClient.initialize();
