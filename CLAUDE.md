# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **stomy-plugins** repository, which contains core plugins for [Stomy](https://github.com/izo/Stomy), a cross-platform ebook management application built with Tauri (Rust + TypeScript/React).

**Key Architecture Points:**
- Each plugin is a self-contained directory with an `index.ts` entry point
- Plugins export a Plugin object conforming to the Plugin interface defined in the parent Stomy application
- Plugins can include TypeScript frontend code and optional Rust backend modules
- The plugin system supports lifecycle hooks (onInstall, onEnable, onDisable, onUninstall, onUpdate)
- Plugins can expose actions (buttons/menu items) that appear in the Stomy UI
- Plugins can define custom settings that are persisted to SQLite
- All type definitions are imported from `../../types` or similar relative paths (defined in main Stomy app)

## Plugin Architecture

### Plugin Structure

Each plugin follows this pattern:
```
plugin-name/
├── index.ts              # Entry point, exports the plugin
├── PluginName.ts         # Main plugin implementation (optional, for complex plugins)
├── types.ts              # Plugin-specific type definitions
├── manifest.json         # Optional metadata file
├── *.rs                  # Optional Rust backend modules (rare)
└── README.md             # Plugin-specific documentation
```

### Plugin Types

The codebase has two specialized plugin types:

1. **Plugin** - Base interface with lifecycle hooks and actions
2. **ExportPlugin** - Extends Plugin with an `export()` method for batch operations

### Important Services

Plugins import services from the main Stomy application:
- `notificationService` from `@/services/notificationService` - System notifications
- `libraryService` from `@/services/libraryService` - Database operations for books
- `dbService` from `@/services` - Direct database access
- Tauri APIs: `@tauri-apps/api/core`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`

### Plugin Contexts

Actions can have different contexts:
- `global` - Available everywhere in the app
- `library` - Available in the library view
- `settings` - Available in plugin settings view

## Plugin Import Pattern

Plugins are registered in the main Stomy app (not in this repository). The typical import pattern from the main app is:

```typescript
import { pluginName } from './core/plugin-name';
await pluginManager.registerPlugin(pluginName);
```

## Development Workflow

Since this repository contains only the plugins (not the build system):

1. **Modifying plugins**: Edit TypeScript files directly in the plugin directories
2. **Testing**: Plugins must be tested within the main Stomy application
   - Import the plugin in the main app's `src/plugins/index.ts`
   - Run the main app with `npm run tauri:dev`
3. **No local build**: This repository has no `package.json` or build scripts
4. **Type checking**: Depends on the main Stomy app's TypeScript configuration

## Rust Backend Integration

Some plugins (like `epub-to-pdf`) include Rust modules:
- Rust files (`.rs`) provide Tauri commands invoked from TypeScript via `invoke()`
- These must be integrated into the main Stomy app's `src-tauri/` directory
- See individual plugin `INTEGRATION.md` files for backend integration steps

## Current Plugins

- **dummy-plugin**: Example/test plugin demonstrating all lifecycle hooks
- **csv-export**: Export library to CSV (implements ExportPlugin interface)
- **kobo-sync**: USB sync to Kobo e-readers (enabled by default)
- **kindle-sync**: USB sync to Kindle devices with EPUB→MOBI conversion
- **epub-to-pdf**: Convert EPUB books to PDF with configurable settings

## Plugin Settings Pattern

Plugins store settings in the SQLite database via `pluginManager`:

```typescript
const settings = pluginManager.getPluginSettings('plugin-id');
await pluginManager.setPluginSettings('plugin-id', { key: value });
```

Settings are defined in the plugin's `settings` property and typed with an interface (e.g., `KoboPluginSettings`).

## Important Conventions

- **Plugin IDs**: Use kebab-case (e.g., `epub-to-pdf`, not `epubToPdf`)
- **Error Handling**: All async operations in lifecycle hooks must have try-catch blocks
- **Notifications**: Long-running operations should show user feedback via `notificationService`
- **Icons**: Use Lucide React icon names (e.g., `BookOpen`, `FileSpreadsheet`)
- **Versioning**: Follow semantic versioning for plugin versions
- **Enabled by default**: Only kobo-sync is enabled by default (most plugins are `enabled: false`)

## Type Import Paths

Plugin type imports vary by directory depth:
- Root plugins: `import type { Plugin } from '../types'`
- Nested plugins: `import type { Plugin } from '../../types'`

These resolve to the main Stomy app's type definitions at runtime.

## Common Tauri Invoke Commands

Plugins commonly use these backend commands:
- `detect_kobo_devices` / `detect_kindle_devices` - USB device detection
- `get_kobo_info` / `get_kindle_info` - Device metadata
- `copy_file_to_device` - File transfer to USB devices
- `convert_epub_to_mobi` / `convert_epub_to_pdf` - Format conversion
- `check_epub_converter_availability` - Check for external tools

## Testing a New Plugin

1. Create plugin directory with `index.ts`
2. Implement the Plugin interface
3. Test by importing in main Stomy app's plugin initialization
4. Run `npm run tauri:dev` in the main Stomy app (not this repo)
5. Navigate to Settings > Plugins in the running app
6. Enable and test your plugin

## Repository Relationship

This is a **plugin library repository**, not a standalone application:
- Main app: [izo/Stomy](https://github.com/izo/Stomy)
- This repo: Plugin source code only
- Integration: Main app imports plugins from this repo's directories
- License: Internal use only (same as main Stomy app)
