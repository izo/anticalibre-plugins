/**
 * EPUB to PDF Plugin
 * Export all EPUB to PDF plugin functionality
 */

export { epubToPdfPlugin as default, epubToPdfPlugin } from './EpubToPdfPlugin';
export * from './types';
export {
  checkConverterAvailability,
  convertEpubToPdf,
  convertMultipleEpubsToPdf,
  convertWithSettings,
} from './EpubToPdfPlugin';
