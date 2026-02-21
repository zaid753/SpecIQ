export interface UserProfile {
  fullName?: string;
  jobRole?: string;
  company?: string;
  photoURL?: string;
  language?: string;
  onboarded?: boolean;
  theme?: 'light' | 'dark';
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  organization: string;
  description: string;
  startDate: string;
  tags: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  gmailConnected?: boolean;
}

export interface GmailEmail {
  id: string;
  messageId: string;
  threadId: string;
  subject: string;
  sender: string;
  recipient: string;
  timestamp: number;
  snippet: string;
  syncTimestamp: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}
