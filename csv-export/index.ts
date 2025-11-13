/**
 * Plugin CSV Export
 * Exporte la bibliothèque au format CSV
 */

import type { ExportPlugin, ExportResult } from '../../types';
import type { Book } from '../../../types/models';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { notificationService } from '../../../services/notificationService';
import { libraryService } from '../../../services/libraryService';

/**
 * Convertit un livre en ligne CSV
 */
function bookToCsvRow(book: Book): string {
  const escape = (str: string | null | undefined): string => {
    if (!str) return '';
    // Échapper les guillemets et entourer de guillemets si nécessaire
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const fields = [
    escape(book.title),
    escape(book.author),
    escape(book.series || ''),
    book.seriesIndex?.toString() || '',
    escape(book.language || ''),
    escape(book.isbn || ''),
    escape(book.format),
    escape(book.filePath),
    book.fileSize?.toString() || '',
    escape(book.addedAt),
    escape(book.tags?.join('; ') || ''),
  ];

  return fields.join(',');
}

/**
 * Génère le CSV complet
 */
function generateCsv(books: Book[]): string {
  const headers = [
    'Titre',
    'Auteur',
    'Série',
    'Index Série',
    'Langue',
    'ISBN',
    'Format',
    'Chemin',
    'Taille (octets)',
    'Date Ajout',
    'Tags',
  ];

  const rows = [headers.join(',')];

  for (const book of books) {
    rows.push(bookToCsvRow(book));
  }

  // Ajouter le BOM UTF-8 pour Excel
  return '\uFEFF' + rows.join('\n');
}

export const csvExportPlugin: ExportPlugin = {
  // Métadonnées
  id: 'csv-export',
  name: 'Export CSV',
  description: 'Exporte la bibliothèque au format CSV',
  version: '1.0.0',
  author: 'Stomy Team',
  icon: 'FileSpreadsheet',

  // Configuration
  enabled: false,
  permissions: ['fs:write'],

  // Hooks
  async onEnable() {
    console.log('[CSVExportPlugin] Activé');
  },

  async onDisable() {
    console.log('[CSVExportPlugin] Désactivé');
  },

  // Actions
  actions: [
    {
      id: 'export-library',
      label: 'Exporter la bibliothèque en CSV',
      icon: 'FileSpreadsheet',
      context: 'library',
      onClick: async function () {
        try {
          console.log('[CSVExportPlugin] Starting export...');

          // Récupérer tous les livres
          const books = await libraryService.getBooks();

          if (books.length === 0) {
            await notificationService.notify({
              title: 'Export CSV',
              body: 'Aucun livre à exporter',
            });
            return;
          }

          // Demander où sauvegarder
          const filePath = await save({
            title: 'Exporter la bibliothèque',
            defaultPath: `bibliotheque-${new Date().toISOString().split('T')[0]}.csv`,
            filters: [
              {
                name: 'CSV',
                extensions: ['csv'],
              },
            ],
          });

          if (!filePath) {
            console.log('[CSVExportPlugin] Export cancelled');
            return;
          }

          // Générer le CSV
          const csv = generateCsv(books);

          // Sauvegarder le fichier
          await writeTextFile(filePath, csv);

          console.log(`[CSVExportPlugin] Exported ${books.length} books to ${filePath}`);

          await notificationService.notify({
            title: 'Export CSV',
            body: `${books.length} livres exportés avec succès`,
          });
        } catch (error) {
          console.error('[CSVExportPlugin] Export failed:', error);
          await notificationService.notify({
            title: 'Export CSV',
            body: `Erreur lors de l'export: ${error}`,
          });
        }
      },
    },
  ],

  // Méthode d'export programmatique
  async export(books: Book[], options?: any): Promise<ExportResult> {
    try {
      const filePath = options?.filePath;
      if (!filePath) {
        throw new Error('filePath is required in options');
      }

      const csv = generateCsv(books);
      await writeTextFile(filePath, csv);

      return {
        success: true,
        filePath,
        itemCount: books.length,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  },
};
