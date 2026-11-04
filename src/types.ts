export interface Student {
  usn: string;
  email: string;
  name: string;
  branch: string;
  year: string;
}

export type ItemStatus = 'lost' | 'found' | 'claimed';

export interface Item {
  _id?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image?: string | null; // Base64 or URL
  status: ItemStatus;
  uploadedBy: {
    name: string;
    usn: string;
    email: string;
    branch: string;
  };
  claimedBy?: {
    name: string;
    usn: string;
    email: string;
    branch: string;
    claimedAt: string;
  };
  createdAt: string;
}

export interface ClaimRecord {
  item_id: string;
  item_title: string;
  claimedBy: {
    name: string;
    usn: string;
    email: string;
    branch: string;
  };
  uploadedBy: {
    name: string;
    usn: string;
    email: string;
    branch: string;
  };
  claimedAt: string;
}

export interface RequestedItem {
  _id?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image?: string | null; // Base64 encoding
  requester: {
    name: string;
    usn: string;
    email: string;
    branch: string;
  };
  createdAt: string;
}

export interface RequestMessage {
  _id?: string;
  requestId: string;
  requestTitle: string;
  messageText: string;
  sender: {
    name: string;
    usn: string;
    email: string;
  };
  recipientUsn: string;
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  parsed?: {
    year: string;
    dept: string;
    roll: string;
  };
}
