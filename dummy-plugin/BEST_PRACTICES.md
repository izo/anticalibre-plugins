# Meilleures Pratiques pour les Plugins Stomy

Guide des bonnes pratiques pour développer des plugins maintenables et performants.

## 🎯 Principes Généraux

### 1. Keep It Simple, Stupid (KISS)

```typescript
// ❌ Mauvais - Trop complexe
async function processBooks(books: Book[]) {
  return await Promise.all(
    books.map(async book => {
      const metadata = await fetchMetadata(book.isbn);
      const enriched = await enrichBook(book, metadata);
      const validated = await validateBook(enriched);
      return await transformBook(validated);
    })
  );
}

// ✅ Bon - Simple et lisible
async function processBooks(books: Book[]) {
  const processed = [];

  for (const book of books) {
    const metadata = await fetchMetadata(book.isbn);
    const result = enrichBookWithMetadata(book, metadata);
    processed.push(result);
  }

  return processed;
}
```

### 2. Don't Repeat Yourself (DRY)

```typescript
// ❌ Mauvais - Code dupliqué
actions: [
  {
    id: 'action1',
    onClick: async () => {
      try {
        // logique
      } catch (error) {
        await notificationService.notify({
          title: 'Error',
          body: String(error),
        });
      }
    },
  },
  {
    id: 'action2',
    onClick: async () => {
      try {
        // logique
      } catch (error) {
        await notificationService.notify({
          title: 'Error',
          body: String(error),
        });
      }
    },
  },
]

// ✅ Bon - Fonction utilitaire
function withErrorHandling(fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
    } catch (error) {
      await notificationService.notify({
        title: 'Error',
        body: String(error),
      });
    }
  };
}

actions: [
  {
    id: 'action1',
    onClick: withErrorHandling(async () => {
      // logique
    }),
  },
  {
    id: 'action2',
    onClick: withErrorHandling(async () => {
      // logique
    }),
  },
]
```

## 📝 Conventions de Code

### Nommage

```typescript
// IDs - kebab-case
id: 'my-plugin'
id: 'export-library'

// Variables/Fonctions - camelCase
const bookCount = 10;
function exportBooks() {}

// Types/Interfaces - PascalCase
interface PluginSettings {}
type ExportResult = {};

// Constants - SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const API_TIMEOUT_MS = 5000;
```

### Structure de Fichiers

```typescript
// ✅ index.ts - Point d'entrée clair
export * from './types';
export * from './MyPlugin';
export { myPlugin as default } from './MyPlugin';

// ✅ MyPlugin.ts - Implémentation séparée
import type { Plugin } from '../types';
export const myPlugin: Plugin = { /* ... */ };

// ✅ types.ts - Types dédiés
export interface MyPluginSettings { /* ... */ }
export interface MyResult { /* ... */ }
```

## 🔒 Gestion d'Erreurs

### Try-Catch Partout

```typescript
// ❌ Mauvais
async onEnable() {
  await this.startService();
}

// ✅ Bon
async onEnable() {
  try {
    await this.startService();
  } catch (error) {
    console.error('[MyPlugin] Failed to enable:', error);
    await notificationService.notify({
      title: 'My Plugin',
      body: `Erreur d'activation : ${error}`,
    });
    // Re-throw pour que le pluginManager soit informé
    throw error;
  }
}
```

### Messages d'Erreur Clairs

```typescript
// ❌ Mauvais
throw new Error('Error');

// ✅ Bon
throw new Error('Failed to export books: Invalid file path');

// ✅ Encore mieux
class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

throw new PluginError(
  'Failed to export books',
  'INVALID_FILE_PATH',
  { path: filePath }
);
```

### Validation des Entrées

```typescript
// ✅ Valider les settings
actions: [{
  id: 'export',
  onClick: async () => {
    const settings = myPlugin.settings as MySettings;

    // Vérifier les prérequis
    if (!settings.apiKey) {
      await notificationService.notify({
        title: 'My Plugin',
        body: 'API key non configurée',
      });
      return;
    }

    if (settings.timeout < 1000) {
      console.warn('[MyPlugin] Timeout too low, using minimum');
      settings.timeout = 1000;
    }

    // Continue...
  },
}],
```

## 🚀 Performance

### Éviter les Boucles Synchrones

```typescript
// ❌ Mauvais - Bloque l'UI
for (const book of books) {
  await processBook(book);
}

