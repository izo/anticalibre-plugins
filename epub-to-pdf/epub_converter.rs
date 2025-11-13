/// EPUB to PDF Conversion Module
/// This file should be placed in the main Stomy project's src-tauri/src/ directory
///
/// Instructions:
/// 1. Copy this file to src-tauri/src/epub_converter.rs
/// 2. Add `mod epub_converter;` to src-tauri/src/main.rs
/// 3. Register the commands in main.rs's tauri::Builder
/// 4. Add the dependencies listed in Cargo.toml

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConversionResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConverterInfo {
    pub available: bool,
    pub converter: String, // "calibre", "pandoc", or "none"
    pub version: Option<String>,
    pub path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConversionJob {
    pub epub_path: String,
    pub pdf_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BatchConversionResult {
    pub success: bool,
    pub converted: usize,
    pub failed: usize,
    pub errors: Vec<ConversionError>,
    pub output_paths: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConversionError {
    pub file: String,
    pub error: String,
}

/// Check if ebook-convert (Calibre) is available
fn check_calibre() -> Option<ConverterInfo> {
    let result = if cfg!(target_os = "windows") {
        Command::new("where").arg("ebook-convert").output()
    } else {
        Command::new("which").arg("ebook-convert").output()
    };

    if let Ok(output) = result {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();

            // Try to get version
            let version = Command::new("ebook-convert")
                .arg("--version")
                .output()
                .ok()
                .and_then(|v| {
                    String::from_utf8(v.stdout)
                        .ok()
                        .map(|s| s.trim().to_string())
                });

            return Some(ConverterInfo {
                available: true,
                converter: "calibre".to_string(),
                version,
                path: Some(path),
            });
        }
    }
    None
}

/// Check if pandoc is available
fn check_pandoc() -> Option<ConverterInfo> {
    let result = if cfg!(target_os = "windows") {
        Command::new("where").arg("pandoc").output()
    } else {
        Command::new("which").arg("pandoc").output()
    };

    if let Ok(output) = result {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();

            // Try to get version
            let version = Command::new("pandoc")
                .arg("--version")
                .output()
                .ok()
                .and_then(|v| {
                    String::from_utf8(v.stdout)
                        .ok()
                        .and_then(|s| s.lines().next().map(|l| l.to_string()))
                });

            return Some(ConverterInfo {
                available: true,
                converter: "pandoc".to_string(),
                version,
                path: Some(path),
            });
        }
    }
    None
}

/// Check which converter is available (Calibre preferred, then Pandoc)
#[command]
pub fn check_epub_converter() -> ConverterInfo {
    // Try Calibre first (better quality conversion)
    if let Some(info) = check_calibre() {
        return info;
    }

    // Try Pandoc as fallback
    if let Some(info) = check_pandoc() {
        return info;
    }

    // No converter found
    ConverterInfo {
        available: false,
        converter: "none".to_string(),
        version: None,
        path: None,
    }
}

/// Convert EPUB to PDF using ebook-convert (Calibre)
fn convert_with_calibre(epub_path: &Path, pdf_path: &Path) -> ConversionResult {
    let output = Command::new("ebook-convert")
        .arg(epub_path)
        .arg(pdf_path)
        .arg("--paper-size")
        .arg("a4")
        .arg("--pdf-default-font-size")
        .arg("12")
        .arg("--pdf-mono-font-size")
        .arg("12")
        .arg("--margin-top")
        .arg("72")
        .arg("--margin-bottom")
        .arg("72")
        .arg("--margin-left")
        .arg("72")
        .arg("--margin-right")
        .arg("72")
        .arg("--preserve-cover-aspect-ratio")
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                ConversionResult {
                    success: true,
                    output_path: Some(pdf_path.to_string_lossy().to_string()),
                    error: None,
                }
            } else {
                let error_msg = String::from_utf8_lossy(&result.stderr).to_string();
                ConversionResult {
                    success: false,
                    output_path: None,
                    error: Some(format!("Calibre conversion failed: {}", error_msg)),
                }
            }
        }
        Err(e) => ConversionResult {
            success: false,
            output_path: None,
            error: Some(format!("Failed to execute ebook-convert: {}", e)),
        },
    }
}

