# Kobo Sync Plugin - Rust Backend Integration

This document explains how to integrate the Kobo database reading functionality into the main Stomy application.

## Prerequisites

The Kobo database reader requires the following Rust dependencies:

```toml
# Add to src-tauri/Cargo.toml
[dependencies]
rusqlite = { version = "0.31", features = ["bundled"] }
chrono = { version = "0.4", features = ["serde"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "2.0", features = ["protocol-asset"] }
```

## Integration Steps

### 1. Copy Rust Module

Copy the `kobo_db.rs` file to your Tauri backend:

```bash
cp core/kobo-sync/kobo_db.rs src-tauri/src/plugins/kobo_db.rs
```

### 2. Update `src-tauri/src/main.rs`

Add the module declaration and register the commands:

```rust
// Add module declaration
mod plugins {
    pub mod kobo_db;
}

use plugins::kobo_db;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... existing commands ...

            // Kobo database commands
            kobo_db::get_kobo_books,
            kobo_db::get_kobo_events,
            kobo_db::get_kobo_bookmarks,
            kobo_db::get_kobo_vocabulary,
            kobo_db::get_kobo_library_data,
            kobo_db::get_book_progress,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. Update Tauri Permissions (if needed)

If you have a `tauri.conf.json` with restricted file system access, ensure the `.kobo` folder is accessible:

```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": [
          "$RESOURCE/**",
          "/Volumes/**/.kobo/**"
        ]
      }
    }
  }
}
```

## Available Commands

### TypeScript/JavaScript Usage

```typescript
import { invoke } from '@tauri-apps/api/core';

// Get all books with reading progress
const books = await invoke<KoboBook[]>('get_kobo_books', {
  devicePath: '/Volumes/KOBOeReader'
});

// Get all library data at once (recommended)
const libraryData = await invoke<KoboLibraryData>('get_kobo_library_data', {
  devicePath: '/Volumes/KOBOeReader'
});

// Get progress for a specific book
const progress = await invoke<KoboBook | null>('get_book_progress', {
  devicePath: '/Volumes/KOBOeReader',
  isbn: '9781234567890',
  title: null
});

// Get bookmarks and annotations
const bookmarks = await invoke<KoboBookmark[]>('get_kobo_bookmarks', {
  devicePath: '/Volumes/KOBOeReader'
});

// Get reading events
const events = await invoke<KoboEvent[]>('get_kobo_events', {
  devicePath: '/Volumes/KOBOeReader'
});

// Get vocabulary words
const vocabulary = await invoke<KoboVocabulary[]>('get_kobo_vocabulary', {
  devicePath: '/Volumes/KOBOeReader'
});
```

## Database Schema Reference

### `content` Table (Books)

Key columns:
- `ContentID`: Unique book identifier
- `ISBN`: Book ISBN (if available)
- `Title`: Book title
- `Attribution`: Author name
- `___PercentRead`: Reading progress (0-100)
- `ReadStatus`: 0=Unread, 1=Reading, 2=Finished
- `TimeSpentReading`: Total reading time in minutes
- `DateLastRead`: Last reading timestamp
- `MimeType`: File format (e.g., "application/epub+zip")
- `ContentType`: 6=Book, 9=Magazine/Newspaper

### `Bookmark` Table (Highlights & Annotations)

Key columns:
- `BookmarkID`: Unique bookmark identifier
- `VolumeID`: Book reference
- `Text`: Highlighted text content
- `Annotation`: User's note (if any)
- `ChapterProgress`: Position in chapter (0-1)
- `DateCreated`: Creation timestamp
- `Type`: highlight, annotation, bookmark, dogear
- `Hidden`: Filter out deleted bookmarks

### `Event` Table (Reading Activity)

Key columns:
- `Type`: Event type (3=Start, 5=Finish, 1011-1014=Progress milestones)
- `ContentID`: Book reference
- `Count`: Number of occurrences
- `LastOccurrence`: Last timestamp
- `ExtraData`: Binary data with additional info

### `WordList` Table (Vocabulary)

Key columns:
- `Text`: Word looked up
- `VolumeID`: Book where lookup occurred
- `DateCreated`: Lookup timestamp

## Performance Notes

- `get_kobo_library_data()` is optimized for fetching all data in one call
- Individual queries are available for incremental updates
- Events are limited to 1000 most recent
- Vocabulary is limited to 500 most recent words
- Database is read-only (no write operations)

## Error Handling

All commands return `Result<T, String>` where the error message contains:
- Database connection errors
- SQL query errors
- File access errors

Example error handling:

```typescript
try {
  const books = await invoke('get_kobo_books', { devicePath: path });
} catch (error) {
  console.error('Failed to read Kobo database:', error);
  // Error message will be a string describing the issue
}
```

## Security Considerations

- Database is opened in read-only mode
- No SQL injection risk (uses parameterized queries where applicable)
- File system access is limited to Kobo device mount points
- Binary data (ExtraData) is returned as raw bytes for client-side parsing

## Testing

To test the integration:

1. Connect a Kobo device via USB
2. Verify the database exists at `/Volumes/KOBOeReader/.kobo/KoboReader.sqlite`
3. Call `get_kobo_library_data()` to retrieve all data
4. Verify the returned data structure matches TypeScript types

## Troubleshooting

### "Failed to open Kobo database"
- Ensure Kobo is properly mounted as USB mass storage
- Check that `.kobo/KoboReader.sqlite` exists on the device
- Verify file permissions allow read access

### "Failed to query books"
- Database might be corrupted (try ejecting and reconnecting)
- Kobo firmware version might have different schema
- Check Tauri console for detailed SQL error messages

### Empty results
- Kobo might be brand new with no books
- ContentType filter might exclude certain content types
- Check `Hidden` flag in Bookmark table

## Future Enhancements

Potential improvements for future versions:

- [ ] Write support for syncing reading progress back to Kobo
- [ ] Collection/shelf sync
- [ ] Cover image extraction
- [ ] More detailed event parsing (ExtraData binary format)
- [ ] Reading statistics aggregation
- [ ] Cross-device progress sync (Kobo ↔ Stomy database)
