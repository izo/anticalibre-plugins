/**
 * Types for Kobo Sync Plugin
 */

export interface KoboDevice {
  name: string;
  path: string;
  model: string;
  serialNumber?: string;
  freeSpace: number;
  totalSpace: number;
}

export interface KoboInfo {
  device: KoboDevice;
  koboPath: string;
  bookCount: number;
  supportedFormats: string[];
}

export interface KoboPluginSettings {
  targetFolder: string; // Default: .kobo folder
  showNotifications: boolean;
  autoEject: boolean;
  syncMetadata: boolean;
  syncReadingProgress: boolean; // Sync reading progress from Kobo
  syncAnnotations: boolean; // Sync highlights and annotations
  syncVocabulary: boolean; // Sync vocabulary/dictionary lookups
}

export interface SyncResult {
  success: boolean;
  booksSynced?: number;
  error?: string;
}

// ============================================================================
// KoboReader.sqlite Database Types
// ============================================================================

/**
 * Book metadata from Kobo's content table
 */
export interface KoboBook {
  // Identifiers
  contentID: string;
  isbn?: string;

  // Metadata
  title: string;
  attribution?: string; // Author
  description?: string;
  publisher?: string;
  language?: string;

  // Reading Progress
  percentRead: number; // 0-100
  readStatus: KoboReadStatus;
  timeSpentReading: number; // Minutes
  dateLastRead?: string; // ISO date string

  // File info
  mimeType: string;
  contentType: string;

  // System
  userID?: string;
}

/**
 * Read status enum
 */
export enum KoboReadStatus {
  Unread = 0,
  Reading = 1,
  Finished = 2,
}

/**
 * Reading event from Event table
 */
export interface KoboEvent {
  id: number;
  contentID: string;
  eventType: KoboEventType;
  eventCount: number;
  lastOccurrence: string; // ISO date string
  extraData?: string; // Binary blob (base64 encoded)
}

/**
 * Event types for reading activity
 */
export enum KoboEventType {
  StartReadingBook = 3,
  Progress25 = 1011,
  Progress50 = 1013,
  Progress75 = 1014,
  FinishedReadingBook = 5,
  LeaveContent = 1021,
}

/**
 * Bookmark (highlight or annotation) from Bookmark table
 */
export interface KoboBookmark {
  bookmarkID: string;
  volumeID: string; // Book identifier
  contentID: string;

  // Content
  text: string; // Highlighted text
  annotation?: string; // User's note

  // Location
  chapterProgress: number; // 0-1
  startContainerPath?: string;
  startOffset?: number;
  endContainerPath?: string;
  endOffset?: number;

  // Metadata
  dateCreated: string; // ISO date string
  dateModified?: string; // ISO date string

  // Type
  type: KoboBookmarkType;
}

/**
 * Bookmark types
 */
export enum KoboBookmarkType {
  Highlight = 'highlight',
  Annotation = 'annotation',
  Bookmark = 'bookmark',
  Dogear = 'dogear',
}

/**
 * Vocabulary word from WordList table
 */
export interface KoboVocabulary {
  text: string;
  volumeID: string; // Book where word was looked up
  dateCreated: string;
}

/**
 * Analytics event from AnalyticsEvents table
 */
export interface KoboAnalyticsEvent {
  id: number;
  timestamp: string; // ISO date string
  type: string;
  attributes?: Record<string, any>; // JSON
  metrics?: Record<string, number>; // JSON
}

/**
 * Complete Kobo library data
 */
export interface KoboLibraryData {
  books: KoboBook[];
  events: KoboEvent[];
  bookmarks: KoboBookmark[];
  vocabulary: KoboVocabulary[];
  lastSync: string; // ISO date string
}

/**
 * Sync statistics
 */
export interface KoboSyncStats {
  booksFound: number;
  booksUpdated: number;
  progressSynced: number;
  annotationsSynced: number;
  vocabularySynced: number;
  errors: number;
}
