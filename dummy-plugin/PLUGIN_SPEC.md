# Spécification du Système de Plugins Stomy

Ce document définit les spécifications complètes du système de plugins pour Stomy.

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Interface Plugin](#interface-plugin)
3. [Hooks du Cycle de Vie](#hooks-du-cycle-de-vie)
4. [Actions et Menu Items](#actions-et-menu-items)
5. [Settings Management](#settings-management)
6. [Services Disponibles](#services-disponibles)
7. [Types de Plugins](#types-de-plugins)
8. [Intégration Sidebar](#intégration-sidebar)
9. [Permissions](#permissions)
10. [Backend Rust](#backend-rust)

## Architecture

### Structure de Base

```
plugin-name/
├── index.ts              # Point d'entrée (REQUIS)
├── PluginName.ts         # Implémentation principale (optionnel)
├── types.ts              # Types TypeScript (optionnel)
├── manifest.json         # Métadonnées (optionnel)
├── README.md             # Documentation (recommandé)
├── *.rs                  # Modules Rust backend (optionnel)
└── components/           # Composants React (optionnel)
    └── *.tsx
```

### Import Pattern

Le fichier `index.ts` doit exporter le plugin :

```typescript
export const myPlugin: Plugin = { /* ... */ };
export default myPlugin;
```

## Interface Plugin

### Propriétés Requises

```typescript
interface Plugin {
  // Identifiants (REQUIS)
  id: string;           // Format: kebab-case (ex: 'my-plugin')
  name: string;         // Nom affiché dans l'UI
  description: string;  // Description courte
  version: string;      // Semver (ex: '1.0.0')
  author: string;       // Nom de l'auteur
  enabled: boolean;     // État initial
}
```

### Propriétés Optionnelles

```typescript
interface Plugin {
  // Métadonnées optionnelles
  icon?: string;                    // Icône Fluent UI (ex: 'PuzzlePieceRegular')
  repository?: string;              // URL du dépôt Git
  updateUrl?: string;               // URL pour vérifier les mises à jour

  // Configuration
  settings?: Record<string, any>;   // Settings persistés en DB
  permissions?: string[];           // Permissions Tauri requises

  // Fonctionnalités
  actions?: PluginAction[];         // Actions exposées dans l'UI
  menuItems?: MenuItem[];           // Items de menu
  sidebar?: SidebarConfig;          // Configuration sidebar

  // Lifecycle hooks (tous optionnels)
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUpdate?: (oldVersion: string, newVersion: string) => Promise<void>;
}
```

## Hooks du Cycle de Vie

### onInstall

Appelé une seule fois lors de l'installation du plugin.

```typescript
onInstall: async () => {
  // Initialisation des données
  // Configuration initiale
  // Migration de données si nécessaire

  await notificationService.notify({
    title: 'Mon Plugin',
    body: 'Plugin installé avec succès',
  });
}
```

**Use cases** :
- Créer des tables/collections en base
- Initialiser des settings par défaut
- Afficher un message de bienvenue

### onUninstall

Appelé lors de la désinstallation du plugin.

```typescript
onUninstall: async () => {
  // Nettoyer les données
  // Supprimer les settings
  // Fermer les connexions

  console.log('[MyPlugin] Cleanup completed');
}
```

**Use cases** :
- Nettoyer les données du plugin
- Supprimer les fichiers temporaires
- Fermer les connexions externes

### onEnable

Appelé chaque fois que le plugin est activé.

```typescript
onEnable: async () => {
  // Démarrer les services
  // Enregistrer les listeners
  // Initialiser l'état

  console.log('[MyPlugin] Enabled');
}
```

**Use cases** :
- Démarrer des services background
- Enregistrer des event listeners
- Initialiser des connexions

### onDisable

Appelé chaque fois que le plugin est désactivé.

```typescript
onDisable: async () => {
  // Arrêter les services
  // Désenregistrer les listeners
  // Nettoyer l'état temporaire

  console.log('[MyPlugin] Disabled');
}
```

**Use cases** :
- Arrêter des services background
- Nettoyer des event listeners
- Fermer des connexions

### onUpdate

Appelé lors de la mise à jour du plugin.

```typescript
onUpdate: async (oldVersion: string, newVersion: string) => {
  console.log(`Updating from ${oldVersion} to ${newVersion}`);

  // Migration de settings
  if (oldVersion === '1.0.0' && newVersion === '2.0.0') {
    // Migrer les anciennes settings
    await migrateSettings();
  }

  await notificationService.notify({
    title: 'Mon Plugin',
    body: `Mis à jour vers ${newVersion}`,
  });
}
```

**Use cases** :
- Migrer les données entre versions
- Mettre à jour le schéma de base de données
- Afficher un changelog

## Actions et Menu Items

### PluginAction

Les actions sont des boutons/commandes exposés dans l'interface.

```typescript
interface PluginAction {
  id: string;                        // Identifiant unique
  label: string;                     // Texte du bouton
  icon?: string;                     // Icône Fluent UI
  context: 'global' | 'library' | 'settings' | 'book';
  onClick: (data?: any) => void | Promise<void>;
}
```

**Contexts** :
- `global` : Disponible partout dans l'app
- `library` : Dans la vue bibliothèque
- `settings` : Dans les paramètres du plugin
- `book` : Menu contextuel sur un livre

**Exemple** :

```typescript
actions: [
  {
    id: 'export-library',
    label: 'Exporter la bibliothèque',
    icon: 'ArrowDownloadRegular',
    context: 'library',
    onClick: async (data) => {
      const books = await libraryService.getBooks();
      await exportService.export(books);
    },
  },
  {
    id: 'configure',
    label: 'Configurer',
    icon: 'SettingsRegular',
    context: 'settings',
    onClick: () => {
      // Ouvrir la configuration
    },
  },
]
```

### MenuItem

Items de menu personnalisés pour le plugin.

```typescript
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void | Promise<void>;
  separator?: boolean;  // Ajouter un séparateur avant cet item
}
```

**Exemple** :

```typescript
menuItems: [
  {
    id: 'open-dashboard',
    label: 'Tableau de bord',
    icon: 'ChartRegular',
    action: async () => {
      // Ouvrir le dashboard
    },
  },
  {
    id: 'separator-1',
    separator: true,
  },
  {
    id: 'help',
    label: 'Aide',
    icon: 'QuestionCircleRegular',
    action: () => {
      window.open('https://docs.example.com');
    },
  },
]
```

## Settings Management

### Définir des Settings

Les settings sont définis dans la propriété `settings` du plugin :

```typescript
settings: {
  apiKey: '',
  enabled: true,
  maxItems: 100,
  theme: 'dark',
  advancedOptions: {
    timeout: 5000,
    retries: 3,
  },
}
```

### Accéder aux Settings

Via le PluginManager (dans l'app principale) :

```typescript
import { pluginManager } from '@/plugins';

// Lire
const settings = pluginManager.getPluginSettings('my-plugin');
console.log(settings.apiKey);

// Écrire
await pluginManager.setPluginSettings('my-plugin', {
  ...settings,
  apiKey: 'new-key',
});
```

### Depuis le Plugin

```typescript
const myPlugin: Plugin = {
  id: 'my-plugin',
  settings: {
    count: 0,
  },

  actions: [{
    id: 'increment',
    label: 'Increment',
    onClick: async function() {
      // Accès direct aux settings du plugin
      const currentSettings = myPlugin.settings as MySettings;
      currentSettings.count++;

      // Persister via pluginManager
      await pluginManager.setPluginSettings('my-plugin', currentSettings);
    },
  }],
};
```

### Types de Settings

```typescript
interface MyPluginSettings {
  // Primitives
  stringValue: string;
  numberValue: number;
  booleanValue: boolean;

  // Collections
  arrayValue: string[];
  objectValue: Record<string, any>;

  // Optionnelles
  optionalValue?: string;

  // Enums
  mode: 'light' | 'dark' | 'auto';
}
```

## Services Disponibles

### notificationService

Afficher des notifications système.

```typescript
import { notificationService } from '@/services/notificationService';

await notificationService.notify({
  title: 'Mon Plugin',
  body: 'Opération terminée',
  // Optionnels
  icon?: string,
  urgency?: 'low' | 'normal' | 'critical',
});
```

### libraryService

Accéder à la bibliothèque de livres.

```typescript
import { libraryService } from '@/services/libraryService';

// Récupérer tous les livres
const books = await libraryService.getBooks();

// Récupérer un livre par ID
const book = await libraryService.getBookById(bookId);

// Rechercher
const results = await libraryService.search(query);

// Filtrer
const filtered = await libraryService.filterBooks({
  author: 'Author Name',
  format: 'epub',
});
```

### dbService

Accès direct à la base de données SQLite.

```typescript
import { dbService } from '@/services';

// Requête SELECT
const result = await dbService.query('SELECT * FROM books WHERE id = ?', [bookId]);

// INSERT/UPDATE/DELETE
await dbService.execute('INSERT INTO my_table VALUES (?, ?)', [val1, val2]);
```

### Tauri APIs

APIs système via Tauri.

```typescript
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

// Invoquer une commande Rust
const result = await invoke<string>('my_command', { arg1: 'value' });

// Dialogue de fichier
const filePath = await save({
  title: 'Sauvegarder',
  defaultPath: 'export.csv',
  filters: [{ name: 'CSV', extensions: ['csv'] }],
});

// Lire/écrire des fichiers
const content = await readTextFile(filePath);
await writeTextFile(filePath, 'content');
```

## Types de Plugins

### Plugin Standard

Plugin de base avec actions et hooks.

```typescript
export const standardPlugin: Plugin = {
  id: 'standard-plugin',
  name: 'Standard Plugin',
  description: 'A standard plugin',
  version: '1.0.0',
  author: 'Me',
  enabled: false,
  icon: 'PuzzlePieceRegular',

  actions: [/* ... */],
  onEnable: async () => { /* ... */ },
};
```

### ExportPlugin

Plugin spécialisé pour l'export de données.

```typescript
interface ExportPlugin extends Plugin {
  export(books: Book[], options?: any): Promise<ExportResult>;
}

interface ExportResult {
  success: boolean;
  filePath?: string;
  itemCount?: number;
  error?: string;
}
```

**Exemple** :

```typescript
export const csvExportPlugin: ExportPlugin = {
  id: 'csv-export',
  // ... propriétés Plugin standard

  async export(books: Book[], options?: any): Promise<ExportResult> {
    try {
      const csv = generateCsv(books);
      await writeTextFile(options.filePath, csv);

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
```

### SyncPlugin

Plugin de synchronisation avec appareils externes.

```typescript
interface SyncPlugin extends Plugin {
  detectDevices(): Promise<Device[]>;
  syncBooks(device: Device, books: Book[]): Promise<SyncResult>;
}

interface Device {
  id: string;
  name: string;
  type: string;
  path: string;
}

interface SyncResult {
  success: boolean;
  booksSynced: number;
  error?: string;
}
```

## Intégration Sidebar

### Configuration

```typescript
interface SidebarConfig {
  id: string;           // ID unique pour l'onglet
  label: string;        // Label affiché
  icon: string;         // Icône Fluent UI
  position: 'top' | 'bottom';
  color?: string;       // Couleur hex (ex: '#ef4444')
  component: string;    // Nom du composant React à render
}
```

**Exemple** :

```typescript
sidebar: {
  id: 'my-plugin-tab',
  label: 'Mon Plugin',
  icon: 'AppsRegular',
  position: 'bottom',
  color: '#3b82f6',
  component: 'MyPluginPanel',
}
```

### Composant Panel

Le composant React doit être créé dans l'app principale :

```tsx
// src/components/plugins/MyPluginPanel.tsx
export function MyPluginPanel() {
  return (
    <div className="p-4">
      <h2>Mon Plugin Panel</h2>
      {/* Contenu du panel */}
    </div>
  );
}
```

## Permissions

### Types de Permissions

```typescript
permissions: [
  // Filesystem
  'fs:read',
  'fs:write',

  // Dialogues
  'dialog:*',

  // Shell
  'shell:execute',
  'shell:*',

  // Tauri
  'tauri:*',

  // Network (si configuré)
  'http:*',
]
```

### Configuration Tauri

Les permissions doivent être déclarées dans `tauri.conf.json` :

```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": ["$APPDATA/**", "$DESKTOP/**"]
      },
      "shell": {
        "scope": [
          { "name": "gh", "cmd": "gh", "args": true }
        ]
      }
    }
  }
}
```

## Backend Rust

### Structure

```rust
// plugin_commands.rs
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MyResult {
    pub success: bool,
    pub data: String,
}

#[command]
pub async fn my_command(arg: String) -> Result<MyResult, String> {
    // Logique
    Ok(MyResult {
        success: true,
        data: format!("Processed: {}", arg),
    })
}
```

### Enregistrement

```rust
// src-tauri/src/main.rs
mod plugin_commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            plugin_commands::my_command,
        ])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

### Appel depuis TypeScript

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<MyResult>('my_command', {
  arg: 'test',
});

console.log(result.data);
```

## Manifest.json (Optionnel)

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Description",
  "version": "1.0.0",
  "author": "Author Name",
  "icon": "PuzzlePieceRegular",
  "repository": "https://github.com/user/plugin",
  "enabled": false,
  "permissions": ["fs:read", "fs:write"],
  "dependencies": {
    "html2canvas": "^1.4.1"
  },
  "settings": {
    "apiKey": {
      "type": "string",
      "label": "API Key",
      "description": "Your API key",
      "required": true
    }
  }
}
```

## Conventions de Nommage

- **Plugin ID** : `kebab-case` (ex: `my-plugin`)
- **Actions ID** : `kebab-case` (ex: `export-library`)
- **Settings keys** : `camelCase` (ex: `apiKey`, `maxRetries`)
- **Fichiers** : `PascalCase.ts` pour classes, `kebab-case.ts` pour autres
- **Types** : `PascalCase` (ex: `MyPluginSettings`)
- **Fonctions** : `camelCase` (ex: `exportLibrary`)

## Validation

Avant de soumettre un plugin :

- ✅ ID unique en kebab-case
- ✅ Version semver valide
- ✅ Icône Fluent UI valide
- ✅ Toutes les actions ont des IDs uniques
- ✅ Gestion d'erreurs dans les hooks async
- ✅ Notifications pour opérations longues
- ✅ Documentation README.md
- ✅ Types TypeScript pour settings
- ✅ Tests (si applicable)
