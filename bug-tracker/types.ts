/**
 * Bug Tracker Plugin Types
 */

export interface BugReport {
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'question' | 'enhancement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  page?: string;
  url?: string;
  screenshot?: string; // Base64 encoded image
}

export interface SystemContext {
  // Browser/WebView info
  userAgent: string;
  browser: string;
  browserVersion: string;
  isWebView: boolean;

  // OS info
  os: string;
  osVersion: string;
  platform: string;
  arch: string;

  // Screen info
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;

  // Locale info
  language: string;
  languages: string[];
  timezone: string;

  // Connection info
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;

  // App info
  appVersion?: string;
  tauriVersion?: string;
}

export interface GitHubIssue {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

export interface BugTrackerSettings {
  enabled: boolean;
  githubRepo: string; // format: "owner/repo"
  autoAssign: boolean;
  assignee?: string;
  defaultLabels: string[];
  autoScreenshot: boolean;
  collectSystemInfo: boolean;
  showInSidebar: boolean;
  sidebarPosition: 'top' | 'bottom';
}

export interface GitHubAuthStatus {
  authenticated: boolean;
  user?: string;
  scopes?: string[];
}

export interface BugSubmissionResult {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  error?: string;
}
