import type { Plugin, PluginAction } from '../../types';
import type {
  GenericSyncPluginSettings,
  DeviceProfile,
  GenericDevice,
  DeviceType,
  SyncResult,
} from './types';
import { notificationService } from '@/services/notificationService';
import { libraryService } from '@/services/libraryService';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

const DEVICE_PROFILES: DeviceProfile[] = [
  {
    type: 'pocketbook',
    name: 'PocketBook',
    manufacturer: 'PocketBook International',
    detectionCriteria: {
      primaryPath: '/Books/',
      secondaryPath: '/system/',
      volumeName: 'POCKETBOOK',
    },
    syncPath: '/Books/',
    supportedFormats: ['epub', 'pdf', 'fb2', 'mobi', 'cbz', 'cbr', 'txt'],
    requiresConversion: false,
  },
  {
    type: 'sony-prs',
    name: 'Sony Reader',
    manufacturer: 'Sony',
    detectionCriteria: {
      primaryPath: '/database/',
      identifierFile: '/database/books.db',
    },
    syncPath: '/database/media/books/',
    supportedFormats: ['epub', 'pdf', 'txt'],
    requiresConversion: false,
  },
  {
    type: 'cybook',
    name: 'Cybook',
    manufacturer: 'Bookeen',
    detectionCriteria: {
      primaryPath: '/Digital Editions/',
      volumeName: 'CYBOOK',
    },
    syncPath: '/Books/',
    supportedFormats: ['epub', 'pdf', 'fb2', 'txt', 'html'],
    requiresConversion: false,
  },
  {
    type: 'bebook',
    name: 'BeBook',
    manufacturer: 'BeBook',
    detectionCriteria: {
      primaryPath: '/books/',
      volumeName: 'BEBOOK',
    },
    syncPath: '/books/',
    supportedFormats: ['epub', 'pdf', 'fb2', 'txt', 'html'],
    requiresConversion: false,
  },
];

export class GenericSyncPlugin implements Plugin {
  id = 'generic-sync';
  name = 'Generic Device Sync';
  version = '1.0.0';
  description =
    'Universal sync plugin for PocketBook, Sony Reader, Cybook, BeBook and other e-readers';
  author = 'Stomy Team';
  icon = 'TabletRegular';
  enabled = false;

  settings: GenericSyncPluginSettings = {
    enabled: true,
    autoDetect: true,
    supportedDevices: ['pocketbook', 'sony-prs', 'cybook', 'bebook'],
    defaultSyncPath: '/Books/',
    showNotifications: true,
  };

  private connectedDevices: GenericDevice[] = [];
  private detectionInterval?: number;

  actions: PluginAction[] = [
    {
      id: 'sync-to-device',
      label: 'Sync to Device',
      icon: 'ArrowSyncRegular',
      context: 'book',
      onClick: async (data) => {
        if (data?.bookId) {
          await this.syncSingleBook(data.bookId);
        }
      },
    },
    {
      id: 'sync-selected',
      label: 'Sync Selected Books',
      icon: 'ArrowSyncRegular',
      context: 'library',
      onClick: async () => {
        await this.syncSelectedBooks();
      },
    },
    {
      id: 'detect-devices',
      label: 'Detect Devices',
      icon: 'SearchRegular',
      context: 'settings',
      onClick: async () => {
        await this.detectDevices();
      },
    },
  ];

  async onEnable(): Promise<void> {
    console.log('[GenericSync] Plugin enabled');

    if (this.settings.autoDetect) {
      this.startDeviceDetection();
    }

    notificationService.show({
      title: 'Generic Device Sync Enabled',
      message: 'Detecting compatible e-readers...',
      type: 'success',
    });
  }

  async onDisable(): Promise<void> {
    console.log('[GenericSync] Plugin disabled');
    this.stopDeviceDetection();
    this.connectedDevices = [];
  }

  /**
   * Start automatic device detection
   */
  private startDeviceDetection(): void {
    this.detectDevices();

    // Check for new devices every 3 seconds
    this.detectionInterval = window.setInterval(() => {
      this.detectDevices();
    }, 3000);
  }

