/**
 * Fake Sync Plugin - Entry Point
 * Simulates e-reader device synchronization for development and testing
 */

export * from './types';
export * from './FakeSyncPlugin';
export {
  fakeSyncPlugin as default,
  detectFakeDevice,
  getCurrentFakeDevice,
  setCurrentFakeDevice,
  isSyncInProgress,
} from './FakeSyncPlugin';
