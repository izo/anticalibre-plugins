# Integration Guide for Stomy Maintainers

This guide explains how to integrate the EPUB to PDF plugin into the main Stomy application.

## Overview

The plugin consists of:
- **Frontend**: TypeScript plugin files (this directory)
- **Backend**: Rust module for conversion (`epub_converter.rs`)

## Integration Steps

### 1. Backend Integration (Rust)

#### Copy Rust Module

Copy `epub_converter.rs` to the Stomy backend:

```bash
cp epub-to-pdf/epub_converter.rs <stomy-project>/src-tauri/src/
```

#### Update main.rs

Add the module declaration at the top of `src-tauri/src/main.rs`:

```rust
// Add with other mod declarations
mod epub_converter;
```

#### Register Tauri Commands

Update the `invoke_handler` in `src-tauri/src/main.rs`:

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        // ... existing commands ...

        // EPUB to PDF commands
        epub_converter::check_epub_converter,
        epub_converter::convert_epub_to_pdf,
        epub_converter::convert_multiple_epub_to_pdf,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

#### Verify Dependencies

Ensure these dependencies are in `src-tauri/Cargo.toml`:

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "2.1", features = ["protocol-asset"] }
```

These should already be present in the Stomy project.

### 2. Frontend Integration (TypeScript)

#### Copy Plugin Directory

The plugin directory is already in the correct location if you cloned this repo:

```
stomy-plugins/
└── epub-to-pdf/
    ├── index.ts
    ├── EpubToPdfPlugin.ts
    ├── types.ts
    ├── README.md
    └── INTEGRATION.md
```

#### Register Plugin

In the main Stomy app, update `src/plugins/index.ts`:

```typescript
// Import the plugin
import { epubToPdfPlugin } from './core/epub-to-pdf';

export async function initializePlugins(): Promise<void> {
  await pluginManager.initialize();

  // Register existing plugins
  await pluginManager.registerPlugin(dummyPlugin);
  await pluginManager.registerPlugin(csvExportPlugin);
  await pluginManager.registerPlugin(koboSyncPlugin);
  await pluginManager.registerPlugin(kindleSyncPlugin);

  // Register EPUB to PDF plugin
  await pluginManager.registerPlugin(epubToPdfPlugin);
}
```

#### Link Plugin Directory

If the plugins are in a separate repository, create a symlink or copy:

```bash
# Option 1: Symlink (development)
ln -s /path/to/stomy-plugins/epub-to-pdf /path/to/stomy/src/plugins/core/epub-to-pdf

# Option 2: Copy (production)
cp -r /path/to/stomy-plugins/epub-to-pdf /path/to/stomy/src/plugins/core/
```

### 3. Type Definitions

Ensure the Plugin type in Stomy includes support for:

```typescript
interface PluginAction {
  id: string;
  label: string;
  icon?: string;
  context?: 'global' | 'library' | 'settings';  // Important!
  onClick: (data?: any) => void | Promise<void>;
}
```

The `context` field is crucial for right-click menu integration.

### 4. UI Integration

#### Context Menu

Ensure the library view context menu includes plugin actions:

```typescript
// In LibraryView.tsx or similar
const contextMenuItems = [
  // ... existing items ...

  // Add plugin actions with context: 'library'
  ...pluginManager.getActionsForContext('library').map(action => ({
    label: action.label,
    icon: action.icon,
    onClick: () => action.onClick({ selectedBooks })
  }))
];
```

#### Plugin Settings UI

The settings should already support the plugin's configuration options via the plugin manager.

### 5. Permissions

Ensure the plugin has the necessary Tauri permissions in `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "allowlist": {
      "dialog": {
        "all": true,
        "save": true
      },
      "fs": {
        "all": true,
        "readFile": true,
        "writeFile": true
      }
    }
  }
}
```

### 6. Build and Test

#### Development Build

```bash
# Install dependencies if needed
npm install

# Run in development mode
npm run tauri:dev
```

#### Test the Plugin

1. Open Stomy
2. Go to **Settings > Plugins**
3. Find **EPUB to PDF** plugin
4. Enable the plugin
5. Check for converter availability
6. Test single file conversion
7. Test batch conversion

#### Production Build

```bash
npm run tauri:build
```

### 7. Testing Checklist

- [ ] Plugin appears in Settings > Plugins
- [ ] Plugin can be enabled/disabled
- [ ] "Check Converter Availability" action works
- [ ] Right-click on single EPUB shows "Convert to PDF"
- [ ] Right-click on multiple EPUBs shows "Convert to PDF"
- [ ] Save dialog appears for single file
- [ ] Folder selection works for batch conversion
- [ ] Conversion succeeds with Calibre installed
- [ ] Conversion succeeds with Pandoc installed (if no Calibre)
- [ ] Error messages appear when no converter installed
- [ ] Output PDFs are created in correct location
- [ ] PDF content matches EPUB content

### 8. Documentation Updates

Update Stomy documentation:

1. **User Guide**: Add EPUB to PDF conversion instructions
2. **Plugin List**: Add to official plugin list
3. **Requirements**: Note Calibre/Pandoc requirement
4. **Changelog**: Add plugin in next release notes

## Architecture

### Data Flow

```
User selects books → Right-click → Plugin action
                              ↓
                    Check converter availability
                              ↓
                    Show save/folder dialog
                              ↓
                    Call Rust backend via Tauri
                              ↓
                    Execute ebook-convert/pandoc
                              ↓
                    Return results to frontend
                              ↓
                    Show notification to user
```

### File Structure

```
Stomy/
├── src/
│   └── plugins/
│       ├── index.ts           # Register plugin here
│       └── core/
│           └── epub-to-pdf/   # Plugin files
│               ├── index.ts
│               ├── EpubToPdfPlugin.ts
│               └── types.ts
└── src-tauri/
    └── src/
        ├── main.rs            # Register commands here
        └── epub_converter.rs  # Conversion logic
```

## Troubleshooting

### Plugin Not Appearing

**Issue**: Plugin doesn't show in Settings > Plugins

**Solution**:
- Check plugin is imported in `src/plugins/index.ts`
- Verify plugin is registered with `pluginManager.registerPlugin()`
- Check console for errors

### Rust Commands Not Found

**Issue**: "Command not found" errors in console

**Solution**:
- Verify `epub_converter` module is declared in `main.rs`
- Check commands are registered in `invoke_handler`
- Rebuild the application: `npm run tauri:dev`

### Context Menu Not Working

**Issue**: Right-click doesn't show plugin action

**Solution**:
- Verify action has `context: 'library'`
- Check UI implements plugin context menu integration
- Ensure `selectedBooks` data is passed to `onClick`

### Conversion Fails

**Issue**: Conversion returns error

**Solution**:
- Check Calibre/Pandoc is installed: `ebook-convert --version`
- Verify paths are correct (use absolute paths)
- Check file permissions
- Review Rust logs in terminal

## Maintenance

### Updating the Plugin

When updating the plugin:

1. Update version in `EpubToPdfPlugin.ts`
2. Test with existing installations
3. Update `CHANGELOG.md` (if exists)
4. Create migration if settings changed

### Monitoring

Monitor for:
- Conversion failures
- Performance issues with large files
- Compatibility with new Calibre/Pandoc versions
- User feedback and feature requests

## Support

For questions or issues:
- **Plugin Issues**: File issue in stomy-plugins repo
- **Integration Issues**: Contact Stomy maintainers
- **Converter Issues**: Check Calibre/Pandoc documentation

## License

Same as Stomy - Internal use only.
