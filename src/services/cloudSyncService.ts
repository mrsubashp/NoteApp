import { Note } from '../types';

// iCloud, Google Drive, and OneDrive sync are planned features — not yet implemented.
// CloudSyncSettings marks these providers as "Coming soon" so users cannot select them.
// The functions below are retained as typed stubs so import sites in App.tsx continue
// to compile without changes.

export const syncToICloud = async (_note: Note): Promise<void> => {
  // CloudKit JS integration requires Apple Developer Program membership and
  // web-domain verification. Planned for a future release.
};

export const syncToGoogleDrive = async (_note: Note, _accessToken: string): Promise<void> => {
  // Google Drive API integration planned for a future release.
};

export const syncToOneDrive = async (_note: Note, _accessToken: string): Promise<void> => {
  // Microsoft Graph API integration planned for a future release.
};
