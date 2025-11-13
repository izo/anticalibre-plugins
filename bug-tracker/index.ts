/**
 * Bug Tracker Plugin - Entry Point
 * Integrated feedback system for submitting bugs to GitHub Issues
 */

export * from './types';
export * from './BugTrackerPlugin';
export {
  bugTrackerPlugin as default,
  submitBugReport,
  collectSystemContext,
  captureScreenshot,
  formatGitHubIssue,
  checkGitHubAuth,
} from './BugTrackerPlugin';
