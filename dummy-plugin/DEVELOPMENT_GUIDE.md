# Guide de Développement de Plugins Stomy

Guide pas-à-pas pour créer votre premier plugin Stomy.

## 🚀 Démarrage Rapide

### 1. Créer la Structure

```bash
cd stomy-plugins
mkdir my-plugin
cd my-plugin
touch index.ts types.ts README.md
```

### 2. Plugin Minimal

Créer `index.ts` :

```typescript
import type { Plugin } from '../types';

export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'Description of my plugin',
  version: '1.0.0',
  author: 'Your Name',
  enabled: false,
  icon: 'PuzzlePieceRegular',
};

export default myPlugin;
```

### 3. Enregistrer le Plugin

Dans l'app principale (`src/plugins/index.ts`) :

```typescript
import { myPlugin } from './core/my-plugin';

export async function initializePlugins() {
  await pluginManager.initialize();
  await pluginManager.registerPlugin(myPlugin);
}
```

### 4. Tester

```bash
cd ../app-principale
npm run tauri:dev
```

Naviguez vers **Settings > Plugins** et activez votre plugin.

## 📚 Étapes de Développement

### Étape 1 : Définir les Types

Créer `types.ts` :

```typescript
export interface MyPluginSettings {
  apiKey: string;
  enabled: boolean;
  maxItems: number;
}

export interface MyData {
  id: string;
  name: string;
  value: number;
}

export interface MyResult {
  success: boolean;
  data?: MyData[];
  error?: string;
}
```

### Étape 2 : Implémenter les Settings

```typescript
import type { Plugin } from '../types';
import type { MyPluginSettings } from './types';

export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  // ... autres propriétés

  settings: {
    apiKey: '',
    enabled: true,
    maxItems: 100,
  } as MyPluginSettings,
};
```

### Étape 3 : Ajouter des Actions

```typescript
import { notificationService } from '../../services/notificationService';

export const myPlugin: Plugin = {
  // ... propriétés existantes

  actions: [
    {
      id: 'do-something',
      label: 'Faire quelque chose',
      icon: 'PlayRegular',
      context: 'global',
      onClick: async () => {
        try {
          // Votre logique
          await notificationService.notify({
            title: 'My Plugin',
            body: 'Action exécutée !',
          });
        } catch (error) {
          await notificationService.notify({
            title: 'My Plugin',
            body: `Erreur : ${error}`,
          });
        }
      },
    },
  ],
};
```

### Étape 4 : Implémenter les Hooks

```typescript
export const myPlugin: Plugin = {
  // ... propriétés existantes

  onInstall: async () => {
    console.log('[MyPlugin] Installing...');

    // Initialiser la base de données
    await initializeDatabase();

    await notificationService.notify({
      title: 'My Plugin',
      body: 'Plugin installé avec succès',
    });
  },

  onEnable: async () => {
    console.log('[MyPlugin] Enabling...');
    // Démarrer les services
    await startServices();
  },

  onDisable: async () => {
    console.log('[MyPlugin] Disabling...');
    // Arrêter les services
    await stopServices();
  },

  onUninstall: async () => {
    console.log('[MyPlugin] Uninstalling...');
    // Nettoyer les données
    await cleanup();
  },
};
```

### Étape 5 : Accéder aux Services

```typescript
import { libraryService } from '../../services/libraryService';
import { dbService } from '../../services';

// Dans une action
actions: [{
  id: 'export-books',
  label: 'Exporter les livres',
  icon: 'ArrowDownloadRegular',
  context: 'library',
  onClick: async () => {
    // Récupérer les livres
    const books = await libraryService.getBooks();

    // Traiter les données
    const exported = await processBooks(books);

    // Sauvegarder
    await saveToFile(exported);
  },
}],
```

## 🔧 Fonctionnalités Avancées

### Plugin avec Backend Rust

#### 1. Créer le Module Rust

Créer `my_plugin_commands.rs` :

```rust
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessResult {
    pub items_processed: usize,
    pub duration_ms: u64,
}

#[command]
pub async fn process_data(data: Vec<String>) -> Result<ProcessResult, String> {
    let start = std::time::Instant::now();

    // Votre logique
    let items_processed = data.len();

    Ok(ProcessResult {
        items_processed,
        duration_ms: start.elapsed().as_millis() as u64,
    })
}
```

