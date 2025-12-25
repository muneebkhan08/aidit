import * as FileSystem from 'expo-file-system/legacy';

// Cache directory - with fallback for null values
const CACHE_DIR = `${FileSystem.cacheDirectory || ''}aidit/`;
const EDITS_DIR = `${FileSystem.documentDirectory || ''}aidit/edits/`;

// Cache configuration
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
    uri: string;
    timestamp: number;
    size: number;
}

interface CacheIndex {
    entries: Record<string, CacheEntry>;
    totalSize: number;
}

/**
 * Image Cache Manager with LRU eviction
 */
class ImageCache {
    private index: CacheIndex = { entries: {}, totalSize: 0 };
    private initialized = false;

    /**
     * Initialize cache directories and load index
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Create directories if needed
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
            await FileSystem.makeDirectoryAsync(EDITS_DIR, { intermediates: true });

            // Load or create index
            const indexPath = `${CACHE_DIR}index.json`;
            const indexInfo = await FileSystem.getInfoAsync(indexPath);

            if (indexInfo.exists) {
                const indexData = await FileSystem.readAsStringAsync(indexPath);
                this.index = JSON.parse(indexData);
            }

            this.initialized = true;

            // Cleanup old entries
            await this.cleanup();
        } catch (error) {
            console.error('Failed to initialize cache:', error);
            this.index = { entries: {}, totalSize: 0 };
            this.initialized = true;
        }
    }

    /**
     * Save index to disk
     */
    private async saveIndex(): Promise<void> {
        const indexPath = `${CACHE_DIR}index.json`;
        await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(this.index));
    }

    /**
     * Generate cache key from source URI
     */
    private generateKey(sourceUri: string, operation?: string): string {
        const hash = sourceUri.split('/').pop()?.split('.')[0] || 'img';
        const suffix = operation ? `_${operation}` : '';
        return `${hash}${suffix}_${Date.now()}`;
    }

    /**
     * Cache an image from a source URI
     */
    async cacheImage(sourceUri: string, operation?: string): Promise<string> {
        await this.initialize();

        const key = this.generateKey(sourceUri, operation);
        const extension = sourceUri.split('.').pop() || 'jpg';
        const destUri = `${CACHE_DIR}${key}.${extension}`;

        try {
            await FileSystem.copyAsync({
                from: sourceUri,
                to: destUri,
            });

            const info = await FileSystem.getInfoAsync(destUri);
            const size = info.exists && 'size' in info ? (info as any).size : 0;

            this.index.entries[key] = {
                uri: destUri,
                timestamp: Date.now(),
                size,
            };
            this.index.totalSize += size;

            await this.saveIndex();

            // Evict if needed
            await this.evictIfNeeded();

            return destUri;
        } catch (error) {
            throw new Error(`Failed to cache image: ${error}`);
        }
    }

    /**
     * Save edited image to permanent storage
     */
    async saveEdit(sourceUri: string, name?: string): Promise<string> {
        await this.initialize();

        const timestamp = Date.now();
        const editName = name || `edit_${timestamp}`;
        const extension = sourceUri.split('.').pop() || 'jpg';
        const destUri = `${EDITS_DIR}${editName}.${extension}`;

        try {
            await FileSystem.copyAsync({
                from: sourceUri,
                to: destUri,
            });

            return destUri;
        } catch (error) {
            throw new Error(`Failed to save edit: ${error}`);
        }
    }

    /**
     * Get cached image if exists
     */
    async getCached(key: string): Promise<string | null> {
        await this.initialize();

        const entry = this.index.entries[key];
        if (!entry) return null;

        const info = await FileSystem.getInfoAsync(entry.uri);
        if (!info.exists) {
            // Clean up stale entry
            delete this.index.entries[key];
            this.index.totalSize -= entry.size;
            await this.saveIndex();
            return null;
        }

        // Update access time
        entry.timestamp = Date.now();
        await this.saveIndex();

        return entry.uri;
    }

    /**
     * Get all saved edits
     */
    async getSavedEdits(): Promise<string[]> {
        await this.initialize();

        try {
            const files = await FileSystem.readDirectoryAsync(EDITS_DIR);
            return files.map((f) => `${EDITS_DIR}${f}`);
        } catch {
            return [];
        }
    }

    /**
     * Delete a cached or saved image
     */
    async delete(uri: string): Promise<void> {
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });

            // Update index if it was a cache entry
            const key = Object.keys(this.index.entries).find(
                (k) => this.index.entries[k].uri === uri
            );

            if (key) {
                this.index.totalSize -= this.index.entries[key].size;
                delete this.index.entries[key];
                await this.saveIndex();
            }
        } catch (error) {
            console.error('Failed to delete image:', error);
        }
    }

    /**
     * Clear all cache (but not saved edits)
     */
    async clearCache(): Promise<void> {
        try {
            await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
            this.index = { entries: {}, totalSize: 0 };
            await this.saveIndex();
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    /**
     * Evict oldest entries if cache is too large
     */
    private async evictIfNeeded(): Promise<void> {
        if (this.index.totalSize <= MAX_CACHE_SIZE) return;

        // Sort entries by timestamp (oldest first)
        const entries = Object.entries(this.index.entries).sort(
            ([, a], [, b]) => a.timestamp - b.timestamp
        );

        // Remove oldest until under limit
        for (const [key, entry] of entries) {
            if (this.index.totalSize <= MAX_CACHE_SIZE * 0.8) break;

            await FileSystem.deleteAsync(entry.uri, { idempotent: true });
            this.index.totalSize -= entry.size;
            delete this.index.entries[key];
        }

        await this.saveIndex();
    }

    /**
     * Clean up expired entries
     */
    private async cleanup(): Promise<void> {
        const now = Date.now();

        for (const [key, entry] of Object.entries(this.index.entries)) {
            if (now - entry.timestamp > MAX_CACHE_AGE) {
                await FileSystem.deleteAsync(entry.uri, { idempotent: true });
                this.index.totalSize -= entry.size;
                delete this.index.entries[key];
            }
        }

        await this.saveIndex();
    }

    /**
     * Get cache stats
     */
    getStats(): { entryCount: number; totalSize: number } {
        return {
            entryCount: Object.keys(this.index.entries).length,
            totalSize: this.index.totalSize,
        };
    }
}

// Singleton instance
export const imageCache = new ImageCache();
