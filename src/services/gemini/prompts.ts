/**
 * Gemini Prompt Templates for AI Photo Editing Features
 * Each prompt is carefully crafted for optimal results with Gemini Vision API
 */

export const PROMPTS = {
    // AI Auto Enhancement
    AUTO_ENHANCE: {
        system: `You are an expert photo editor AI. Analyze images and provide enhancement recommendations.`,
        analyze: `Analyze this image and identify areas that need improvement:
- Lighting and exposure levels
- Color balance and saturation
- Contrast and clarity
- Noise and sharpness
- Overall composition

Provide a JSON response with enhancement parameters:
{
  "brightness": number (-100 to 100),
  "contrast": number (-100 to 100),
  "saturation": number (-100 to 100),
  "clarity": number (0 to 100),
  "denoise": number (0 to 100),
  "sharpen": number (0 to 100),
  "warmth": number (-100 to 100)
}`,
    },

    // Background Removal
    BACKGROUND_REMOVAL: {
        system: `You are an expert at image segmentation and subject detection.`,
        detect: `Analyze this image and identify the main subject(s) for background removal.

Consider:
- Primary foreground subjects (people, objects, products)
- Fine details like hair, fur, transparent objects
- Soft edges and shadows that should be preserved

Provide a description of what should be kept vs removed, including edge handling recommendations.`,
        refine: `Given this segmentation mask, suggest refinements for:
- Hair and fine detail edges
- Semi-transparent areas
- Shadow preservation
- Edge feathering amount`,
    },

    // Object Removal
    OBJECT_REMOVAL: {
        system: `You are an expert at content-aware image inpainting.`,
        analyze: `The user wants to remove the marked region from this image.

Analyze the surrounding area and describe:
1. What textures and patterns surround the region
2. What should fill the space (background type, colors, patterns)
3. How to maintain visual continuity
4. Any perspective or lighting considerations

Use this context to generate a seamless inpainted result.`,
        inpaint: `Remove the selected object from this image. 
Fill the area with surrounding background textures while:
- Maintaining perspective consistency
- Matching lighting and shadows
- Preserving texture patterns
- Ensuring seamless edge blending`,
    },

    // Region-based Editing (Tap to Edit)
    REGION_EDIT: {
        system: `You are an expert at localized image editing.`,
        modify: (instruction: string) => `Modify the selected region of this image according to: "${instruction}"

Requirements:
- Only change the selected area
- Maintain visual consistency with surrounding areas
- Match lighting, perspective, and color temperature
- Blend edges seamlessly with surrounding content`,
    },

    // Portrait Enhancement
    PORTRAIT_ENHANCE: {
        system: `You are an expert portrait retoucher. Enhance photos naturally while preserving identity.`,
        enhance: `Enhance this portrait photo naturally:

Apply subtle improvements to:
- Skin smoothing (remove blemishes, even tone) - keep texture natural
- Eye enhancement (brighten, add clarity) - minimal change
- Teeth whitening (if visible) - keep natural
- Hair detail enhancement
- Overall lighting flattering to the subject

CRITICAL: Preserve the person's unique features and identity. Avoid over-processing.`,
        analyze: `Analyze this portrait and identify enhancement opportunities:
{
  "skinQuality": "description of current state",
  "eyeCondition": "description",
  "lightingIssues": "description",
  "suggestedEnhancements": ["list", "of", "suggested", "improvements"],
  "preservationPriorities": ["features", "to", "preserve"]
}`,
    },

    // Meet Feature (Person Insertion)
    PERSON_INSERTION: {
        system: `You are an expert at realistic photo compositing.`,
        analyze_scene: `Analyze this background scene for person insertion:

Identify:
1. Camera angle and perspective
2. Light source direction and quality
3. Suggested placement areas for a person
4. Shadow direction and intensity
5. Color temperature and ambient light

Provide JSON:
{
  "perspective": "description",
  "lightDirection": "left/right/top/front/back",
  "lightQuality": "harsh/soft/diffused",
  "suggestedScale": 0.0-1.0,
  "suggestedPositionX": 0.0-1.0,
  "suggestedPositionY": 0.0-1.0,
  "colorTemperature": "warm/neutral/cool",
  "shadowIntensity": 0.0-1.0
}`,
        composite: `Insert the provided person into this scene.

Requirements:
- Match the scene's lighting direction and quality
- Apply appropriate shadows based on light source
- Adjust color temperature to match ambient light
- Scale and position naturally within the scene
- Blend edges for seamless integration
- Preserve the person's identity and natural appearance`,
    },

    // Image Animation
    IMAGE_ANIMATION: {
        system: `You are an expert at creating subtle, cinematic animations from static images.`,
        analyze: `Analyze this static image for potential animation:

Identify elements that could be animated naturally:
- Sky (clouds, sun rays)
- Water (ripples, waves)
- Foliage (leaves, grass swaying)
- Hair or clothing movement
- Ambient particles (dust, rain, snow)
- Background depth parallax

Provide JSON:
{
  "animatableElements": [
    {
      "element": "description",
      "motionType": "type of motion",
      "intensity": "subtle/moderate/pronounced",
      "direction": "description of movement",
      "loop": boolean
    }
  ],
  "parallaxLayers": ["foreground", "midground", "background"],
  "ambientEffects": ["suggestions for particles/atmosphere"],
  "duration": recommended duration in seconds
}`,
        generate: `Create motion instructions for animating this image:

Apply cinematic, subtle motion that:
- Feels natural and realistic
- Maintains the original composition
- Loops seamlessly if applicable
- Preserves subject identity
- Adds life without distraction`,
    },

    // Smart Crop
    SMART_CROP: {
        system: `You are an expert at image composition and visual hierarchy.`,
        analyze: (aspectRatio: string) => `Analyze this image for smart cropping to ${aspectRatio} aspect ratio.

Consider:
1. Main subject(s) and their positions
2. Rule of thirds alignment opportunities
3. Visual balance and negative space
4. Key elements that must be preserved
5. Distracting elements at edges that could be removed

Provide JSON:
{
  "primarySubject": { "x": 0.0-1.0, "y": 0.0-1.0, "width": 0.0-1.0, "height": 0.0-1.0 },
  "secondarySubjects": [],
  "recommendedCrop": { "x": 0.0-1.0, "y": 0.0-1.0, "width": 0.0-1.0, "height": 0.0-1.0 },
  "alternativeCrops": [],
  "preserveElements": ["list of elements to keep in frame"],
  "removeableEdgeContent": ["list of non-essential edge elements"]
}`,
    },

    // Generic Image Analysis
    ANALYZE_IMAGE: {
        system: `You are an expert image analyst.`,
        general: `Analyze this image and provide comprehensive information:

{
  "type": "photo/illustration/graphic/screenshot",
  "subjects": ["list of main subjects"],
  "scene": "description of scene/setting",
  "lighting": "description of lighting conditions",
  "mood": "emotional tone of the image",
  "quality": {
    "resolution": "high/medium/low",
    "sharpness": "sharp/soft/blurry",
    "noise": "clean/slight/noisy",
    "exposure": "proper/over/under"
  },
  "suggestedEdits": ["list of recommended improvements"]
}`,
    },
} as const;

export type PromptKey = keyof typeof PROMPTS;
