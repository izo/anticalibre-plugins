/**
 * Fake Sync Plugin Types
 */

export type DeviceType = 'kobo' | 'kindle' | 'usb' | 'none';

export interface FakeDevice {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  serialNumber: string;
  mountPath: string;
  capacity: number; // in MB
  usedSpace: number; // in MB
  supportedFormats: string[];
}

export interface FakeSyncSettings {
  // Device simulation settings
  deviceType: DeviceType;
  autoConnect: boolean;
  simulateDelays: boolean;
  syncDuration: number; // in milliseconds
  failureRate: number; // 0-100 percentage

  // Notifications
  showNotifications: boolean;
  verboseMode: boolean;
}

export interface SyncProgress {
  current: number;
  total: number;
  currentBook?: string;
  status: 'connecting' | 'syncing' | 'completed' | 'failed';
}

export interface FakeSyncResult {
  success: boolean;
  deviceName: string;
  booksSynced: number;
  bytesTransferred: number;
  duration: number; // in ms
  error?: string;
}

// Common device models for simulation
export const DEVICE_MODELS = {
  kobo: [
    { model: 'Kobo Clara HD', capacity: 8192, formats: ['epub', 'pdf', 'cbz', 'mobi'] },
    { model: 'Kobo Libra 2', capacity: 32768, formats: ['epub', 'pdf', 'cbz', 'mobi'] },
    { model: 'Kobo Sage', capacity: 32768, formats: ['epub', 'pdf', 'cbz', 'mobi'] },
    { model: 'Kobo Nia', capacity: 8192, formats: ['epub', 'pdf', 'cbz'] },
    { model: 'Kobo Elipsa 2E', capacity: 32768, formats: ['epub', 'pdf', 'cbz', 'mobi'] },
  ],
  kindle: [
    { model: 'Kindle Paperwhite (11th Gen)', capacity: 8192, formats: ['mobi', 'azw', 'azw3', 'pdf'] },
    { model: 'Kindle Oasis', capacity: 32768, formats: ['mobi', 'azw', 'azw3', 'pdf'] },
    { model: 'Kindle Basic', capacity: 8192, formats: ['mobi', 'azw', 'azw3', 'pdf'] },
    { model: 'Kindle Scribe', capacity: 16384, formats: ['mobi', 'azw', 'azw3', 'pdf'] },
  ],
  usb: [
    { model: 'USB Drive Generic', capacity: 32768, formats: ['epub', 'pdf', 'mobi', 'azw', 'cbz', 'txt'] },
    { model: 'USB Drive 64GB', capacity: 65536, formats: ['epub', 'pdf', 'mobi', 'azw', 'cbz', 'txt'] },
    { model: 'SD Card 16GB', capacity: 16384, formats: ['epub', 'pdf', 'mobi', 'azw', 'cbz', 'txt'] },
  ],
};