#### 2. Intégrer dans main.rs

```rust
mod my_plugin_commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_plugin_commands::process_data,
        ])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

#### 3. Appeler depuis TypeScript

```typescript
import { invoke } from '@tauri-apps/api/core';

actions: [{
  id: 'process',
  label: 'Traiter',
  icon: 'PlayRegular',
  context: 'global',
  onClick: async () => {
    const data = ['item1', 'item2', 'item3'];

    const result = await invoke<ProcessResult>('process_data', { data });

    await notificationService.notify({
      title: 'My Plugin',
      body: `${result.items_processed} items traités en ${result.duration_ms}ms`,
    });
  },
}],
```

### Plugin avec Sidebar

#### 1. Configuration dans le Plugin

```typescript
export const myPlugin: Plugin = {
  // ... autres propriétés

  sidebar: {
    id: 'my-plugin-tab',
    label: 'My Plugin',
    icon: 'AppsRegular',
    position: 'bottom',
    color: '#3b82f6',
    component: 'MyPluginPanel',
  },
};
```

#### 2. Créer le Composant Panel

Dans l'app principale, créer `src/components/plugins/MyPluginPanel.tsx` :

```tsx
import React, { useState, useEffect } from 'react';
import { ArrowDownloadRegular } from '@fluentui/react-icons';
import { pluginManager } from '@/plugins';

