# EPUB to PDF Plugin

Convert EPUB files to PDF format directly from Stomy. Select multiple books via right-click and save them anywhere on your system.

## Features

- **Batch Conversion**: Convert multiple EPUB files at once
- **Right-Click Integration**: Context menu in library view
- **Multiple Converters**: Uses Calibre or Pandoc (automatic detection)
- **Flexible Output**: Save PDFs anywhere on your system
- **High-Quality Output**: Professional PDF generation with proper formatting
- **Progress Tracking**: Real-time conversion status
- **Configurable Settings**: Customize page size, margins, and quality

## Requirements

### Converter Software

This plugin requires either **Calibre** or **Pandoc** to be installed on your system.

#### Option 1: Calibre (Recommended)

Calibre provides the best conversion quality and is the recommended option.

**Installation:**

- **Windows**: Download from [calibre-ebook.com](https://calibre-ebook.com/download)
- **macOS**: `brew install calibre` or download from website
- **Linux**:
  ```bash
  sudo apt install calibre          # Debian/Ubuntu
  sudo dnf install calibre          # Fedora
  sudo pacman -S calibre            # Arch Linux
  ```

**Verify installation:**
```bash
ebook-convert --version
```

#### Option 2: Pandoc (Alternative)

Pandoc is a lightweight alternative that also produces good results.

**Installation:**

- **Windows**: Download from [pandoc.org](https://pandoc.org/installing.html)
- **macOS**: `brew install pandoc`
- **Linux**:
  ```bash
  sudo apt install pandoc texlive-xetex  # Debian/Ubuntu
  sudo dnf install pandoc texlive        # Fedora
  sudo pacman -S pandoc texlive-core     # Arch Linux
  ```

**Note**: Pandoc requires a LaTeX engine (like XeLaTeX) for PDF generation.

**Verify installation:**
```bash
pandoc --version
```

## Installation

### 1. Copy Plugin Files

Copy the `epub-to-pdf` directory to the Stomy plugins folder.

### 2. Add Rust Backend

**For Stomy Maintainers:**

1. Copy `epub_converter.rs` to `src-tauri/src/epub_converter.rs`

2. Add to `src-tauri/src/main.rs`:
   ```rust
   mod epub_converter;
   ```

3. Register commands in `main.rs`:
   ```rust
   tauri::Builder::default()
       .invoke_handler(tauri::generate_handler![
           // ... existing commands
           epub_converter::check_epub_converter,
           epub_converter::convert_epub_to_pdf,
           epub_converter::convert_multiple_epub_to_pdf,
       ])
       .run(tauri::generate_context!())
       .expect("error while running tauri application");
   ```

4. Update `src-tauri/Cargo.toml` (dependencies already included):
   ```toml
   [dependencies]
   serde = { version = "1.0", features = ["derive"] }
   serde_json = "1.0"
   tauri = { version = "2.1", features = ["protocol-asset"] }
   ```

### 3. Register Plugin in Stomy

Add to `src/plugins/index.ts`:

```typescript
import { epubToPdfPlugin } from './core/epub-to-pdf';

export async function initializePlugins(): Promise<void> {
  await pluginManager.initialize();
  // ... other plugins
  await pluginManager.registerPlugin(epubToPdfPlugin);
}
```

### 4. Rebuild Stomy

```bash
npm run tauri:dev  # Development
npm run tauri:build  # Production
```

## Usage

### Single File Conversion

1. Navigate to your library
2. **Right-click** on an EPUB book
3. Select **"Convert to PDF"**
4. Choose output location and filename
5. Wait for conversion to complete

### Batch Conversion

1. Select multiple EPUB books (Ctrl+Click or Shift+Click)
2. **Right-click** on selection
3. Select **"Convert to PDF"**
4. Choose output folder
5. All files will be converted with preserved names

### Checking Converter Status

1. Go to **Settings > Plugins**
2. Find **EPUB to PDF**
3. Click **"Check Converter Availability"**
4. View which converter is installed and its version

## Configuration

### Plugin Settings

Configure the plugin in **Settings > Plugins > EPUB to PDF**:

| Setting | Description | Default |
|---------|-------------|---------|
| **Default Output Folder** | Default save location for PDFs | Desktop |
| **Open After Conversion** | Automatically open PDF after conversion | `false` |
| **Show Notifications** | Display system notifications | `true` |
| **Compression Level** | PDF compression (none/low/medium/high) | `medium` |
| **Page Size** | PDF page size (A4/Letter/auto) | `A4` |
| **Margins** | Page margins in points | 20pt all sides |
| **Include Table of Contents** | Generate PDF bookmarks from EPUB TOC | `true` |
| **Preserve Images** | Include all images from EPUB | `true` |

### Calibre-Specific Settings

When using Calibre, the plugin uses these optimized settings:

- **Paper Size**: A4 (configurable)
- **Font Size**: 12pt
- **Margins**: 72pt (1 inch) all sides
- **Cover**: Preserved with aspect ratio
- **TOC**: Automatically generated

### Pandoc-Specific Settings

When using Pandoc, the plugin uses:

- **PDF Engine**: XeLaTeX
- **Margins**: 1 inch all sides
- **Font**: Default system fonts

## How It Works

### Converter Detection

On plugin enable, the plugin automatically:

1. Searches for `ebook-convert` (Calibre)
2. Falls back to `pandoc` if Calibre not found
3. Displays warning if neither is available

### Conversion Process

**Calibre workflow:**
```
EPUB → ebook-convert → PDF (optimized settings)
```

**Pandoc workflow:**
```
EPUB → pandoc → XeLaTeX → PDF
```

### File Handling

- **Input**: EPUB files from your library
- **Output**: PDF files with same name (different extension)
- **Temp Files**: None (direct conversion)
- **Original Files**: Never modified

## Supported Features

### EPUB Features Preserved

✅ Text content and formatting
✅ Images and graphics
✅ Table of contents
✅ Chapter structure
✅ Embedded fonts (when possible)
✅ Metadata (title, author)

### PDF Output Features

✅ Searchable text
✅ Selectable text
✅ Bookmarks (from TOC)
✅ Embedded images
✅ Professional formatting
✅ Consistent pagination

## Troubleshooting

### "No converter found" Error

**Cause**: Neither Calibre nor Pandoc is installed.

**Solution**:
1. Install Calibre (recommended) or Pandoc
2. Restart Stomy
3. Re-enable the plugin

### "Conversion failed" Error

**Possible causes:**
- Corrupted EPUB file
- Missing permissions for output folder
- Insufficient disk space
- Converter installation issue

**Solutions:**
1. Verify EPUB file is valid (open in an EPUB reader)
2. Check output folder permissions
3. Ensure at least 100MB free disk space
4. Reinstall converter software

### Calibre Found But Not Working

**On Windows:**
```bash
# Add Calibre to PATH
set PATH=%PATH%;C:\Program Files\Calibre2
```

**On macOS/Linux:**
```bash
# Find Calibre installation
which ebook-convert

# If not found, add to PATH in ~/.bashrc or ~/.zshrc
export PATH="/Applications/calibre.app/Contents/MacOS:$PATH"
```

### Pandoc Conversion Errors

**Error**: "xelatex not found"

**Solution**: Install full LaTeX distribution:
```bash
# Ubuntu/Debian
sudo apt install texlive-xetex texlive-fonts-recommended

# macOS
brew install basictex
```

### Slow Conversions

Large EPUB files (>10MB) or complex layouts may take several minutes to convert. This is normal.

**Tips for faster conversion:**
- Use Calibre (generally faster than Pandoc)
- Close other applications
- Convert smaller batches

## Technical Details

### Backend Implementation

- **Language**: Rust (via Tauri)
- **Commands**:
  - `check_epub_converter`: Detect available converter
  - `convert_epub_to_pdf`: Single file conversion
  - `convert_multiple_epub_to_pdf`: Batch conversion

### Converter Comparison

| Feature | Calibre | Pandoc |
|---------|---------|--------|
| **Quality** | Excellent | Good |
| **Speed** | Fast | Moderate |
| **Size** | ~400MB | ~50MB + LaTeX |
| **Dependencies** | None | Requires LaTeX |
| **Recommendation** | ⭐ Primary | Fallback |

### Error Handling

The plugin handles errors gracefully:
- Invalid input files
- Missing converters
- Permission issues
- Disk space problems
- Conversion failures

All errors are logged and displayed to the user with actionable messages.

## Performance

### Single File

- **Small EPUB** (<1MB): 5-15 seconds
- **Medium EPUB** (1-10MB): 15-60 seconds
- **Large EPUB** (>10MB): 1-5 minutes

### Batch Conversion

Processed sequentially with progress updates. Expected time = (average file time) × (number of files).

## Security

- **No network access**: All conversion happens locally
- **No data collection**: Your files never leave your computer
- **Safe operations**: Original files are never modified
- **Sandboxed**: Runs in Tauri's secure environment

## Development

### Building

```bash
# Install dependencies
npm install

# Run in development
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Testing

```bash
# Test Rust backend
cd src-tauri
cargo test epub_converter

# Test TypeScript
npm run test
```

### Adding Features

The plugin is designed to be extensible:

1. **New converters**: Add detection in `check_epub_converter()`
2. **Custom settings**: Extend `EpubToPdfSettings` interface
3. **Advanced options**: Modify conversion commands in `epub_converter.rs`

## Roadmap

Planned features:

- [ ] Real-time progress bars
- [ ] Custom PDF metadata editing
- [ ] Watermark support
- [ ] PDF/A compliance
- [ ] GPU acceleration
- [ ] Cloud storage integration
- [ ] Advanced typography options

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

Same as Stomy - Internal use only.

## Credits

- **Conversion**: [Calibre](https://calibre-ebook.com/) by Kovid Goyal
- **Alternative**: [Pandoc](https://pandoc.org/) by John MacFarlane
- **Framework**: [Tauri](https://tauri.app/)
- **Plugin System**: Stomy Team

## Support

- **Issues**: [GitHub Issues](https://github.com/izo/stomy-plugins/issues)
- **Documentation**: [Stomy Docs](https://github.com/izo/Stomy)
- **Community**: [Discussions](https://github.com/izo/Stomy/discussions)

---

**Made with ❤️ for the Stomy community**
