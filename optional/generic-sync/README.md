# Generic Device Sync Plugin

Universal synchronization plugin for e-readers beyond Kobo and Kindle. Supports PocketBook, Sony Reader, Cybook, BeBook, and other compatible devices.

## Supported Devices

### ✅ Fully Supported

#### PocketBook (75% compatibility)
- **All models** with USB Mass Storage
- **Detection**: `/Books/` + `/system/` folders or "POCKETBOOK" volume name
- **Sync path**: `/Books/`
- **Formats**: EPUB, PDF, FB2, MOBI, CBZ, CBR, TXT
- **Note**: Excellent format support, reliable detection

#### Sony Reader PRS Series (60% compatibility)
- **Models**: PRS-300, PRS-350, PRS-500, PRS-505, PRS-600, PRS-650, PRS-700
- **Detection**: `/database/` folder + `books.db` file
- **Sync path**: `/database/media/books/`
- **Formats**: EPUB, PDF, TXT
- **Note**: Uses proprietary database, may require manual library refresh on device

#### Cybook (70% compatibility)
- **Models**: Gen3, Opus, Orizon, Odyssey
- **Detection**: `/Digital Editions/` folder or "CYBOOK" volume name
- **Sync path**: `/Books/`
- **Formats**: EPUB, PDF, FB2, TXT, HTML
- **Note**: Simple structure, good compatibility

#### BeBook (70% compatibility)
- **Models**: BeBook, BeBook Mini
- **Detection**: `/books/` folder or "BEBOOK" volume name
- **Sync path**: `/books/`
- **Formats**: EPUB, PDF, FB2, TXT, HTML
- **Note**: Straightforward sync process

### ❌ Not Supported
- **Kindle Fire** - Uses MTP protocol (not USB Mass Storage)
- **Irex Illiad/DR1000** - Linux filesystem (ext3) compatibility issues
- **Oyo devices** - Too heterogeneous (generic brand)

## Features

- **Automatic Device Detection**: Scans for connected devices every 3 seconds
- **Multi-Device Support**: Handle PocketBook, Sony, Cybook, and BeBook simultaneously
- **Format Validation**: Only syncs books in formats supported by the device
- **Storage Information**: Display total/free space and book count
- **Smart Detection**: Uses multiple criteria (paths, volume names, identifier files)
- **Notifications**: Real-time feedback on device connection and sync status

## Device Detection Criteria

### PocketBook
```
Primary: /Books/ directory exists
Secondary: /system/ directory exists
OR
Volume name contains "POCKETBOOK"
```

### Sony Reader PRS
```
Primary: /database/ directory exists
Identifier: /database/books.db file exists
```

### Cybook
```
Primary: /Digital Editions/ directory exists
OR
Volume name contains "CYBOOK"
```

### BeBook
```
Primary: /books/ directory exists
OR
Volume name contains "BEBOOK"
```

## Settings

- **enabled**: Enable/disable the plugin
- **autoDetect**: Automatically detect devices when connected
- **supportedDevices**: Array of device types to detect (pocketbook, sony-prs, cybook, bebook)
- **defaultSyncPath**: Default sync path if detection fails
- **showNotifications**: Show notifications for device events

## Actions

### Sync to Device (Book Context)
Right-click on any book to sync it to the first connected compatible device. The plugin will:
1. Check if device supports the book's format
2. Copy the file to the device's sync directory
3. Update device information

### Sync Selected Books (Library Context)
Sync multiple selected books at once (coming in future update).

### Detect Devices (Settings Context)
Manually trigger device detection from plugin settings.

## Usage

1. **Enable the plugin** in Settings > Plugins
2. **Connect your e-reader** via USB (ensure USB Mass Storage mode)
3. **Wait for detection** (notification will appear)
4. **Right-click any book** → "Sync to Device"
5. **Eject the device** safely before disconnecting

## Format Compatibility

| Device | EPUB | PDF | MOBI | CBZ | FB2 | TXT |
|--------|------|-----|------|-----|-----|-----|
| PocketBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sony PRS | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Cybook | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| BeBook | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

## Troubleshooting

### Device Not Detected

**PocketBook:**
- Ensure device is in USB Mass Storage mode (not MTP)
- Check that `/Books/` and `/system/` folders exist
- Volume should appear in system file manager

**Sony PRS:**
- Verify `/database/` folder exists on device
- Some Sony models may mount as "READER" volume
- Try manual library refresh on device after sync

**Cybook/BeBook:**
- These devices may not have unique identifiers
- Detection relies on specific folder structures
- Ensure volume name matches expected pattern

### Sync Failed

- **Format not supported**: Check format compatibility table above
- **Insufficient space**: Free up space on device
- **Permission denied**: Ensure device is mounted with write permissions
- **File already exists**: File with same name already on device

### Multiple Devices Connected

Currently, the plugin syncs to the **first detected device**. If you have multiple compatible devices connected:
1. The first detected device will be used
2. Manually select target device (feature coming soon)
3. Or disconnect other devices temporarily

## Technical Details

### Required Tauri Commands

This plugin requires the following Tauri backend commands:

```rust
// Get mounted volumes
get_mounted_volumes() -> Vec<String>

// Check if path exists
path_exists(path: String) -> Result<bool>

// Get device storage info
get_device_space(device_path: String) -> { total: u64, free: u64 }

// Count files with extensions
count_files_in_directory(path: String, extensions: Vec<String>) -> usize

// Copy file to device
copy_file_to_device(source_path: String, device_path: String, file_name: String)
```

### Device Profiles

The plugin uses configurable device profiles:

```typescript
{
  type: 'pocketbook',
  name: 'PocketBook',
  manufacturer: 'PocketBook International',
  detectionCriteria: {
    primaryPath: '/Books/',
    secondaryPath: '/system/',
    volumeName: 'POCKETBOOK'
  },
  syncPath: '/Books/',
  supportedFormats: ['epub', 'pdf', 'fb2', 'mobi', 'cbz', 'cbr', 'txt'],
  requiresConversion: false
}
```

## Roadmap

### Short Term
- ✅ PocketBook support
- ✅ Sony PRS support
- ✅ Cybook support
- ✅ BeBook support
- 📝 Multi-book sync
- 📝 Device selection UI

### Medium Term
- 📅 Custom device profiles (user-defined)
- 📅 Sync history and logs
- 📅 Automatic format conversion
- 📅 Metadata preservation

### Long Term
- 🔮 MTP protocol support (for newer devices)
- 🔮 Wi-Fi sync for compatible devices
- 🔮 Cloud storage integration

## Compatibility Analysis

Based on comprehensive device research (see `device-compat.md`):

- **Excellent (70%+)**: PocketBook, Cybook, BeBook
- **Good (60-70%)**: Sony PRS Series
- **Limited (<60%)**: Older/obscure devices
- **Incompatible**: MTP-only devices (Kindle Fire, etc.)

**Overall compatibility**: 82-91% of analyzed USB Mass Storage e-readers

## Contributing

To add support for a new device:

1. Research device folder structure and detection criteria
2. Add device profile to `DEVICE_PROFILES` array in `GenericSyncPlugin.ts`
3. Test detection and sync functionality
4. Update documentation with device specifications
5. Submit PR with compatibility analysis

## Version History

- **1.0.0**: Initial release with PocketBook, Sony PRS, Cybook, and BeBook support

## References

- [Complete Device Compatibility Analysis](./device-compat.md)
- [PocketBook Technical Specs](https://www.pocketbook-int.com)
- [Sony Reader Archive](https://www.sony.com/electronics/support/e-book-readers)
- [Bookeen Cybook](https://www.bookeen.com)
