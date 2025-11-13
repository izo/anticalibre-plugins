# Exemples de Plugins Stomy

Collection d'exemples de plugins pour différents cas d'usage.

## Table des Matières

1. [Plugin Simple](#plugin-simple)
2. [Plugin avec Settings](#plugin-avec-settings)
3. [Plugin Export](#plugin-export)
4. [Plugin Sync](#plugin-sync)
5. [Plugin avec Backend Rust](#plugin-avec-backend-rust)
6. [Plugin avec Sidebar](#plugin-avec-sidebar)
7. [Plugin avec Base de Données](#plugin-avec-base-de-données)
8. [Plugin avec API Externe](#plugin-avec-api-externe)

## Plugin Simple

Le plugin le plus basique possible.

```typescript
import type { Plugin } from '../types';
import { notificationService } from '../../services/notificationService';

export const simplePlugin: Plugin = {
  id: 'simple-plugin',
  name: 'Simple Plugin',
  description: 'Un plugin simple avec une seule action',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'PuzzlePieceRegular',

  actions: [
    {
      id: 'say-hello',
      label: 'Dire Bonjour',
      icon: 'EmojiRegular',
      context: 'global',
      onClick: async () => {
        await notificationService.notify({
          title: 'Simple Plugin',
          body: 'Bonjour depuis le plugin!',
        });
      },
    },
  ],
};

export default simplePlugin;
```

## Plugin avec Settings

Plugin avec configuration utilisateur.

```typescript
import type { Plugin } from '../types';
import { notificationService } from '../../services/notificationService';

interface GreeterSettings {
  userName: string;
  greeting: string;
  showTimestamp: boolean;
}

export const greeterPlugin: Plugin = {
  id: 'greeter-plugin',
  name: 'Greeter Plugin',
  description: 'Plugin avec paramètres configurables',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'PersonRegular',

  settings: {
    userName: 'User',
    greeting: 'Hello',
    showTimestamp: true,
  } as GreeterSettings,

  actions: [
    {
      id: 'greet-user',
      label: 'Saluer',
      icon: 'ChatRegular',
      context: 'global',
      onClick: async function () {
        const settings = greeterPlugin.settings as GreeterSettings;

        let message = `${settings.greeting}, ${settings.userName}!`;

        if (settings.showTimestamp) {
          const time = new Date().toLocaleTimeString();
          message += ` (${time})`;
        }

        await notificationService.notify({
          title: 'Greeter',
          body: message,
        });
      },
    },
  ],
};

export default greeterPlugin;
```

## Plugin Export

Plugin d'export au format JSON.

```typescript
import type { ExportPlugin, ExportResult } from '../types';
import type { Book } from '../../types/models';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { notificationService } from '../../services/notificationService';
import { libraryService } from '../../services/libraryService';

export const jsonExportPlugin: ExportPlugin = {
  id: 'json-export',
  name: 'JSON Export',
  description: 'Exporte la bibliothèque au format JSON',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'DocumentBracketsRegular',

  permissions: ['fs:write', 'dialog:*'],

  actions: [
    {
      id: 'export-json',
      label: 'Exporter en JSON',
      icon: 'ArrowDownloadRegular',
      context: 'library',
      onClick: async function () {
        try {
          const books = await libraryService.getBooks();

          const filePath = await save({
            title: 'Exporter en JSON',
            defaultPath: `library-${Date.now()}.json`,
            filters: [{ name: 'JSON', extensions: ['json'] }],
          });

          if (!filePath) return;

          const result = await jsonExportPlugin.export(books, { filePath });

          if (result.success) {
            await notificationService.notify({
              title: 'JSON Export',
              body: `${result.itemCount} livres exportés`,
            });
          }
        } catch (error) {
          await notificationService.notify({
            title: 'JSON Export',
            body: `Erreur : ${error}`,
          });
        }
      },
    },
  ],

  async export(books: Book[], options?: any): Promise<ExportResult> {
    try {
      const json = JSON.stringify(books, null, 2);
      await writeTextFile(options.filePath, json);

      return {
        success: true,
        filePath: options.filePath,
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

export default jsonExportPlugin;
```

## Plugin Sync

Plugin de synchronisation avec appareil USB.

```typescript
import type { Plugin } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { notificationService } from '../../services/notificationService';

interface UsbDevice {
  id: string;
  name: string;
  path: string;
  capacity: number;
}

let currentDevice: UsbDevice | null = null;

export const usbSyncPlugin: Plugin = {
  id: 'usb-sync',
  name: 'USB Sync',
  description: 'Synchronisation avec clés USB',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'UsbStickRegular',

  permissions: ['fs:read', 'fs:write'],

  actions: [
    {
      id: 'detect-usb',
      label: 'Détecter USB',
      icon: 'SearchRegular',
      context: 'global',
      onClick: async () => {
        try {
          const devices = await invoke<UsbDevice[]>('detect_usb_devices');

          if (devices.length === 0) {
            await notificationService.notify({
              title: 'USB Sync',
              body: 'Aucun périphérique détecté',
            });
            return;
          }

          currentDevice = devices[0];

          await notificationService.notify({
            title: 'USB Sync',
            body: `${currentDevice.name} détecté`,
          });
        } catch (error) {
          await notificationService.notify({
            title: 'USB Sync',
            body: `Erreur : ${error}`,
          });
        }
      },
    },
    {
      id: 'sync-to-usb',
      label: 'Synchroniser',
      icon: 'ArrowSyncRegular',
      context: 'library',
      onClick: async () => {
        if (!currentDevice) {
          await notificationService.notify({
            title: 'USB Sync',
            body: 'Aucun périphérique connecté',
          });
          return;
        }

        try {
          await notificationService.notify({
            title: 'USB Sync',
            body: 'Synchronisation en cours...',
          });

          const result = await invoke<{ count: number }>('sync_to_device', {
            devicePath: currentDevice.path,
          });

          await notificationService.notify({
            title: 'USB Sync',
            body: `${result.count} fichiers synchronisés`,
          });
        } catch (error) {
          await notificationService.notify({
            title: 'USB Sync',
            body: `Erreur : ${error}`,
          });
        }
      },
    },
  ],
};

export default usbSyncPlugin;
```

## Plugin avec Backend Rust

Plugin avec commandes Rust pour traitement performant.

### TypeScript

```typescript
import type { Plugin } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { notificationService } from '../../services/notificationService';
import { libraryService } from '../../services/libraryService';

interface AnalysisResult {
  total_books: number;
  total_size_mb: number;
  formats: Record<string, number>;
  top_authors: Array<{ name: string; count: number }>;
}

export const analyticsPlugin: Plugin = {
  id: 'analytics',
  name: 'Library Analytics',
  description: 'Analyse statistiques de la bibliothèque',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'ChartMultipleRegular',

  permissions: ['tauri:*'],

  actions: [
    {
      id: 'analyze-library',
      label: 'Analyser la bibliothèque',
      icon: 'BeakerRegular',
      context: 'library',
      onClick: async () => {
        try {
          const books = await libraryService.getBooks();

          await notificationService.notify({
            title: 'Analytics',
            body: 'Analyse en cours...',
          });

          const result = await invoke<AnalysisResult>('analyze_library', {
            books: books.map(b => ({
              title: b.title,
              author: b.author,
              format: b.format,
              size: b.fileSize || 0,
            })),
          });

          const message = `
Total: ${result.total_books} livres
Taille: ${result.total_size_mb.toFixed(2)} MB
Top auteur: ${result.top_authors[0]?.name}
          `.trim();

          alert(message);
        } catch (error) {
          await notificationService.notify({
            title: 'Analytics',
            body: `Erreur : ${error}`,
          });
        }
      },
    },
  ],
};

export default analyticsPlugin;
```

### Rust Backend

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Debug, Deserialize)]
pub struct BookData {
    pub title: String,
    pub author: String,
    pub format: String,
    pub size: u64,
}

#[derive(Debug, Serialize)]
pub struct AnalysisResult {
    pub total_books: usize,
    pub total_size_mb: f64,
    pub formats: HashMap<String, usize>,
    pub top_authors: Vec<AuthorCount>,
}

#[derive(Debug, Serialize)]
pub struct AuthorCount {
    pub name: String,
    pub count: usize,
}

#[command]
pub async fn analyze_library(books: Vec<BookData>) -> Result<AnalysisResult, String> {
    let total_books = books.len();

    // Calculer la taille totale
    let total_size: u64 = books.iter().map(|b| b.size).sum();
    let total_size_mb = total_size as f64 / (1024.0 * 1024.0);

    // Compter les formats
    let mut formats: HashMap<String, usize> = HashMap::new();
    for book in &books {
        *formats.entry(book.format.clone()).or_insert(0) += 1;
    }

    // Compter les auteurs
    let mut author_counts: HashMap<String, usize> = HashMap::new();
    for book in &books {
        *author_counts.entry(book.author.clone()).or_insert(0) += 1;
    }

    // Top auteurs
    let mut top_authors: Vec<AuthorCount> = author_counts
        .into_iter()
        .map(|(name, count)| AuthorCount { name, count })
        .collect();

    top_authors.sort_by(|a, b| b.count.cmp(&a.count));
    top_authors.truncate(10);

    Ok(AnalysisResult {
        total_books,
        total_size_mb,
        formats,
        top_authors,
    })
}
```

## Plugin avec Sidebar

Plugin avec interface sidebar.

```typescript
import type { Plugin } from '../types';
import { notificationService } from '../../services/notificationService';

export const dashboardPlugin: Plugin = {
  id: 'dashboard',
  name: 'Dashboard',
  description: 'Tableau de bord personnalisé',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'GridRegular',

  sidebar: {
    id: 'dashboard-tab',
    label: 'Dashboard',
    icon: 'GridRegular',
    position: 'top',
    color: '#3b82f6',
    component: 'DashboardPanel',
  },

  onEnable: async () => {
    await notificationService.notify({
      title: 'Dashboard',
      body: 'Dashboard activé! Voir la sidebar.',
    });
  },
};

export default dashboardPlugin;
```

## Plugin avec Base de Données

Plugin qui stocke des données en base.

```typescript
import type { Plugin } from '../types';
import { dbService } from '../../services';
import { notificationService } from '../../services/notificationService';

interface ReadingHistory {
  book_id: string;
  read_at: string;
  duration_minutes: number;
}

export const historyPlugin: Plugin = {
  id: 'reading-history',
  name: 'Reading History',
  description: 'Suivi de l\'historique de lecture',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'HistoryRegular',

  permissions: ['tauri:*'],

  onInstall: async () => {
    // Créer la table
    await dbService.execute(`
      CREATE TABLE IF NOT EXISTS reading_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        read_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL
      )
    `);

    await notificationService.notify({
      title: 'Reading History',
      body: 'Base de données initialisée',
    });
  },

  actions: [
    {
      id: 'view-history',
      label: 'Voir l\'historique',
      icon: 'HistoryRegular',
      context: 'global',
      onClick: async () => {
        const history = await dbService.query<ReadingHistory[]>(
          'SELECT * FROM reading_history ORDER BY read_at DESC LIMIT 10'
        );

        console.log('Recent reading history:', history);

        const message = history.length > 0
          ? `${history.length} lectures récentes`
          : 'Aucun historique';

        await notificationService.notify({
          title: 'Reading History',
          body: message,
        });
      },
    },
    {
      id: 'log-reading',
      label: 'Logger une lecture',
      icon: 'AddRegular',
      context: 'book',
      onClick: async (data?: { bookId: string }) => {
        if (!data?.bookId) return;

        await dbService.execute(
          'INSERT INTO reading_history (book_id, read_at, duration_minutes) VALUES (?, ?, ?)',
          [data.bookId, new Date().toISOString(), 30]
        );

        await notificationService.notify({
          title: 'Reading History',
          body: 'Lecture enregistrée',
        });
      },
    },
  ],

  onUninstall: async () => {
    // Nettoyer la table
    await dbService.execute('DROP TABLE IF EXISTS reading_history');
  },
};

export default historyPlugin;
```

## Plugin avec API Externe

Plugin qui communique avec une API externe.

```typescript
import type { Plugin } from '../types';
import { notificationService } from '../../services/notificationService';

interface ApiSettings {
  apiKey: string;
  apiUrl: string;
}

interface BookMetadata {
  isbn: string;
  cover_url: string;
  description: string;
  rating: number;
}

export const metadataPlugin: Plugin = {
  id: 'metadata-fetcher',
  name: 'Metadata Fetcher',
  description: 'Récupère les métadonnées depuis une API externe',
  version: '1.0.0',
  author: 'Votre Nom',
  enabled: false,
  icon: 'CloudRegular',

  permissions: ['http:*'],

  settings: {
    apiKey: '',
    apiUrl: 'https://api.example.com',
  } as ApiSettings,

  actions: [
    {
      id: 'fetch-metadata',
      label: 'Récupérer métadonnées',
      icon: 'CloudArrowDownRegular',
      context: 'book',
      onClick: async (data?: { isbn: string }) => {
        const settings = metadataPlugin.settings as ApiSettings;

        if (!settings.apiKey) {
          await notificationService.notify({
            title: 'Metadata Fetcher',
            body: 'API key non configurée',
          });
          return;
        }

        if (!data?.isbn) {
          await notificationService.notify({
            title: 'Metadata Fetcher',
            body: 'ISBN manquant',
          });
          return;
        }

        try {
          const response = await fetch(
            `${settings.apiUrl}/books/${data.isbn}`,
            {
              headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const metadata: BookMetadata = await response.json();

          console.log('Fetched metadata:', metadata);

          await notificationService.notify({
            title: 'Metadata Fetcher',
            body: `Rating: ${metadata.rating}/5`,
          });
        } catch (error) {
          await notificationService.notify({
            title: 'Metadata Fetcher',
            body: `Erreur : ${error}`,
          });
        }
      },
    },
  ],
};

export default metadataPlugin;
```

## Utilisation des Exemples

Pour utiliser ces exemples :

1. Copier le code dans un nouveau fichier `index.ts`
2. Adapter les imports selon votre structure
3. Ajuster les types selon vos besoins
4. Tester dans l'application
5. Itérer et améliorer

Tous ces exemples sont des points de départ que vous pouvez étendre selon vos besoins spécifiques.