// ✅ Bon - Traitement par batch
const BATCH_SIZE = 10;
for (let i = 0; i < books.length; i += BATCH_SIZE) {
  const batch = books.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(processBook));

  // Feedback de progression
  const progress = ((i + batch.length) / books.length) * 100;
  console.log(`Progress: ${progress.toFixed(0)}%`);
}
```

### Cache Intelligent

```typescript
// ✅ Cache avec expiration
const cache = new Map<string, { data: any; expires: number }>();

async function fetchWithCache(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, {
    data,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return data;
}
```

### Debounce des Actions

```typescript
// ✅ Éviter les appels répétés
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;

  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchBooks(query);
  updateUI(results);
}, 300);
```

## 💬 Feedback Utilisateur

### Notifications Appropriées

```typescript
// ❌ Mauvais - Trop de notifications
await notificationService.notify({ title: 'Step 1', body: 'Done' });
await notificationService.notify({ title: 'Step 2', body: 'Done' });
await notificationService.notify({ title: 'Step 3', body: 'Done' });

// ✅ Bon - Notification finale
console.log('[MyPlugin] Step 1 done');
console.log('[MyPlugin] Step 2 done');
console.log('[MyPlugin] Step 3 done');

await notificationService.notify({
  title: 'My Plugin',
  body: 'Opération terminée avec succès',
});
```

### Loading States

```typescript
// ✅ Indiquer les opérations longues
actions: [{
  id: 'long-operation',
  onClick: async () => {
    await notificationService.notify({
      title: 'My Plugin',
      body: 'Traitement en cours...',
    });

    try {
      const result = await performLongOperation();

      await notificationService.notify({
        title: 'My Plugin',
        body: `Terminé: ${result.count} items`,
      });
    } catch (error) {
      await notificationService.notify({
        title: 'My Plugin',
        body: `Erreur: ${error}`,
      });
    }
  },
}],
```

## 🔐 Sécurité

### Pas de Credentials en Dur

```typescript
// ❌ Mauvais
const API_KEY = 'sk-1234567890abcdef';

// ✅ Bon - Dans les settings
settings: {
  apiKey: '', // L'utilisateur configure
}
```

### Validation des Données Externes

```typescript
// ✅ Valider les réponses API
const response = await fetch(url);
const data = await response.json();

// Valider la structure
if (!data || typeof data.result !== 'object') {
  throw new Error('Invalid API response');
}

// Sanitiser les données
const sanitized = {
  title: String(data.result.title || '').slice(0, 200),
  count: Math.max(0, Math.min(1000, Number(data.result.count) || 0)),
};
```

### Permissions Minimales

```typescript
// ❌ Mauvais
permissions: ['tauri:*', 'fs:*', 'shell:*']

// ✅ Bon - Seulement ce qui est nécessaire
permissions: ['fs:read', 'dialog:*']
```

## 📊 Logging

### Logs Structurés

```typescript
// ✅ Préfixe cohérent
const LOG_PREFIX = '[MyPlugin]';

console.log(`${LOG_PREFIX} Initialized`);
console.warn(`${LOG_PREFIX} Warning: API key not set`);
console.error(`${LOG_PREFIX} Error:`, error);
console.debug(`${LOG_PREFIX} Debug data:`, { book, settings });
```

### Niveaux de Log

```typescript
// ✅ Utiliser les bons niveaux
// debug - Détails de développement
console.debug('[MyPlugin] Processing book:', book.id);

// log - Informations normales
console.log('[MyPlugin] Export completed');

// warn - Problèmes non critiques
console.warn('[MyPlugin] Using default timeout');

// error - Erreurs
console.error('[MyPlugin] Failed to connect:', error);
```

## 🧪 Testabilité

### Fonctions Pures

```typescript
// ✅ Fonction pure - facile à tester
export function formatBookTitle(title: string): string {
  return title.trim().toLowerCase();
}

// ✅ Séparation de la logique et des effets
export function calculateExportData(books: Book[]) {
  return {
    count: books.length,
    totalSize: books.reduce((sum, b) => sum + (b.fileSize || 0), 0),
  };
}

export async function exportBooks(books: Book[]) {
  const data = calculateExportData(books); // Testable
  await writeToFile(data); // Effet de bord isolé
}
```

### Dépendances Injectées

```typescript
// ✅ Injection de dépendances
interface Services {
  notification: typeof notificationService;
  library: typeof libraryService;
}

