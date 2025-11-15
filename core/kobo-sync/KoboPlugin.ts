/**
 * Kobo Sync Plugin
 * Enables synchronization with Kobo e-reader devices via USB
 */

import { invoke } from '@tauri-apps/api/core';
import type { Plugin } from '../../types';
import type {
  KoboDevice,
  KoboInfo,
  KoboPluginSettings,
  SyncResult,
  KoboBook,
  KoboEvent,
  KoboBookmark,
  KoboVocabulary,
  KoboLibraryData,
  KoboSyncStats,
} from './types';

export const koboPlugin: Plugin = {
  id: 'kobo-sync',
  name: 'Kobo Sync',
  description:
    'Synchronize your ebook library with Kobo e-reader devices via USB. Import reading progress, annotations, and vocabulary from KoboReader.sqlite database.',
  version: '2.0.0',
  author: 'Stomy Team',
  icon: 'BookOpen',
  enabled: true, // Enabled by default since it's the primary device

  permissions: ['fs:read', 'fs:write', 'tauri:*'],

  settings: {
    targetFolder: '.kobo',
    showNotifications: true,
    autoEject: false,
    syncMetadata: true,
    syncReadingProgress: true,
    syncAnnotations: true,
    syncVocabulary: false,
  } as KoboPluginSettings,

  // Lifecycle hooks
  onInstall: async () => {
    console.log('[KoboPlugin] Plugin installed');
  },

  onUninstall: async () => {
    console.log('[KoboPlugin] Plugin uninstalled');
  },

  onEnable: async () => {
    console.log('[KoboPlugin] Plugin enabled');
  },

  onDisable: async () => {
    console.log('[KoboPlugin] Plugin disabled');
  },

  // Actions exposed in the UI
  actions: [
    {
      id: 'detect-kobo',
      label: 'Detect Kobo Devices',
      icon: 'Search',
      context: 'global',
      onClick: async () => {
        try {
          const devices = await invoke<KoboDevice[]>('detect_kobo_devices');
          console.log('[KoboPlugin] Detected Kobo devices:', devices);
          return devices;
        } catch (error) {
          console.error('[KoboPlugin] Failed to detect Kobo devices:', error);
          throw error;
        }
      },
    },
    {
      id: 'sync-to-kobo',
      label: 'Sync to Kobo',
      icon: 'Download',
      context: 'library',
      onClick: async (data?: any) => {
        console.log('[KoboPlugin] Sync to Kobo triggered', data);
        // This will be implemented in the SyncService integration
      },
    },
    {
      id: 'import-reading-progress',
      label: 'Import Reading Progress from Kobo',
      icon: 'CloudDownload',
      context: 'global',
      onClick: async () => {
        try {
          console.log('[KoboPlugin] Importing reading progress...');
          const devices = await detectKoboDevices();

          if (devices.length === 0) {
            throw new Error('No Kobo device detected');
          }

          const devicePath = devices[0].path;
          const libraryData = await getKoboLibraryData(devicePath);

          console.log('[KoboPlugin] Imported:', {
            books: libraryData.books.length,
            events: libraryData.events.length,
            bookmarks: libraryData.bookmarks.length,
            vocabulary: libraryData.vocabulary.length,
          });

          return libraryData;
        } catch (error) {
          console.error('[KoboPlugin] Failed to import reading progress:', error);
          throw error;
        }
      },
    },
    {
      id: 'view-annotations',
      label: 'View Kobo Annotations',
      icon: 'TextQuote',
      context: 'global',
      onClick: async () => {
        try {
          const devices = await detectKoboDevices();

          if (devices.length === 0) {
            throw new Error('No Kobo device detected');
          }

          const bookmarks = await getKoboBookmarks(devices[0].path);
          console.log('[KoboPlugin] Found', bookmarks.length, 'annotations');
          return bookmarks;
        } catch (error) {
          console.error('[KoboPlugin] Failed to get annotations:', error);
          throw error;
        }
      },
    },
    {
      id: 'sync-vocabulary',
      label: 'Import Vocabulary from Kobo',
      icon: 'Book',
      context: 'global',
      onClick: async () => {
        try {
          const devices = await detectKoboDevices();

          if (devices.length === 0) {
            throw new Error('No Kobo device detected');
          }

          const vocabulary = await getKoboVocabulary(devices[0].path);
          console.log('[KoboPlugin] Found', vocabulary.length, 'vocabulary words');
          return vocabulary;
        } catch (error) {
          console.error('[KoboPlugin] Failed to get vocabulary:', error);
          throw error;
        }
      },
    },
  ],

  // Menu items
  menuItems: [
    {
      id: 'kobo-settings',
      label: 'Kobo Settings',
      icon: 'Settings',
      action: async () => {
        console.log('[KoboPlugin] Opening Kobo settings');
        // This would open a settings dialog
      },
    },
  ],
};

