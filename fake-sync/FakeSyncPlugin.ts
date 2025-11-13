/**
 * Fake Sync Plugin
 * Simulates synchronization with various e-reader devices for development and testing
 */

import type { Plugin } from '../types';
import { notificationService } from '../../services/notificationService';
import type {
  FakeDevice,
  FakeSyncSettings,
  DeviceType,
  SyncProgress,
  FakeSyncResult,
} from './types';
import { DEVICE_MODELS } from './types';

// Global state for the fake device
let currentFakeDevice: FakeDevice | null = null;
let isSyncing = false;

/**
 * Generate a random serial number
 */
function generateSerialNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 12; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

/**
 * Create a fake device based on the selected type
 */
function createFakeDevice(deviceType: DeviceType): FakeDevice | null {
  if (deviceType === 'none') return null;

  const models = DEVICE_MODELS[deviceType];
  const selectedModel = models[Math.floor(Math.random() * models.length)];
  const usedSpace = Math.floor(selectedModel.capacity * (0.1 + Math.random() * 0.4)); // 10-50% used

  return {
    id: `fake-${deviceType}-${Date.now()}`,
    name: selectedModel.model,
    type: deviceType,
    model: selectedModel.model,
    serialNumber: generateSerialNumber(),
    mountPath: `/Volumes/${selectedModel.model.replace(/\s+/g, '_')}`,
    capacity: selectedModel.capacity,
    usedSpace,
    supportedFormats: selectedModel.formats,
  };
}

/**
 * Simulate device detection with delay
 */
async function simulateDeviceDetection(
  deviceType: DeviceType,
  simulateDelays: boolean
): Promise<FakeDevice | null> {
  if (simulateDelays) {
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));
  }

  return createFakeDevice(deviceType);
}

/**
 * Simulate file synchronization with progress
 */
