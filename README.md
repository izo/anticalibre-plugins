# Stomy Plugins

This repository contains core plugins for [Stomy](https://github.com/izo/Stomy), the cross-platform ebook management application for macOS, Windows, and Linux.

## Available Plugins

### dummy-plugin
Example plugin demonstrating the plugin API. Shows how to:
- Register plugin metadata
- Add custom actions
- Handle lifecycle hooks
- Display notifications

### csv-export
Export your entire library to a CSV file with all book metadata including title, author, series, format, and file paths.

### kobo-sync
**Enabled by default.** Synchronize your ebook library with Kobo e-reader devices via USB. Features:
- Automatic Kobo device detection
- Native support for EPUB, PDF, MOBI, CBZ formats
- Smart sync with duplicate detection
- Device storage monitoring

### kindle-sync
Synchronize your ebook library with Amazon Kindle devices via USB. Features:
- Automatic Kindle device detection
- EPUB to MOBI conversion using iepub library
- Support for all Kindle models with USB mass storage
- Configurable conversion settings

## Plugin Development Guide

### Plugin Structure

Each plugin is a directory containing:
```
my-plugin/
├── index.ts          # Plugin implementation
└── manifest.json     # Plugin metadata (optional)
```

### Basic Plugin Example

```typescript
import type { Plugin } from '../types';

export const myPlugin: Plugin = {
  // Unique identifier (use kebab-case)
  id: 'my-plugin',

  // Display name
  name: 'My Plugin',

  // Short description
  description: 'Does something useful',

  // Version (semver)
  version: '1.0.0',

  // Author information
  author: 'Your Name',

  // Optional repository URL
  repository: 'https://github.com/user/plugin',

  // Optional icon from Lucide React
  icon: 'Puzzle',

  // Initial enabled state
  enabled: false,

  // Custom actions shown in UI
  actions: [
    {
      id: 'do-something',
      label: 'Do Something',
      icon: 'Play',
      onClick: async () => {
        // Your action code here
        console.log('Action executed!');
      },
    },
  ],

  // Lifecycle hooks
  onInstall: async () => {
    console.log('Plugin installed');
  },

  onEnable: async () => {
    console.log('Plugin enabled');
  },

  onDisable: async () => {
    console.log('Plugin disabled');
  },

  onUninstall: async () => {
    console.log('Plugin uninstalled');
  },

  onUpdate: async (oldVersion: string, newVersion: string) => {
    console.log(\`Updated from \${oldVersion} to \${newVersion}\`);
  },
};
```

### Plugin API Types

#### Plugin Interface

```typescript
interface Plugin {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Short description
  version: string;               // Semver version
  author: string;                // Author name
  repository?: string;           // Git repository URL
  updateUrl?: string;            // Update check URL
  icon?: string;                 // Lucide icon name
  enabled: boolean;              // Enabled state
  settings?: Record<string, any>; // Custom settings
  actions?: PluginAction[];      // Custom actions

  // Lifecycle hooks (all optional)
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUpdate?: (oldVersion: string, newVersion: string) => Promise<void>;
}
```

#### PluginAction Interface

```typescript
interface PluginAction {
  id: string;           // Unique action ID
  label: string;        // Button label
  icon?: string;        // Lucide icon name
  onClick: () => void | Promise<void>; // Action handler
}
```

### Accessing Services

Plugins can access Stomy services:

```typescript
import { dbService } from '@/services';
import { notificationService } from '@/services';

// Database operations
const books = await dbService.getAllBooks();

// System notifications
await notificationService.show({
  title: 'Plugin Action',
  body: 'Action completed successfully',
});
```

### Plugin Settings

Plugins can store custom settings:

```typescript
export const myPlugin: Plugin = {
  // ...
  settings: {
    apiKey: '',
    enabled: true,
    customValue: 'default',
  },
};

// Access settings via PluginManager
import { pluginManager } from '@/plugins';

const settings = pluginManager.getPluginSettings('my-plugin');
await pluginManager.setPluginSettings('my-plugin', {
  apiKey: 'new-key',
});
```

Settings are automatically persisted to the SQLite database.

### Plugin Events

Listen to plugin system events:

```typescript
import { pluginManager } from '@/plugins';

// Listen for plugin events
pluginManager.on('plugin:enabled', (data) => {
  console.log(\`Plugin \${data.pluginId} was enabled\`);
});

pluginManager.on('plugin:disabled', (data) => {
  console.log(\`Plugin \${data.pluginId} was disabled\`);
});

// Available events:
// - plugin:registered
// - plugin:unregistered
// - plugin:enabled
// - plugin:disabled
// - plugin:updated
// - plugin:error
```

### Best Practices

1. **Use descriptive IDs**: Use kebab-case for plugin IDs (e.g., \`csv-export\`)
2. **Semantic versioning**: Follow semver for version numbers
3. **Error handling**: Always wrap async operations in try-catch
4. **Clean up**: Use \`onDisable\`/\`onUninstall\` to clean up resources
5. **Minimal dependencies**: Keep plugins lightweight
6. **Type safety**: Use TypeScript for type checking
7. **User feedback**: Show notifications for long operations

### Icons

Plugins can use any icon from [Lucide React](https://lucide.dev/):

```typescript
icon: 'FileSpreadsheet'  // For CSV plugin
icon: 'Download'         // For export functionality
icon: 'Upload'           // For import functionality
icon: 'Puzzle'           // Generic plugin icon
```

### Testing Plugins

1. Add your plugin to this repository
2. Import it in \`src/plugins/index.ts\`:
   \`\`\`typescript
   import { myPlugin } from './core/my-plugin';

   export async function initializePlugins(): Promise<void> {
     await pluginManager.initialize();
     await pluginManager.registerPlugin(myPlugin);
     // ... other plugins
   }
   \`\`\`
3. Run Stomy in development mode: \`npm run tauri:dev\`
4. Navigate to Settings > Plugins
5. Enable your plugin and test its functionality

### Publishing Plugins

1. **Fork this repository**
2. **Create a new directory** in the root for your plugin
3. **Implement your plugin** following the structure above
4. **Test thoroughly** in development mode
5. **Submit a pull request** with:
   - Plugin code
   - README with usage instructions
   - Screenshots (if applicable)

### Plugin Review Guidelines

Pull requests for new plugins will be reviewed for:
- **Code quality**: Clean, well-documented TypeScript
- **Security**: No malicious code or security vulnerabilities
- **Functionality**: Works as described, handles errors gracefully
- **UI/UX**: Follows Stomy design patterns
- **Performance**: Doesn't negatively impact app performance

## Core Plugin Maintenance

This repository is maintained by the Stomy team. Core plugins are:
- Thoroughly tested
- Maintained with app updates
- Automatically loaded by default
- Available to all users

## Support

For questions or issues:
- **Plugin development**: Open an issue in this repository
- **Stomy bugs**: Open an issue in [main repository](https://github.com/izo/Stomy/issues)
- **Feature requests**: Discuss in main repository discussions

## License

Same as Stomy - Internal use only.
