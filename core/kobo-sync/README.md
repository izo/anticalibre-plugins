# Kobo Sync Plugin

Plugin for synchronizing ebooks with Kobo e-reader devices via USB connection.

## Features

- 🔍 **Automatic Kobo Detection** - Detects Kobo devices when connected via USB
- 📚 **Native Format Support** - Native support for EPUB, PDF, MOBI, CBZ formats
- ⚡ **Smart Sync** - Only syncs books that aren't already on the device
- 🔄 **Bidirectional Support** - Can import books from Kobo to library
- 📊 **Device Info** - Shows Kobo model, firmware, and storage space
- 📖 **Reading Progress Sync** - Import reading progress from Kobo (percent read, time spent, read status)
- 📝 **Annotations Import** - Extract highlights and annotations from your Kobo
- 📚 **Vocabulary Tracking** - Import dictionary lookups for language learning
- 🗄️ **Database Access** - Full read access to KoboReader.sqlite database
- 📈 **Reading Statistics** - Track your reading habits with detailed events

## Supported Devices

All Kobo e-reader models with USB mass storage support:
- Kobo Clara
- Kobo Libra
- Kobo Forma
- Kobo Aura
- Kobo Glo
- Kobo Touch
- Older Kobo models

## Supported Formats

### Native Kobo Formats
- **EPUB** - Primary e-book format (fully supported)
- **PDF** - Supported by Kobo without conversion
- **MOBI** - Supported on most Kobo devices
- **CBZ/CBR** - Comic book formats
- **TXT** - Plain text files

## Installation

The plugin is included with Stomy and enabled by default. To disable it:

1. Open Stomy
2. Go to Settings → Plugins
3. Find "Kobo Sync" in the plugin list
4. Click "Disable" if you don't use Kobo devices

## Usage

### Detecting Kobo Devices

1. Connect your Kobo via USB
2. The plugin will automatically detect it in the Sync view
3. You'll see device information including:
   - Model name
   - Serial number
   - Available storage space

### Syncing Books

1. Select books in your library
2. Click "Sync to Kobo"
3. Books will be copied to the Kobo device
4. Progress will be shown in real-time

### Plugin Settings

- **Target Folder**: Kobo folder to sync to (default: .kobo)
- **Show Notifications**: Display system notifications for sync events (default: enabled)
- **Auto Eject**: Automatically eject device after sync (default: disabled)
- **Sync Metadata**: Sync book metadata to Kobo database (default: enabled)
- **Sync Reading Progress**: Import reading progress from Kobo (default: enabled)
- **Sync Annotations**: Import highlights and annotations (default: enabled)
- **Sync Vocabulary**: Import vocabulary/dictionary lookups (default: disabled)

### Reading Progress Features

The plugin can now read data from the Kobo's internal SQLite database (`KoboReader.sqlite`) to import:

#### 📊 Reading Progress Data
- **Percent Read**: Exact reading progress (0-100%)
- **Read Status**: Unread, Reading, or Finished
- **Time Spent Reading**: Total time spent reading each book (in minutes)
- **Last Read Date**: When you last opened the book

#### 📝 Annotations & Highlights
- **Highlights**: Text passages you've marked
- **Annotations**: Your personal notes on passages
- **Location**: Chapter and position in the book
- **Timestamps**: When each highlight/note was created

#### 📚 Vocabulary Words
- **Dictionary Lookups**: Words you've looked up in the Kobo dictionary
- **Context**: Which book you were reading
- **Learning Progress**: Track your vocabulary expansion

#### 📈 Reading Events
- **Reading Milestones**: Automatic tracking at 25%, 50%, 75%, 100%
- **Session History**: Start/stop reading events
- **Reading Patterns**: Analyze your reading habits

## Technical Details

### Backend (Rust)

The plugin uses Rust for performance-critical operations:

- **Device Detection** (`detect_kobo_devices`): Scans `/Volumes` on macOS for Kobo devices
- **File Operations** (`copy_file_to_device`): Efficient file copying to Kobo storage
- **Database Reading** (`get_kobo_library_data`): Reads KoboReader.sqlite database
- **Progress Tracking** (`get_kobo_books`): Extracts reading progress for all books
- **Annotations** (`get_kobo_bookmarks`): Retrieves highlights and notes
- **Events** (`get_kobo_events`): Reads reading activity history
- **Vocabulary** (`get_kobo_vocabulary`): Extracts dictionary lookups

### Frontend (TypeScript)

TypeScript interfaces for:
- Device management
- Sync orchestration
- Settings management

## Limitations