async function simulateSync(
  device: FakeDevice,
  bookCount: number,
  settings: FakeSyncSettings,
  onProgress?: (progress: SyncProgress) => void
): Promise<FakeSyncResult> {
  const startTime = Date.now();
  isSyncing = true;

  try {
    // Simulate connection phase
    if (onProgress) {
      onProgress({
        current: 0,
        total: bookCount,
        status: 'connecting',
      });
    }

    if (settings.simulateDelays) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Simulate random failure if configured
    if (settings.failureRate > 0 && Math.random() * 100 < settings.failureRate) {
      throw new Error('Simulated sync failure: Device disconnected unexpectedly');
    }

    // Simulate syncing each book
    let bytesTransferred = 0;
    for (let i = 0; i < bookCount; i++) {
      if (onProgress) {
        onProgress({
          current: i,
          total: bookCount,
          currentBook: `Book ${i + 1} of ${bookCount}`,
          status: 'syncing',
        });
      }

      // Simulate transfer time
      const bookSize = 1 + Math.random() * 10; // 1-11 MB
      bytesTransferred += bookSize * 1024 * 1024;

      if (settings.simulateDelays) {
        const delay = Math.min(settings.syncDuration / bookCount, 2000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Completion
    if (onProgress) {
      onProgress({
        current: bookCount,
        total: bookCount,
        status: 'completed',
      });
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      deviceName: device.name,
      booksSynced: bookCount,
      bytesTransferred,
      duration,
    };
  } catch (error) {
    return {
      success: false,
      deviceName: device.name,
      booksSynced: 0,
      bytesTransferred: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get device icon based on type
 */
function getDeviceIcon(deviceType: DeviceType): string {
  switch (deviceType) {
    case 'kobo':
      return 'BookOpen';
    case 'kindle':
      return 'BookMarked';
    case 'usb':
      return 'Usb';
    default:
      return 'HardDrive';
  }
}

export const fakeSyncPlugin: Plugin = {
  id: 'fake-sync',
  name: 'Fake Sync (Dev Tool)',
  description:
    'Simulates synchronization with e-reader devices (Kobo, Kindle, USB) for development and testing purposes.',
  version: '1.0.0',
  author: 'Stomy Team',
  icon: 'TestTube',
  enabled: false,

  permissions: [],

  settings: {
    deviceType: 'none' as DeviceType,
    autoConnect: false,
    simulateDelays: true,
    syncDuration: 5000,
    failureRate: 0,
    showNotifications: true,
    verboseMode: false,
  } as FakeSyncSettings,

  // Lifecycle hooks
  onInstall: async () => {
    console.log('[FakeSyncPlugin] Plugin installed');
    await notificationService.notify({
      title: 'Fake Sync Plugin',
      body: 'Dev tool installed. Configure a device type in settings.',
    });
  },

  onUninstall: async () => {
    console.log('[FakeSyncPlugin] Plugin uninstalled');
    currentFakeDevice = null;
  },

  onEnable: async () => {
    console.log('[FakeSyncPlugin] Plugin enabled');
  },

  onDisable: async () => {
    console.log('[FakeSyncPlugin] Plugin disabled');
    currentFakeDevice = null;
    isSyncing = false;
  },

  // Actions exposed in the UI
  actions: [
    {
      id: 'detect-fake-device',
      label: 'Detect Fake Device',
      icon: 'Search',
      context: 'global',
      onClick: async function () {
        try {
          const settings = fakeSyncPlugin.settings as FakeSyncSettings;

          if (settings.deviceType === 'none') {
            await notificationService.notify({
              title: 'Fake Sync',
              body: 'Please configure a device type in plugin settings first.',
            });
            return;
          }

          if (settings.showNotifications) {
            await notificationService.notify({
              title: 'Fake Sync',
              body: `Detecting ${settings.deviceType} device...`,
            });
          }

          currentFakeDevice = await simulateDeviceDetection(
            settings.deviceType,
            settings.simulateDelays
          );

          if (currentFakeDevice) {
            const freeSpace = currentFakeDevice.capacity - currentFakeDevice.usedSpace;
            const message = settings.verboseMode
              ? `Device: ${currentFakeDevice.name}\nSerial: ${currentFakeDevice.serialNumber}\nCapacity: ${formatBytes(currentFakeDevice.capacity * 1024 * 1024)}\nFree: ${formatBytes(freeSpace * 1024 * 1024)}\nFormats: ${currentFakeDevice.supportedFormats.join(', ')}`
              : `${currentFakeDevice.name} detected!`;

            await notificationService.notify({
              title: 'Fake Sync',
              body: message,
            });

            console.log('[FakeSyncPlugin] Fake device created:', currentFakeDevice);
          }
        } catch (error) {
          console.error('[FakeSyncPlugin] Detection failed:', error);
          await notificationService.notify({
            title: 'Fake Sync',
            body: `Error: ${error}`,
          });
        }
      },
    },
    {
      id: 'disconnect-fake-device',
      label: 'Disconnect Device',
      icon: 'XCircle',
      context: 'global',
      onClick: async function () {
        if (!currentFakeDevice) {
          await notificationService.notify({
            title: 'Fake Sync',
            body: 'No device connected.',
          });
          return;
        }

        const deviceName = currentFakeDevice.name;
        currentFakeDevice = null;

        await notificationService.notify({
          title: 'Fake Sync',
          body: `${deviceName} disconnected.`,
        });

        console.log('[FakeSyncPlugin] Fake device disconnected');
      },
    },
    {
      id: 'sync-to-fake-device',
      label: 'Sync to Fake Device',
      icon: 'Download',
      context: 'library',
      onClick: async function (data?: any) {
        try {
          const settings = fakeSyncPlugin.settings as FakeSyncSettings;

          if (!currentFakeDevice) {
            await notificationService.notify({
              title: 'Fake Sync',
              body: 'No device connected. Detect a device first.',
            });
            return;
          }

          if (isSyncing) {
            await notificationService.notify({
              title: 'Fake Sync',
              body: 'Sync already in progress...',
            });
            return;
          }

          // Simulate syncing a random number of books (or use data if provided)
          const bookCount = data?.bookCount || Math.floor(Math.random() * 10) + 1;

          if (settings.showNotifications) {
            await notificationService.notify({
              title: 'Fake Sync',
              body: `Starting sync of ${bookCount} book(s) to ${currentFakeDevice.name}...`,
            });
          }

          const result = await simulateSync(
            currentFakeDevice,
            bookCount,
            settings,
            (progress) => {
              if (settings.verboseMode) {
                console.log('[FakeSyncPlugin] Sync progress:', progress);
              }
            }
          );

          // Show result notification
          if (result.success) {
            const message = settings.verboseMode
              ? `Synced ${result.booksSynced} book(s)\nTransferred: ${formatBytes(result.bytesTransferred)}\nDuration: ${(result.duration / 1000).toFixed(1)}s`
              : `Synced ${result.booksSynced} book(s) successfully!`;

            await notificationService.notify({
              title: 'Fake Sync Complete',
              body: message,
            });
          } else {
            await notificationService.notify({
              title: 'Fake Sync Failed',
              body: result.error || 'Unknown error',
            });
          }

          console.log('[FakeSyncPlugin] Sync result:', result);
        } catch (error) {
          console.error('[FakeSyncPlugin] Sync failed:', error);
          await notificationService.notify({
            title: 'Fake Sync',
            body: `Error: ${error}`,
          });
        }
      },
    },
    {
      id: 'get-device-info',
      label: 'Get Device Info',
      icon: 'Info',
      context: 'settings',
      onClick: async function () {
        if (!currentFakeDevice) {
          alert('No device connected. Detect a device first.');
          return;
        }

        const freeSpace = currentFakeDevice.capacity - currentFakeDevice.usedSpace;
        const usedPercent = (
          (currentFakeDevice.usedSpace / currentFakeDevice.capacity) *
          100
        ).toFixed(1);

        const info = `
📱 Device Information

Name: ${currentFakeDevice.name}
Type: ${currentFakeDevice.type.toUpperCase()}
Model: ${currentFakeDevice.model}
Serial: ${currentFakeDevice.serialNumber}
Mount Path: ${currentFakeDevice.mountPath}

💾 Storage
Capacity: ${formatBytes(currentFakeDevice.capacity * 1024 * 1024)}
Used: ${formatBytes(currentFakeDevice.usedSpace * 1024 * 1024)} (${usedPercent}%)
Free: ${formatBytes(freeSpace * 1024 * 1024)}

📚 Supported Formats
${currentFakeDevice.supportedFormats.map((f) => f.toUpperCase()).join(', ')}
        `.trim();

        alert(info);
        console.log('[FakeSyncPlugin] Device info:', currentFakeDevice);
      },
    },
  ],

  menuItems: [
    {
      id: 'fake-sync-settings',
      label: 'Fake Sync Settings',
      icon: 'Settings',
      action: async () => {
        console.log('[FakeSyncPlugin] Opening settings (to be implemented in main app)');
      },
    },
  ],
};

// Export helper functions for programmatic use
export async function detectFakeDevice(
  deviceType: DeviceType,
  simulateDelays = true
): Promise<FakeDevice | null> {
  return await simulateDeviceDetection(deviceType, simulateDelays);
}

export function getCurrentFakeDevice(): FakeDevice | null {
  return currentFakeDevice;
}

export function setCurrentFakeDevice(device: FakeDevice | null): void {
  currentFakeDevice = device;
}

export function isSyncInProgress(): boolean {
  return isSyncing;
}

export default fakeSyncPlugin;
