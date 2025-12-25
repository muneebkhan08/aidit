/**
 * Aidit Design System - Professional Dark Theme
 * Inspired by Lightroom, VSCO, and premium editing tools
 * Mature, minimal, and sophisticated aesthetic
 */

export const Colors = {
    // Primary palette - Deep dark theme
    primary: {
        black: '#0A0A0B',
        darkest: '#111113',
        darker: '#18181B',
        dark: '#27272A',
        medium: '#3F3F46',
        muted: '#52525B',
        light: '#A1A1AA',
        lighter: '#D4D4D8',
        white: '#FAFAFA',
    },

    // Accent - Subtle warm gold/amber for premium feel
    accent: {
        primary: '#D4A574',      // Warm gold
        secondary: '#E8C9A0',    // Light gold
        muted: '#A67C52',        // Muted gold
        highlight: '#F5DEB3',    // Highlight gold
    },

    // Functional colors
    functional: {
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
    },

    // AI processing indicator
    ai: {
        processing: '#D4A574',
        glow: 'rgba(212, 165, 116, 0.3)',
        pulse: 'rgba(212, 165, 116, 0.15)',
    },

    // Surface colors
    surface: {
        card: 'rgba(39, 39, 42, 0.8)',
        cardSolid: '#27272A',
        overlay: 'rgba(10, 10, 11, 0.9)',
        border: 'rgba(63, 63, 70, 0.5)',
        borderLight: 'rgba(161, 161, 170, 0.1)',
    },
} as const;

// Gradient definitions - Subtle and professional
export const Gradients: {
    primary: [string, string];
    accent: [string, string];
    surface: [string, string];
    overlay: [string, string];
    gold: [string, string];
    dark: [string, string];
} = {
    primary: ['#D4A574', '#A67C52'],
    accent: ['#E8C9A0', '#D4A574'],
    surface: ['rgba(39, 39, 42, 0.9)', 'rgba(24, 24, 27, 0.95)'],
    overlay: ['rgba(10, 10, 11, 0.0)', 'rgba(10, 10, 11, 0.95)'],
    gold: ['#D4A574', '#C9956A'],
    dark: ['#18181B', '#0A0A0B'],
};

export const Typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semiBold: 'System',
        bold: 'System',
    },
    fontSize: {
        xs: 11,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 22,
        '2xl': 28,
        '3xl': 34,
        '4xl': 42,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
    letterSpacing: {
        tighter: -0.8,
        tight: -0.4,
        normal: 0,
        wide: 0.4,
        wider: 1.2,
    },
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
    '6xl': 80,
} as const;

export const BorderRadius = {
    none: 0,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
} as const;

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
    },
    // Accent glow for buttons
    glow: {
        shadowColor: Colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;

export const Animation = {
    duration: {
        instant: 100,
        fast: 150,
        normal: 250,
        slow: 400,
        slower: 600,
    },
    spring: {
        gentle: { damping: 20, stiffness: 120 },
        snappy: { damping: 15, stiffness: 200 },
        bouncy: { damping: 10, stiffness: 180 },
    },
} as const;

export const Layout = {
    headerHeight: 56,
    tabBarHeight: 72,
    bottomDockHeight: 88,
    editorToolbarHeight: 60,
    maxContentWidth: 500,
    floatingButton: {
        sm: 40,
        md: 48,
        lg: 56,
        xl: 72,
    },
} as const;
