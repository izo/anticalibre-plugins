/**
 * Kobo Database Reader
 *
 * Reads data from KoboReader.sqlite database located in the .kobo folder
 * of connected Kobo devices.
 *
 * Database location: /Volumes/KOBOeReader/.kobo/KoboReader.sqlite (macOS)
 */

use rusqlite::{Connection, Result as SqlResult, Row};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::command;

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KoboBook {
    pub content_id: String,
    pub isbn: Option<String>,
    pub title: String,
    pub attribution: Option<String>, // Author
    pub description: Option<String>,
    pub publisher: Option<String>,
    pub language: Option<String>,
    pub percent_read: f64, // 0-100
    pub read_status: i32,  // 0=Unread, 1=Reading, 2=Finished
    pub time_spent_reading: i32, // Minutes
    pub date_last_read: Option<String>,
    pub mime_type: String,
    pub content_type: String,
    pub user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KoboEvent {
    pub id: i32,
    pub content_id: String,
    pub event_type: i32,
    pub event_count: i32,
    pub last_occurrence: String,
    pub extra_data: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KoboBookmark {
    pub bookmark_id: String,
    pub volume_id: String,
    pub content_id: String,
    pub text: String,
    pub annotation: Option<String>,
    pub chapter_progress: f64,
    pub start_container_path: Option<String>,
    pub start_offset: Option<i32>,
    pub end_container_path: Option<String>,
    pub end_offset: Option<i32>,
    pub date_created: String,
    pub date_modified: Option<String>,
    pub bookmark_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KoboVocabulary {
    pub text: String,
    pub volume_id: String,
    pub date_created: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KoboLibraryData {
    pub books: Vec<KoboBook>,
    pub events: Vec<KoboEvent>,
    pub bookmarks: Vec<KoboBookmark>,
    pub vocabulary: Vec<KoboVocabulary>,
    pub last_sync: String,
}

// ============================================================================
// Database Connection
// ============================================================================

fn get_kobo_db_path(device_path: &str) -> PathBuf {
    PathBuf::from(device_path).join(".kobo").join("KoboReader.sqlite")
}

fn open_kobo_db(device_path: &str) -> SqlResult<Connection> {
    let db_path = get_kobo_db_path(device_path);
    Connection::open(db_path)
}

// ============================================================================
// Query Functions
// ============================================================================

fn parse_kobo_book(row: &Row) -> SqlResult<KoboBook> {
    Ok(KoboBook {
        content_id: row.get(0)?,
        isbn: row.get(1).ok(),
        title: row.get(2)?,
        attribution: row.get(3).ok(),
        description: row.get(4).ok(),
        publisher: row.get(5).ok(),
        language: row.get(6).ok(),
        percent_read: row.get::<_, Option<f64>>(7).unwrap_or(Some(0.0)).unwrap_or(0.0),
        read_status: row.get::<_, Option<i32>>(8).unwrap_or(Some(0)).unwrap_or(0),
        time_spent_reading: row.get::<_, Option<i32>>(9).unwrap_or(Some(0)).unwrap_or(0),
        date_last_read: row.get(10).ok(),
        mime_type: row.get(11)?,
        content_type: row.get(12)?,
        user_id: row.get(13).ok(),
    })
}

fn query_books(conn: &Connection) -> SqlResult<Vec<KoboBook>> {
    let mut stmt = conn.prepare(
        "SELECT
            ContentID,
            ISBN,
            Title,
            Attribution,
            Description,
            Publisher,
            Language,
            ___PercentRead,
            ReadStatus,
            TimeSpentReading,
            DateLastRead,
            MimeType,
            ContentType,
            ___UserID
        FROM content
        WHERE ContentType = 6 OR ContentType = 9
        ORDER BY DateLastRead DESC"
    )?;

    let books = stmt.query_map([], parse_kobo_book)?
        .filter_map(|r| r.ok())
        .collect();

    Ok(books)
}

fn query_events(conn: &Connection) -> SqlResult<Vec<KoboEvent>> {
    let mut stmt = conn.prepare(
        "SELECT
            Id,
            ContentID,
            Type,
            Count,
            LastOccurrence,
            ExtraData
        FROM Event
        ORDER BY LastOccurrence DESC
        LIMIT 1000"
    )?;

    let events = stmt.query_map([], |row| {
        Ok(KoboEvent {
            id: row.get(0)?,
            content_id: row.get(1)?,
            event_type: row.get(2)?,
            event_count: row.get(3)?,
            last_occurrence: row.get(4)?,
            extra_data: row.get(5).ok(),
        })
    })?
    .filter_map(|r| r.ok())
    .collect();

    Ok(events)
}

fn query_bookmarks(conn: &Connection) -> SqlResult<Vec<KoboBookmark>> {
    let mut stmt = conn.prepare(
        "SELECT
            BookmarkID,
            VolumeID,
            ContentID,
            Text,
            Annotation,
            ChapterProgress,
            StartContainerPath,
            StartOffset,
            EndContainerPath,
            EndOffset,
            DateCreated,
            DateModified,
            Type
        FROM Bookmark
        WHERE Hidden = 'false'
        ORDER BY DateCreated DESC"
    )?;

    let bookmarks = stmt.query_map([], |row| {
        Ok(KoboBookmark {
            bookmark_id: row.get(0)?,
            volume_id: row.get(1)?,
            content_id: row.get(2)?,
            text: row.get(3)?,
            annotation: row.get(4).ok(),
            chapter_progress: row.get::<_, Option<f64>>(5).unwrap_or(Some(0.0)).unwrap_or(0.0),
            start_container_path: row.get(6).ok(),
            start_offset: row.get(7).ok(),
            end_container_path: row.get(8).ok(),
            end_offset: row.get(9).ok(),
            date_created: row.get(10)?,
            date_modified: row.get(11).ok(),
            bookmark_type: row.get(12)?,
        })
    })?
    .filter_map(|r| r.ok())
    .collect();

    Ok(bookmarks)
}

fn query_vocabulary(conn: &Connection) -> SqlResult<Vec<KoboVocabulary>> {
    let mut stmt = conn.prepare(
        "SELECT
            Text,
            VolumeID,
            DateCreated
        FROM WordList
        ORDER BY DateCreated DESC
        LIMIT 500"
    )?;

    let vocabulary = stmt.query_map([], |row| {
        Ok(KoboVocabulary {
            text: row.get(0)?,
            volume_id: row.get(1)?,
            date_created: row.get(2)?,
        })
    })?
    .filter_map(|r| r.ok())
    .collect();

    Ok(vocabulary)
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Read all books from Kobo database
#[command]
pub fn get_kobo_books(device_path: String) -> Result<Vec<KoboBook>, String> {
    let conn = open_kobo_db(&device_path)
        .map_err(|e| format!("Failed to open Kobo database: {}", e))?;

    query_books(&conn)
        .map_err(|e| format!("Failed to query books: {}", e))
}

/// Read reading events from Kobo database
#[command]
pub fn get_kobo_events(device_path: String) -> Result<Vec<KoboEvent>, String> {
    let conn = open_kobo_db(&device_path)
        .map_err(|e| format!("Failed to open Kobo database: {}", e))?;

    query_events(&conn)
        .map_err(|e| format!("Failed to query events: {}", e))
}

/// Read bookmarks and annotations from Kobo database
#[command]
pub fn get_kobo_bookmarks(device_path: String) -> Result<Vec<KoboBookmark>, String> {
    let conn = open_kobo_db(&device_path)
        .map_err(|e| format!("Failed to open Kobo database: {}", e))?;

    query_bookmarks(&conn)
        .map_err(|e| format!("Failed to query bookmarks: {}", e))
}

/// Read vocabulary words from Kobo database
#[command]
pub fn get_kobo_vocabulary(device_path: String) -> Result<Vec<KoboVocabulary>, String> {
    let conn = open_kobo_db(&device_path)
        .map_err(|e| format!("Failed to open Kobo database: {}", e))?;

    query_vocabulary(&conn)
        .map_err(|e| format!("Failed to query vocabulary: {}", e))
}

/// Read all Kobo library data at once (optimized for single read)
#[command]
pub fn get_kobo_library_data(device_path: String) -> Result<KoboLibraryData, String> {
    let conn = open_kobo_db(&device_path)
        .map_err(|e| format!("Failed to open Kobo database: {}", e))?;

    let books = query_books(&conn)
        .map_err(|e| format!("Failed to query books: {}", e))?;

    let events = query_events(&conn)
        .map_err(|e| format!("Failed to query events: {}", e))?;

    let bookmarks = query_bookmarks(&conn)
        .map_err(|e| format!("Failed to query bookmarks: {}", e))?;

    let vocabulary = query_vocabulary(&conn)
        .map_err(|e| format!("Failed to query vocabulary: {}", e))?;

    Ok(KoboLibraryData {
        books,
        events,
        bookmarks,
        vocabulary,
        last_sync: chrono::Utc::now().to_rfc3339(),
    })
}

/// Get reading progress for a specific book by ISBN or title
#[command]
pub fn get_book_progress(
    device_path: String,
    isbn: Option<String>,
    title: Option<String>,
) -> Result<Option<KoboBook>, String> {
    let conn = open_kobo_db(&device_path)
        .map_err(|e| format!("Failed to open Kobo database: {}", e))?;

    let query = if let Some(isbn_val) = isbn {
        format!("SELECT * FROM content WHERE ISBN = '{}' LIMIT 1", isbn_val)
    } else if let Some(title_val) = title {
        format!("SELECT * FROM content WHERE Title LIKE '%{}%' LIMIT 1", title_val)
    } else {
        return Err("Either ISBN or title must be provided".to_string());
    };

    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let book = stmt.query_row([], parse_kobo_book).ok();

    Ok(book)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_path() {
        let path = get_kobo_db_path("/Volumes/KOBOeReader");
        assert_eq!(
            path.to_str().unwrap(),
            "/Volumes/KOBOeReader/.kobo/KoboReader.sqlite"
        );
    }
}
