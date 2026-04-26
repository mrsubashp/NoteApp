export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  reminder?: {
    datetime: string; // ISO string
    enabled: boolean;
  };
  attachments: Attachment[];
  sharedWith?: string[]; // Array of emails
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  categories: string[];
  syncPreference: 'firebase' | 'icloud' | 'gdrive' | 'onedrive';
}