export function MyPluginPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les données
      const result = await fetchData();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">My Plugin</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {data.map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          <ArrowDownloadRegular className="w-4 h-4 mr-2" />
          Actualiser
        </button>
      </div>
    </div>
  );
}
```

### Plugin ExportPlugin

Pour créer un plugin d'export :

```typescript
import type { ExportPlugin, ExportResult } from '../types';
import type { Book } from '../../types/models';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export const myExportPlugin: ExportPlugin = {
  id: 'my-export',
  name: 'My Export',
  // ... autres propriétés

  async export(books: Book[], options?: any): Promise<ExportResult> {
    try {
      // Demander où sauvegarder
      const filePath = options?.filePath || await save({
        title: 'Exporter',
        defaultPath: 'export.txt',
        filters: [{ name: 'Text', extensions: ['txt'] }],
      });

      if (!filePath) {
        return { success: false, error: 'No file selected' };
      }

      // Générer le contenu
      const content = generateExportContent(books);

      // Écrire le fichier
      await writeTextFile(filePath, content);

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

function generateExportContent(books: Book[]): string {
  return books.map(book => `${book.title} - ${book.author}`).join('\n');
}
```

## 🧪 Testing

### Test Manuel

1. Activer le plugin dans Settings > Plugins
2. Tester chaque action une par une
3. Vérifier les notifications
4. Vérifier la console pour les logs
5. Tester les scénarios d'erreur

### Test des Hooks

```typescript
// Tester dans l'ordre
1. onInstall → Activer le plugin la première fois
2. onEnable → Activer/désactiver plusieurs fois
3. onDisable → Désactiver le plugin
4. onUpdate → Changer la version et réinstaller
5. onUninstall → Désinstaller complètement
```

### Test avec Données Réelles

```typescript
actions: [{
  id: 'test-with-real-data',
  label: 'Test avec données réelles',
  icon: 'BeakerRegular',
  context: 'settings',
  onClick: async () => {
    try {
      const books = await libraryService.getBooks();
      console.log(`Testing with ${books.length} books`);

      // Votre logique de test
      const result = await processBooks(books);

      console.log('Test result:', result);

      await notificationService.notify({
        title: 'Test',
        body: `Test réussi : ${result.itemsProcessed} items`,
      });
    } catch (error) {
      console.error('Test failed:', error);
      await notificationService.notify({
        title: 'Test',
        body: `Échec : ${error}`,
      });
    }
  },
}],
```

## 📦 Organisation du Code

### Structure Recommandée

```
my-plugin/
├── index.ts                    # Point d'entrée
├── types.ts                    # Types TypeScript
├── MyPlugin.ts                 # Implémentation principale
├── services/                   # Services du plugin
│   ├── exportService.ts
│   └── syncService.ts
├── utils/                      # Utilitaires
│   ├── formatters.ts
│   └── validators.ts
├── components/                 # Composants React (si UI)
│   └── MyPanel.tsx
├── backend/                    # Code Rust (si nécessaire)
│   └── commands.rs
├── README.md                   # Documentation
└── manifest.json               # Métadonnées
```

### Séparation des Préoccupations

```typescript
// index.ts - Point d'entrée simple
export * from './types';
export * from './MyPlugin';
export { myPlugin as default } from './MyPlugin';

// MyPlugin.ts - Implémentation principale
import { exportService } from './services/exportService';

export const myPlugin: Plugin = {
  id: 'my-plugin',
  // ... configuration

  actions: [
    {
      id: 'export',
      label: 'Export',
      onClick: async () => {
        await exportService.export();
      },
    },
  ],
};

// services/exportService.ts - Logique métier
export const exportService = {
  async export() {
    // Logique d'export
  },
};
```

## 🐛 Debugging

### Logs Structurés

```typescript
const LOG_PREFIX = '[MyPlugin]';

console.log(`${LOG_PREFIX} Plugin enabled`);
console.error(`${LOG_PREFIX} Error:`, error);
console.warn(`${LOG_PREFIX} Warning: API key not set`);
console.debug(`${LOG_PREFIX} Debug data:`, data);
```

### Try-Catch Partout

```typescript
async onEnable() {
  try {
    await this.startServices();
  } catch (error) {
    console.error('[MyPlugin] Failed to enable:', error);
    await notificationService.notify({
      title: 'My Plugin',
      body: `Erreur d'activation : ${error}`,
    });
    throw error; // Re-throw pour que le pluginManager soit au courant
  }
}
```

### Vérifications de Settings

```typescript
actions: [{
  id: 'my-action',
  label: 'My Action',
  onClick: async () => {
    const settings = myPlugin.settings as MyPluginSettings;

    if (!settings.apiKey) {
      await notificationService.notify({
        title: 'My Plugin',
        body: 'Veuillez configurer l\'API key dans les paramètres',
      });
      return;
    }

    // Continue...
  },
}],
```

## 📝 Documentation

### README.md Minimal

```markdown
# My Plugin

Description courte du plugin.

## Features

- Feature 1
- Feature 2
- Feature 3

## Configuration

1. Activer le plugin
2. Configurer l'API key
3. Utiliser les actions

## Usage

...
```

### JSDoc

```typescript
/**
 * Export books to a custom format
 *
 * @param books - Array of books to export
 * @param options - Export options
 * @returns Export result with file path and count
 *
 * @example
 * ```typescript
 * const result = await exportBooks(books, { format: 'json' });
 * console.log(`Exported to ${result.filePath}`);
 * ```
 */
export async function exportBooks(
  books: Book[],
  options?: ExportOptions
): Promise<ExportResult> {
  // ...
}
```

## 🚢 Publication

### Checklist

- [ ] README.md complet
- [ ] Types TypeScript documentés
- [ ] Toutes les actions fonctionnent
- [ ] Gestion d'erreurs complète
- [ ] Notifications pour les opérations longues
- [ ] Logs structurés
- [ ] Tests manuels effectués
- [ ] Version semver correcte
- [ ] Icon Fluent UI valide
- [ ] Pas de credentials en dur

### Pull Request

1. Fork du dépôt
2. Créer une branche : `feat/my-plugin`
3. Commit : `feat: add my-plugin for feature X`
4. Push et créer la PR
5. Décrire les fonctionnalités

## 💡 Astuces

### Performance

- Utiliser `async/await` correctement
- Éviter les boucles synchrones sur grandes données
- Utiliser des workers pour traitement lourd
- Cache les résultats quand possible

### UX

- Toujours afficher une notification après une action
- Utiliser des loading states
- Gérer les erreurs gracefully
- Donner du feedback à l'utilisateur

### Maintenance

- Versionner correctement (semver)
- Logger les erreurs importantes
- Documenter les breaking changes
- Garder le code simple et lisible
