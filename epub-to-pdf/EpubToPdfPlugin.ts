/**
 * EPUB to PDF Plugin
 * Converts EPUB files to PDF format with customizable settings
 */

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import type { Plugin } from '../types';
import type {
  ConversionResult,
  EpubToPdfSettings,
  BatchConversionResult,
  ConverterInfo,
} from './types';

export const epubToPdfPlugin: Plugin = {
  id: 'epub-to-pdf',
  name: 'EPUB to PDF',
  description:
    'Convert EPUB files to PDF format. Select multiple books via right-click and save them anywhere on your system.',
  version: '1.0.0',
  author: 'Stomy Team',
  icon: 'FileText',
  enabled: false,

  permissions: ['fs:read', 'fs:write', 'dialog:*', 'tauri:*'],

  settings: {
    defaultOutputFolder: '',
    openAfterConversion: false,
    showNotifications: true,
    compressionLevel: 'medium',
    pageSize: 'A4',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    },
    includeTableOfContents: true,
    preserveImages: true,
  } as EpubToPdfSettings,

  // Lifecycle hooks
  onInstall: async () => {
    console.log('[EpubToPdfPlugin] Plugin installed');
    // Check for available converters
    const info = await checkConverterAvailability();
    console.log('[EpubToPdfPlugin] Converter info:', info);
  },

  onUninstall: async () => {
    console.log('[EpubToPdfPlugin] Plugin uninstalled');
  },

  onEnable: async () => {
    console.log('[EpubToPdfPlugin] Plugin enabled');
    // Verify converter is still available
    const info = await checkConverterAvailability();
    if (!info.available) {
      console.warn(
        '[EpubToPdfPlugin] No converter found. Please install Calibre or Pandoc.'
      );
    }
  },

  onDisable: async () => {
    console.log('[EpubToPdfPlugin] Plugin disabled');
  },

  // Actions exposed in the UI
  actions: [
    {
      id: 'check-converter',
      label: 'Check Converter Availability',
      icon: 'Info',
      context: 'global',
      onClick: async () => {
        try {
          const info = await checkConverterAvailability();
          console.log('[EpubToPdfPlugin] Converter info:', info);
          return info;
        } catch (error) {
          console.error(
            '[EpubToPdfPlugin] Failed to check converter:',
            error
          );
          throw error;
        }
      },
    },
    {
      id: 'convert-epub-to-pdf',
      label: 'Convert to PDF',
      icon: 'FileText',
      context: 'library',
      onClick: async (data?: any) => {
        console.log('[EpubToPdfPlugin] Convert to PDF triggered', data);

        try {
          // Get selected books from data
          const selectedBooks = data?.selectedBooks || [];

          if (selectedBooks.length === 0) {
            console.warn('[EpubToPdfPlugin] No books selected');
            return { success: false, error: 'No books selected' };
          }

          // Check if converter is available
          const converterInfo = await checkConverterAvailability();
          if (!converterInfo.available) {
            return {
              success: false,
              error:
                'No converter found. Please install Calibre or Pandoc to convert EPUB files to PDF.',
            };
          }

          // Ask user where to save the PDF(s)
          let outputFolder: string | null = null;

          if (selectedBooks.length === 1) {
            // Single file - show save dialog
            const book = selectedBooks[0];
            const defaultName = book.title
              ? `${book.title}.pdf`
              : 'book.pdf';

            outputFolder = await save({
              title: 'Save PDF as',
              defaultPath: defaultName,
              filters: [
                {
                  name: 'PDF',
                  extensions: ['pdf'],
                },
              ],
            });

            if (!outputFolder) {
              return { success: false, error: 'Save dialog cancelled' };
            }

            // Convert single book
            const result = await convertEpubToPdf(
              book.path,
              outputFolder,
              converterInfo.converter
            );

            return result;
          } else {
            // Multiple files - ask for folder
            outputFolder = await save({
              title: 'Select output folder for PDFs',
              defaultPath: 'converted-pdfs',
              filters: [],
            });

            if (!outputFolder) {
              return { success: false, error: 'Folder selection cancelled' };
            }

            // Convert multiple books
            const result = await convertMultipleEpubsToPdf(
              selectedBooks,
              outputFolder,
              converterInfo.converter
            );

            return result;
          }
        } catch (error) {
          console.error('[EpubToPdfPlugin] Conversion failed:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  ],

  // Menu items
  menuItems: [
    {
      id: 'epub-to-pdf-settings',
      label: 'EPUB to PDF Settings',
      icon: 'Settings',
      action: async () => {
        console.log('[EpubToPdfPlugin] Opening settings');
        // This would open a settings dialog
      },
    },
  ],
};

/**
 * Check if ebook-convert (Calibre) or pandoc is available
 */
export async function checkConverterAvailability(): Promise<ConverterInfo> {
  try {
    return await invoke<ConverterInfo>('check_epub_converter');
  } catch (error) {
    console.error('[EpubToPdfPlugin] Failed to check converter:', error);
    return {
      available: false,
      converter: 'none',
    };
  }
}

/**
 * Convert a single EPUB file to PDF
 */
export async function convertEpubToPdf(
  epubPath: string,
  pdfPath: string,
  converter: 'calibre' | 'pandoc' = 'calibre'
): Promise<ConversionResult> {
  try {
    return await invoke<ConversionResult>('convert_epub_to_pdf', {
      epubPath,
      pdfPath,
      converter,
    });
  } catch (error) {
    console.error('[EpubToPdfPlugin] Conversion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert multiple EPUB files to PDF in batch
 */
export async function convertMultipleEpubsToPdf(
  books: Array<{ path: string; title?: string }>,
  outputFolder: string,
  converter: 'calibre' | 'pandoc' = 'calibre'
): Promise<BatchConversionResult> {
  try {
    // Prepare conversion jobs
    const jobs = books.map((book) => {
      const fileName = book.title
        ? `${book.title}.pdf`
        : `${book.path.split('/').pop()?.replace('.epub', '.pdf')}`;

      return {
        epubPath: book.path,
        pdfPath: `${outputFolder}/${fileName}`,
      };
    });

    return await invoke<BatchConversionResult>('convert_multiple_epub_to_pdf', {
      jobs,
      converter,
    });
  } catch (error) {
    console.error('[EpubToPdfPlugin] Batch conversion failed:', error);
    return {
      success: false,
      converted: 0,
      failed: books.length,
      errors: [
        {
          file: 'batch',
          error: error instanceof Error ? error.message : String(error),
        },
      ],
      outputPaths: [],
    };
  }
}

/**
 * Helper function to convert EPUB to PDF with custom settings
 */
export async function convertWithSettings(
  epubPath: string,
  pdfPath: string,
  settings: Partial<EpubToPdfSettings>
): Promise<ConversionResult> {
  try {
    const converterInfo = await checkConverterAvailability();

    if (!converterInfo.available) {
      return {
        success: false,
        error: 'No converter available',
      };
    }

    return await invoke<ConversionResult>('convert_epub_to_pdf_with_settings', {
      epubPath,
      pdfPath,
      converter: converterInfo.converter,
      settings,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default epubToPdfPlugin;