  /**
   * Stop automatic device detection
   */
  private stopDeviceDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = undefined;
    }
  }

  /**
   * Detect all connected generic devices
   */
  private async detectDevices(): Promise<void> {
    try {
      const previousDeviceCount = this.connectedDevices.length;
      const newDevices: GenericDevice[] = [];

      for (const profile of DEVICE_PROFILES) {
        if (!this.settings.supportedDevices.includes(profile.type)) {
          continue;
        }

        const devices = await this.detectDeviceType(profile);
        newDevices.push(...devices);
      }

      this.connectedDevices = newDevices;

      // Notify on new device connection
      if (
        this.settings.showNotifications &&
        newDevices.length > previousDeviceCount
      ) {
        const newDevice = newDevices[newDevices.length - 1];
        notificationService.show({
          title: 'Device Connected',
          message: `${newDevice.manufacturer} ${newDevice.name} detected`,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('[GenericSync] Detection error:', error);
    }
  }

  /**
   * Detect devices of a specific type
   */
  private async detectDeviceType(
    profile: DeviceProfile
  ): Promise<GenericDevice[]> {
    try {
      // Get all mounted volumes
      const volumes = await this.getMountedVolumes();
      const devices: GenericDevice[] = [];

      for (const volume of volumes) {
        if (await this.matchesProfile(volume, profile)) {
          const device = await this.createDeviceInfo(volume, profile);
          devices.push(device);
        }
      }

      return devices;
    } catch (error) {
      console.error(`[GenericSync] Error detecting ${profile.type}:`, error);
      return [];
    }
  }

  /**
   * Get mounted volumes from the system
   */
  private async getMountedVolumes(): Promise<string[]> {
    try {
      // Use Tauri command to get mounted volumes
      const volumes = await invoke<string[]>('get_mounted_volumes');
      return volumes;
    } catch (error) {
      console.error('[GenericSync] Failed to get volumes:', error);
      // Fallback for macOS
      return ['/Volumes'].flatMap((base) => {
        try {
          // This would need a proper Tauri command implementation
          return [];
        } catch {
          return [];
        }
      });
    }
  }

  /**
   * Check if a volume matches a device profile
   */
  private async matchesProfile(
    volumePath: string,
    profile: DeviceProfile
  ): Promise<boolean> {
    try {
      const criteria = profile.detectionCriteria;

      // Check volume name
      if (criteria.volumeName) {
        const volumeName = volumePath.split('/').pop()?.toLowerCase() || '';
        if (!volumeName.includes(criteria.volumeName.toLowerCase())) {
          return false;
        }
      }

      // Check primary path
      if (criteria.primaryPath) {
        const primaryExists = await this.pathExists(
          `${volumePath}${criteria.primaryPath}`
        );
        if (!primaryExists) return false;
      }

      // Check secondary path (optional)
      if (criteria.secondaryPath) {
        const secondaryExists = await this.pathExists(
          `${volumePath}${criteria.secondaryPath}`
        );
        if (!secondaryExists) return false;
      }

      // Check identifier file (optional)
      if (criteria.identifierFile) {
        const fileExists = await this.pathExists(
          `${volumePath}${criteria.identifierFile}`
        );
        if (!fileExists) return false;
      }

      return true;
    } catch (error) {
      console.error('[GenericSync] Profile match error:', error);
      return false;
    }
  }

  /**
   * Check if a path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await invoke('path_exists', { path });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create device info from volume and profile
   */
  private async createDeviceInfo(
    volumePath: string,
    profile: DeviceProfile
  ): Promise<GenericDevice> {
    const volumeName = volumePath.split('/').pop() || 'Unknown';
    const syncPath = `${volumePath}${profile.syncPath}`;

    // Get storage info
    const { total, free } = await this.getStorageInfo(volumePath);

    // Count books in sync directory
    const bookCount = await this.countBooks(syncPath);

    return {
      id: `${profile.type}-${volumeName}`,
      type: profile.type,
      name: profile.name,
      manufacturer: profile.manufacturer,
      mountPath: volumePath,
      syncPath,
      totalSpace: total,
      freeSpace: free,
      bookCount,
      supportedFormats: profile.supportedFormats,
      connected: true,
      lastSync: undefined,
    };
  }

  /**
   * Get storage information for a volume
   */
  private async getStorageInfo(
    volumePath: string
  ): Promise<{ total: number; free: number }> {
    try {
      const info = await invoke<{ total: number; free: number }>(
        'get_device_space',
        { devicePath: volumePath }
      );
      return info;
    } catch (error) {
      console.error('[GenericSync] Storage info error:', error);
      return { total: 0, free: 0 };
    }
  }

  /**
   * Count books in a directory
   */
  private async countBooks(path: string): Promise<number> {
    try {
      const count = await invoke<number>('count_files_in_directory', {
        path,
        extensions: ['epub', 'pdf', 'mobi', 'cbz'],
      });
      return count;
    } catch (error) {
      console.error('[GenericSync] Book count error:', error);
      return 0;
    }
  }

  /**
   * Sync a single book to connected device
   */
  private async syncSingleBook(bookId: number): Promise<void> {
    if (this.connectedDevices.length === 0) {
      notificationService.show({
        title: 'No Device Connected',
        message: 'Please connect a compatible e-reader',
        type: 'warning',
      });
      return;
    }

    try {
      const book = await libraryService.getBookById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      // Use first connected device
      const device = this.connectedDevices[0];

      // Check format compatibility
      const bookFormat = book.filePath.split('.').pop()?.toLowerCase() || '';
      if (!device.supportedFormats.includes(bookFormat)) {
        notificationService.show({
          title: 'Format Not Supported',
          message: `${device.name} does not support ${bookFormat.toUpperCase()} files`,
          type: 'warning',
        });
        return;
      }

      notificationService.show({
        title: 'Syncing Book',
        message: `Copying "${book.title}" to ${device.name}...`,
        type: 'info',
      });

      // Copy file to device
      await invoke('copy_file_to_device', {
        sourcePath: book.filePath,
        devicePath: device.syncPath,
        fileName: `${book.title}.${bookFormat}`,
      });

      notificationService.show({
        title: 'Sync Complete',
        message: `"${book.title}" synced to ${device.name}`,
        type: 'success',
      });

      // Update device info
      await this.detectDevices();
    } catch (error) {
      console.error('[GenericSync] Sync error:', error);
      notificationService.show({
        title: 'Sync Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  }

  /**
   * Sync selected books (placeholder for future implementation)
   */
  private async syncSelectedBooks(): Promise<void> {
    notificationService.show({
      title: 'Feature Coming Soon',
      message: 'Multi-book sync will be available in a future update',
      type: 'info',
    });
  }

  /**
   * Get list of connected devices
   */
  public getConnectedDevices(): GenericDevice[] {
    return this.connectedDevices;
  }

  /**
   * Get device profile by type
   */
  public getDeviceProfile(type: DeviceType): DeviceProfile | undefined {
    return DEVICE_PROFILES.find((p) => p.type === type);
  }
}
