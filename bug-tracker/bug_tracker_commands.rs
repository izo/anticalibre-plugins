/**
 * Bug Tracker - Tauri Commands
 * Rust backend for GitHub integration
 */

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubAuthStatus {
    pub authenticated: bool,
    pub user: Option<String>,
    pub scopes: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubIssueResult {
    pub url: String,
    pub number: u32,
}

/// Check GitHub CLI authentication status
#[command]
pub async fn github_auth_status() -> Result<GitHubAuthStatus, String> {
    // Check if gh is installed
    let gh_version = Command::new("gh")
        .arg("--version")
        .output();

    if gh_version.is_err() {
        return Ok(GitHubAuthStatus {
            authenticated: false,
            user: None,
            scopes: None,
        });
    }

    // Check auth status
    let output = Command::new("gh")
        .args(&["auth", "status"])
        .output()
        .map_err(|e| format!("Failed to check auth status: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);

    if !output.status.success() || stderr.contains("not logged in") {
        return Ok(GitHubAuthStatus {
            authenticated: false,
            user: None,
            scopes: None,
        });
    }

    // Parse username from output
    let user = stderr
        .lines()
        .find(|line| line.contains("Logged in to github.com as"))
        .and_then(|line| {
            line.split("as ")
                .nth(1)
                .map(|s| s.trim_end_matches(" (").trim().to_string())
        });

    // Parse scopes (simplified - actual parsing may vary)
    let scopes = if stderr.contains("repo") || stderr.contains("write:project") {
        Some(vec!["repo".to_string(), "write:project".to_string()])
    } else {
        None
    };

    Ok(GitHubAuthStatus {
        authenticated: true,
        user,
        scopes,
    })
}

/// Create a GitHub issue using gh CLI
#[command]
pub async fn github_create_issue(
    repo: String,
    title: String,
    body: String,
    labels: Vec<String>,
    assignee: Option<String>,
) -> Result<GitHubIssueResult, String> {
    // Validate inputs
    if repo.is_empty() {
        return Err("Repository cannot be empty".to_string());
    }
    if title.is_empty() {
        return Err("Title cannot be empty".to_string());
    }
    if !repo.contains('/') {
        return Err("Repository must be in format 'owner/repo'".to_string());
    }

    // Build gh command
    let mut cmd = Command::new("gh");
    cmd.args(&["issue", "create", "--repo", &repo, "--title", &title, "--body", &body]);

    // Add labels
    if !labels.is_empty() {
        cmd.arg("--label");
        cmd.arg(labels.join(","));
    }

    // Add assignee
    if let Some(assignee_name) = assignee {
        if !assignee_name.is_empty() {
            cmd.arg("--assignee");
            cmd.arg(&assignee_name);
        }
    }

    // Execute command
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute gh command: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh command failed: {}", error));
    }

    // Parse issue URL from output
    let stdout = String::from_utf8_lossy(&output.stdout);
    let url = stdout.trim().to_string();

    // Extract issue number from URL
    let number = url
        .split('/')
        .last()
        .and_then(|s| s.parse::<u32>().ok())
        .ok_or_else(|| "Failed to parse issue number from URL".to_string())?;

    Ok(GitHubIssueResult { url, number })
}

/// Test function to verify gh CLI is working
#[command]
pub async fn github_test_connection() -> Result<String, String> {
    let output = Command::new("gh")
        .args(&["api", "user"])
        .output()
        .map_err(|e| format!("Failed to test connection: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Connection test failed: {}", error));
    }

    let response = String::from_utf8_lossy(&output.stdout);
    Ok(response.to_string())
}

// Register commands in your main.rs:
// .invoke_handler(tauri::generate_handler![
//     github_auth_status,
//     github_create_issue,
//     github_test_connection,
// ])