/// Convert EPUB to PDF using Pandoc
fn convert_with_pandoc(epub_path: &Path, pdf_path: &Path) -> ConversionResult {
    let output = Command::new("pandoc")
        .arg(epub_path)
        .arg("-o")
        .arg(pdf_path)
        .arg("--pdf-engine=xelatex")
        .arg("-V")
        .arg("geometry:margin=1in")
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                ConversionResult {
                    success: true,
                    output_path: Some(pdf_path.to_string_lossy().to_string()),
                    error: None,
                }
            } else {
                let error_msg = String::from_utf8_lossy(&result.stderr).to_string();
                ConversionResult {
                    success: false,
                    output_path: None,
                    error: Some(format!("Pandoc conversion failed: {}", error_msg)),
                }
            }
        }
        Err(e) => ConversionResult {
            success: false,
            output_path: None,
            error: Some(format!("Failed to execute pandoc: {}", e)),
        },
    }
}

/// Convert a single EPUB file to PDF
#[command]
pub fn convert_epub_to_pdf(
    epub_path: String,
    pdf_path: String,
    converter: String,
) -> ConversionResult {
    let epub = Path::new(&epub_path);
    let pdf = Path::new(&pdf_path);

    // Check if input file exists
    if !epub.exists() {
        return ConversionResult {
            success: false,
            output_path: None,
            error: Some(format!("EPUB file not found: {}", epub_path)),
        };
    }

    // Check if input is an EPUB
    if epub.extension().and_then(|s| s.to_str()) != Some("epub") {
        return ConversionResult {
            success: false,
            output_path: None,
            error: Some("Input file must be an EPUB file".to_string()),
        };
    }

    // Create output directory if it doesn't exist
    if let Some(parent) = pdf.parent() {
        if !parent.exists() {
            if let Err(e) = std::fs::create_dir_all(parent) {
                return ConversionResult {
                    success: false,
                    output_path: None,
                    error: Some(format!("Failed to create output directory: {}", e)),
                };
            }
        }
    }

    // Perform conversion based on specified converter
    match converter.as_str() {
        "calibre" => convert_with_calibre(epub, pdf),
        "pandoc" => convert_with_pandoc(epub, pdf),
        _ => ConversionResult {
            success: false,
            output_path: None,
            error: Some(format!("Unknown converter: {}", converter)),
        },
    }
}

/// Convert multiple EPUB files to PDF in batch
#[command]
pub fn convert_multiple_epub_to_pdf(
    jobs: Vec<ConversionJob>,
    converter: String,
) -> BatchConversionResult {
    let mut converted = 0;
    let mut failed = 0;
    let mut errors = Vec::new();
    let mut output_paths = Vec::new();

    for job in jobs {
        let result = convert_epub_to_pdf(job.epub_path.clone(), job.pdf_path.clone(), converter.clone());

        if result.success {
            converted += 1;
            if let Some(path) = result.output_path {
                output_paths.push(path);
            }
        } else {
            failed += 1;
            errors.push(ConversionError {
                file: job.epub_path,
                error: result.error.unwrap_or_else(|| "Unknown error".to_string()),
            });
        }
    }

    BatchConversionResult {
        success: failed == 0,
        converted,
        failed,
        errors,
        output_paths,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_epub_converter() {
        let info = check_epub_converter();
        println!("Converter info: {:?}", info);
        // This test just checks if the function runs without panicking
    }

    #[test]
    fn test_converter_detection() {
        let calibre = check_calibre();
        let pandoc = check_pandoc();

        println!("Calibre: {:?}", calibre);
        println!("Pandoc: {:?}", pandoc);
    }
}
