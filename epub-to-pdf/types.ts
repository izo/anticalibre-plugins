/**
 * Types for EPUB to PDF Plugin
 */

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export interface EpubToPdfSettings {
  defaultOutputFolder: string;
  openAfterConversion: boolean;
  showNotifications: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  pageSize: 'A4' | 'Letter' | 'auto';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  includeTableOfContents: boolean;
  preserveImages: boolean;
}

export interface ConversionJob {
  id: string;
  bookId?: string;
  sourcePath: string;
  targetPath: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface BatchConversionResult {
  success: boolean;
  converted: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
  outputPaths: string[];
}

export interface ConverterInfo {
  available: boolean;
  converter: 'calibre' | 'pandoc' | 'none';
  version?: string;
  path?: string;
}