/**
 * Detect connected Kobo devices
 */
export async function detectKoboDevices(): Promise<KoboDevice[]> {
  try {
    return await invoke<KoboDevice[]>('detect_kobo_devices');
  } catch (error) {
    console.error('[KoboPlugin] Failed to detect Kobo devices:', error);
    return [];
  }
}

/**
 * Get detailed information about a Kobo device
 */
export async function getKoboInfo(devicePath: string): Promise<KoboInfo> {
  return await invoke<KoboInfo>('get_kobo_info', { devicePath });
}

/**
 * Copy a file to Kobo device
 */
export async function copyFileToKobo(
  sourcePath: string,
  koboPath: string,
  filename: string
): Promise<string> {
  return await invoke<string>('copy_file_to_device', {
    sourcePath,
    devicePath: koboPath,
    filename,
  });
}

/**
 * Sync a book to Kobo
 */
export async function syncBookToKobo(
  bookPath: string,
  bookTitle: string,
  koboDevicePath: string,
  settings: KoboPluginSettings
): Promise<SyncResult> {
  try {
    // Kobo natively supports EPUB, PDF, and other formats
    await copyFileToKobo(bookPath, koboDevicePath, bookTitle);

    return { success: true, booksSynced: 1 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Database Reading Functions
// ============================================================================

/**
 * Get all books from Kobo database
 */
export async function getKoboBooks(devicePath: string): Promise<KoboBook[]> {
  try {
    return await invoke<KoboBook[]>('get_kobo_books', { devicePath });
  } catch (error) {
    console.error('[KoboPlugin] Failed to get books:', error);
    return [];
  }
}

/**
 * Get reading events from Kobo database
 */
export async function getKoboEvents(devicePath: string): Promise<KoboEvent[]> {
  try {
    return await invoke<KoboEvent[]>('get_kobo_events', { devicePath });
  } catch (error) {
    console.error('[KoboPlugin] Failed to get events:', error);
    return [];
  }
}

/**
 * Get bookmarks and annotations from Kobo database
 */
export async function getKoboBookmarks(devicePath: string): Promise<KoboBookmark[]> {
  try {
    return await invoke<KoboBookmark[]>('get_kobo_bookmarks', { devicePath });
  } catch (error) {
    console.error('[KoboPlugin] Failed to get bookmarks:', error);
    return [];
  }
}

/**
 * Get vocabulary words from Kobo database
 */
export async function getKoboVocabulary(devicePath: string): Promise<KoboVocabulary[]> {
  try {
    return await invoke<KoboVocabulary[]>('get_kobo_vocabulary', { devicePath });
  } catch (error) {
    console.error('[KoboPlugin] Failed to get vocabulary:', error);
    return [];
  }
}

/**
 * Get all Kobo library data at once (optimized)
 */
export async function getKoboLibraryData(devicePath: string): Promise<KoboLibraryData> {
  return await invoke<KoboLibraryData>('get_kobo_library_data', { devicePath });
}

/**
 * Get reading progress for a specific book
 */
export async function getBookProgress(
  devicePath: string,
  isbn?: string,
  title?: string
): Promise<KoboBook | null> {
  try {
    return await invoke<KoboBook | null>('get_book_progress', {
      devicePath,
      isbn: isbn || null,
      title: title || null,
    });
  } catch (error) {
    console.error('[KoboPlugin] Failed to get book progress:', error);
    return null;
  }
}

// ============================================================================
// Sync Utility Functions
// ============================================================================

/**
 * Sync reading progress from Kobo to Stomy library
 */
export async function syncReadingProgress(
  devicePath: string,
  onProgress?: (stats: KoboSyncStats) => void
): Promise<KoboSyncStats> {
  const stats: KoboSyncStats = {
    booksFound: 0,
    booksUpdated: 0,
    progressSynced: 0,
    annotationsSynced: 0,
    vocabularySynced: 0,
    errors: 0,
  };

  try {
    // Get all library data
    const libraryData = await getKoboLibraryData(devicePath);
    stats.booksFound = libraryData.books.length;

    // TODO: This will be implemented when integrated with main Stomy app
    // For now, just return the stats
    console.log('[KoboPlugin] Sync stats:', stats);

    if (onProgress) {
      onProgress(stats);
    }

    return stats;
  } catch (error) {
    console.error('[KoboPlugin] Failed to sync reading progress:', error);
    stats.errors++;
    return stats;
  }
}

/**
 * Format reading time in human-readable format
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Get read status label
 */
export function getReadStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return 'Unread';
    case 1:
      return 'Reading';
    case 2:
      return 'Finished';
    default:
      return 'Unknown';
  }
}

export default koboPlugin;