export function createPlugin(services: Services): Plugin {
  return {
    id: 'my-plugin',
    actions: [{
      onClick: async () => {
        const books = await services.library.getBooks();
        await services.notification.notify({ /* ... */ });
      },
    }],
  };
}

// Facile à tester avec des mocks
const mockServices = {
  notification: { notify: jest.fn() },
  library: { getBooks: jest.fn() },
};
const plugin = createPlugin(mockServices);
```

## 📚 Documentation

### JSDoc pour les APIs Publiques

```typescript
/**
 * Export books to a specified format
 *
 * @param books - Array of books to export
 * @param options - Export options
 * @param options.format - Output format (json, csv, xml)
 * @param options.filePath - Destination file path
 * @returns Export result with file path and item count
 *
 * @throws {PluginError} If format is invalid or file cannot be written
 *
 * @example
 * ```typescript
 * const result = await exportBooks(books, {
 *   format: 'json',
 *   filePath: '/path/to/export.json',
 * });
 * console.log(`Exported ${result.itemCount} books`);
 * ```
 */
export async function exportBooks(
  books: Book[],
  options: ExportOptions
): Promise<ExportResult> {
  // ...
}
```

### README Complet

````markdown
# My Plugin

## Description

Une description claire de ce que fait le plugin.

## Installation

1. Étape 1
2. Étape 2

## Configuration

```json
{
  "apiKey": "your-key",
  "timeout": 5000
}
```

## Usage

...

## Troubleshooting

### Problème 1

Solution...
````

## 🔄 Maintenance

### Versioning Semver

```
1.0.0 - Release initiale
1.0.1 - Bug fix (pas de breaking change)
1.1.0 - Nouvelle feature (compatible)
2.0.0 - Breaking change
```

### Migrations dans onUpdate

```typescript
onUpdate: async (oldVersion: string, newVersion: string) => {
  // Migration 1.x.x → 2.x.x
  if (oldVersion.startsWith('1.') && newVersion.startsWith('2.')) {
    await migrateSettingsV1ToV2();
  }

  // Migration 2.0.x → 2.1.x
  if (oldVersion.startsWith('2.0.') && newVersion.startsWith('2.1.')) {
    await addNewFeatureData();
  }
}
```

### Deprecation Warnings

```typescript
// Marquer comme deprecated
/**
 * @deprecated Use newMethod() instead
 */
export function oldMethod() {
  console.warn('[MyPlugin] oldMethod is deprecated, use newMethod');
  return newMethod();
}

export function newMethod() {
  // nouvelle implémentation
}
```

## 🎨 UI/UX

### Actions Contextuelles

```typescript
// ✅ Actions adaptées au contexte
actions: [
  // Global - disponible partout
  {
    id: 'settings',
    context: 'global',
    onClick: () => openSettings(),
  },
  // Library - dans la bibliothèque
  {
    id: 'export-all',
    context: 'library',
    onClick: () => exportLibrary(),
  },
  // Book - sur un livre spécifique
  {
    id: 'convert',
    context: 'book',
    onClick: (data) => convertBook(data.bookId),
  },
],
```

### Icons Appropriées

```typescript
// ✅ Icons qui ont du sens
{
  id: 'export',
  icon: 'ArrowDownloadRegular', // Export/Download
}
{
  id: 'settings',
  icon: 'SettingsRegular', // Configuration
}
{
  id: 'sync',
  icon: 'ArrowSyncRegular', // Synchronisation
}
{
  id: 'delete',
  icon: 'DeleteRegular', // Suppression
}
```

## 🌐 Internationalisation

```typescript
// ✅ Préparer pour i18n
const messages = {
  success: 'Export completed successfully',
  error: 'Failed to export',
  noBooks: 'No books to export',
};

// Plus tard, facile d'ajouter d'autres langues
const messages_fr = {
  success: 'Export terminé avec succès',
  error: 'Échec de l\'export',
  noBooks: 'Aucun livre à exporter',
};
```

## ✅ Checklist Avant Publication

- [ ] README.md complet
- [ ] Types TypeScript documentés
- [ ] Gestion d'erreurs complète
- [ ] Logs structurés avec préfixe
- [ ] Notifications appropriées
- [ ] Pas de credentials en dur
- [ ] Permissions minimales
- [ ] Code formaté et lint
- [ ] Version semver correcte
- [ ] Tests manuels effectués
- [ ] Exemples de code fournis
- [ ] Migration path documentée