- **macOS Focus**: Currently optimized for macOS (Windows/Linux support planned)
- **USB Connection Required**: No wireless sync support yet
- **No DRM Support**: Cannot sync DRM-protected books

## Troubleshooting

### Kobo Not Detected

1. Ensure Kobo is in USB mass storage mode (not charging only)
2. Check that `/Volumes/KOBOeReader` appears in Finder
3. Try reconnecting the USB cable
4. Restart Stomy

### Books Not Appearing on Kobo

1. Ensure books are in supported formats
2. Restart your Kobo device
3. Check Kobo storage is not full
4. Verify files are not corrupted

## Development

### Adding New Features

The plugin architecture allows easy extensions:

```typescript
// Add a new action
koboPlugin.actions?.push({
  id: 'my-action',
  label: 'My Action',
  icon: 'Star',
  context: 'library',
  onClick: async () => {
    // Your code here
  },
});
```

### Testing

```bash
# Build Rust backend
cd src-tauri
cargo test

# Run Tauri app
npm run tauri dev
```

## API Usage

### Importing Reading Progress

```typescript
import { getKoboLibraryData, formatReadingTime } from './core/kobo-sync';

// Get all data from connected Kobo
const libraryData = await getKoboLibraryData('/Volumes/KOBOeReader');

// Display books with progress
libraryData.books.forEach(book => {
  console.log(`${book.title} by ${book.attribution}`);
  console.log(`  Progress: ${book.percentRead.toFixed(1)}%`);
  console.log(`  Status: ${book.readStatus === 2 ? 'Finished' : 'Reading'}`);
  console.log(`  Time spent: ${formatReadingTime(book.timeSpentReading)}`);
});

// Display annotations
libraryData.bookmarks.forEach(bookmark => {
  console.log(`"${bookmark.text}"`);
  if (bookmark.annotation) {
    console.log(`  Note: ${bookmark.annotation}`);
  }
});
```

### Checking Progress for Specific Book

```typescript
import { getBookProgress } from './core/kobo-sync';

// By ISBN
const progress = await getBookProgress(
  '/Volumes/KOBOeReader',
  '9781234567890'
);

// By title
const progress = await getBookProgress(
  '/Volumes/KOBOeReader',
  undefined,
  'The Lord of the Rings'
);

if (progress) {
  console.log(`You're ${progress.percentRead}% through this book!`);
}
```

### Syncing to Stomy Library

```typescript
import { syncReadingProgress } from './core/kobo-sync';

const stats = await syncReadingProgress(
  '/Volumes/KOBOeReader',
  (stats) => {
    console.log(`Synced: ${stats.booksUpdated} books`);
  }
);

console.log(`Total: ${stats.booksFound} books found`);
console.log(`Progress synced: ${stats.progressSynced}`);
console.log(`Annotations: ${stats.annotationsSynced}`);
```

## Database Schema

The Kobo database (`KoboReader.sqlite`) contains these key tables:

### `content` - Book metadata and progress
- `ContentID` - Unique identifier
- `Title`, `Attribution`, `ISBN` - Book info
- `___PercentRead` - Reading progress (0-100)
- `ReadStatus` - 0=Unread, 1=Reading, 2=Finished
- `TimeSpentReading` - Minutes
- `DateLastRead` - ISO timestamp

### `Bookmark` - Highlights and annotations
- `BookmarkID` - Unique identifier
- `Text` - Highlighted text
- `Annotation` - User's note
- `DateCreated` - Timestamp
- `Type` - highlight, annotation, bookmark

### `Event` - Reading activity
- `Type` - 3=Start, 5=Finish, 1011-1014=Progress
- `ContentID` - Book reference
- `LastOccurrence` - Timestamp

### `WordList` - Dictionary lookups
- `Text` - Word looked up
- `VolumeID` - Book reference
- `DateCreated` - Timestamp

## Integration

See [INTEGRATION.md](./INTEGRATION.md) for detailed instructions on integrating the Rust backend into your Stomy application.

## Roadmap

- [x] Reading progress sync
- [x] Annotations and highlights import
- [x] Vocabulary tracking
- [x] Reading events and statistics
- [ ] Windows and Linux compatibility
- [ ] Wireless sync via Kobo WiFi
- [ ] Batch sync UI
- [ ] Collection/shelf sync
- [ ] Cover image optimization
- [ ] Write support (sync progress back to Kobo)

## License

Part of Stomy - see main LICENSE file.

## Credits

- Built with [Tauri](https://tauri.app/)
- Icons from [Lucide](https://lucide.dev/)
