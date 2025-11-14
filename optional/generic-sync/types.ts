export interface GenericSyncPluginSettings {
  enabled: boolean;
  autoDetect: boolean;
  supportedDevices: DeviceType[];
  defaultSyncPath: string;
  showNotifications: boolean;
}

export type DeviceType = 'pocketbook' | 'sony-prs' | 'cybook' | 'bebook' | 'other';

export interface DeviceProfile {
  type: DeviceType;
  name: string;
  manufacturer: string;
  detectionCriteria: DetectionCriteria;
  syncPath: string;
  supportedFormats: string[];
  requiresConversion: boolean;
}

export interface DetectionCriteria {
  primaryPath?: string;        // e.g., "/Books/" for PocketBook
  secondaryPath?: string;       // e.g., "/system/" for PocketBook
  volumeName?: string;          // e.g., "POCKETBOOK"
  identifierFile?: string;      // e.g., "database/books.db" for Sony
}

export interface GenericDevice {
  id: string;
  type: DeviceType;
  name: string;
  manufacturer: string;
  mountPath: string;
  syncPath: string;
  totalSpace: number;
  freeSpace: number;
  bookCount: number;
  supportedFormats: string[];
  connected: boolean;
  lastSync?: Date;
}

export interface SyncResult {
  success: boolean;
  deviceName: string;
  booksSynced: number;
  errors: string[];
  duration: number;
}
