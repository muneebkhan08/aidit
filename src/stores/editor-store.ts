import { create } from 'zustand';

// Types
export type AITool =
    | 'auto-enhance'
    | 'background-removal'
    | 'object-removal'
    | 'tap-edit'
    | 'portrait-enhance'
    | 'meet'
    | 'animate'
    | 'smart-crop';

export interface ImageState {
    uri: string;
    timestamp: number;
    tool?: AITool;
}

export interface EditSession {
    id: string;
    originalUri: string;
    currentUri: string;
    history: ImageState[];
    historyIndex: number;
    createdAt: number;
    updatedAt: number;
}

export interface Selection {
    type: 'brush' | 'lasso' | 'tap';
    points: { x: number; y: number }[];
    maskUri?: string;
}

interface EditorState {
    // Current session
    currentSession: EditSession | null;

    // Processing state
    isProcessing: boolean;
    processingMessage: string;

    // Tool selection
    selectedTool: AITool | null;

    // Region selection
    selection: Selection | null;

    // UI state
    showCompare: boolean;
    showHistory: boolean;

    // Recent edits
    recentEdits: EditSession[];

    // Actions
    startSession: (imageUri: string) => void;
    endSession: () => void;

    applyEdit: (newUri: string, tool: AITool) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    setTool: (tool: AITool | null) => void;
    setSelection: (selection: Selection | null) => void;

    setProcessing: (processing: boolean, message?: string) => void;

    toggleCompare: () => void;
    toggleHistory: () => void;

    addRecentEdit: (session: EditSession) => void;
    removeRecentEdit: (id: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    // Initial state
    currentSession: null,
    isProcessing: false,
    processingMessage: '',
    selectedTool: null,
    selection: null,
    showCompare: false,
    showHistory: false,
    recentEdits: [],

    // Start a new editing session
    startSession: (imageUri: string) => {
        const session: EditSession = {
            id: `session_${Date.now()}`,
            originalUri: imageUri,
            currentUri: imageUri,
            history: [{ uri: imageUri, timestamp: Date.now() }],
            historyIndex: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set({
            currentSession: session,
            selectedTool: null,
            selection: null,
            showCompare: false,
            showHistory: false,
        });
    },

    // End current session
    endSession: () => {
        const { currentSession, recentEdits } = get();

        if (currentSession && currentSession.history.length > 1) {
            // Save to recent edits
            set({
                recentEdits: [currentSession, ...recentEdits].slice(0, 20),
            });
        }

        set({
            currentSession: null,
            selectedTool: null,
            selection: null,
        });
    },

    // Apply an edit
    applyEdit: (newUri: string, tool: AITool) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const newState: ImageState = {
            uri: newUri,
            timestamp: Date.now(),
            tool,
        };

        // Truncate history after current index (remove redo stack)
        const newHistory = [
            ...currentSession.history.slice(0, currentSession.historyIndex + 1),
            newState,
        ];

        set({
            currentSession: {
                ...currentSession,
                currentUri: newUri,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                updatedAt: Date.now(),
            },
        });
    },

    // Undo
    undo: () => {
        const { currentSession } = get();
        if (!currentSession || currentSession.historyIndex <= 0) return;

        const newIndex = currentSession.historyIndex - 1;

        set({
            currentSession: {
                ...currentSession,
                currentUri: currentSession.history[newIndex].uri,
                historyIndex: newIndex,
                updatedAt: Date.now(),
            },
        });
    },

    // Redo
    redo: () => {
        const { currentSession } = get();
        if (!currentSession || currentSession.historyIndex >= currentSession.history.length - 1) return;

        const newIndex = currentSession.historyIndex + 1;

        set({
            currentSession: {
                ...currentSession,
                currentUri: currentSession.history[newIndex].uri,
                historyIndex: newIndex,
                updatedAt: Date.now(),
            },
        });
    },

    canUndo: () => {
        const { currentSession } = get();
        return currentSession !== null && currentSession.historyIndex > 0;
    },

    canRedo: () => {
        const { currentSession } = get();
        return currentSession !== null && currentSession.historyIndex < currentSession.history.length - 1;
    },

    // Tool selection
    setTool: (tool: AITool | null) => set({ selectedTool: tool }),

    // Region selection
    setSelection: (selection: Selection | null) => set({ selection }),

    // Processing state
    setProcessing: (processing: boolean, message = '') => set({
        isProcessing: processing,
        processingMessage: message,
    }),

    // UI toggles
    toggleCompare: () => set((state) => ({ showCompare: !state.showCompare })),
    toggleHistory: () => set((state) => ({ showHistory: !state.showHistory })),

    // Recent edits management
    addRecentEdit: (session: EditSession) => set((state) => ({
        recentEdits: [session, ...state.recentEdits].slice(0, 20),
    })),

    removeRecentEdit: (id: string) => set((state) => ({
        recentEdits: state.recentEdits.filter((e) => e.id !== id),
    })),
}));
