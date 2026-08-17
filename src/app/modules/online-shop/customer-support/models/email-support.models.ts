export interface EmailMailbox {
  id: string;
  emailAddress: string;
  displayName: string;
  domain?: string;
  mailboxType: string;
  isActive: boolean;
  openCount: number;
  unreadCount: number;
}

export interface EmailMailboxConfig {
  id: string;
  emailAddress: string;
  displayName: string;
  domain?: string;
  mailboxType: string;
  isActive: boolean;
}

export const EMAIL_MAILBOX_TYPES = [
  { id: 'Support', name: 'Support' },
  { id: 'Info', name: 'Info' },
  { id: 'Orders', name: 'Orders' },
  { id: 'Accounts', name: 'Accounts' },
  { id: 'Sales', name: 'Sales' },
  { id: 'General', name: 'General' },
];

export interface EmailInboxSummary {
  mailboxes: EmailMailbox[];
  openCount: number;
  unassignedCount: number;
  unreadCount: number;
  resolvedCount: number;
  unroutedCount: number;
}

export interface EmailConversationListItem {
  id: string;
  mailboxId?: string;
  mailboxName?: string;
  mailboxAddress?: string;
  subject: string;
  customerEmail: string;
  customerName?: string;
  customerId?: string;
  customerPhone?: string;
  status: string;
  assignedUserId?: number;
  assignedUserName?: string;
  isUnread: boolean;
  unreadCount: number;
  isUnrouted: boolean;
  hasAttachments: boolean;
  preview: string;
  lastMessageAt: string;
}

export interface EmailAttachment {
  id: string;
  emailMessageId: string;
  fileName: string;
  contentType: string;
  size: number;
  isInline: boolean;
  downloadFailed: boolean;
}

export interface EmailMessage {
  id: string;
  conversationId: string;
  direction: string;
  fromAddress: string;
  fromName?: string;
  toAddresses?: string;
  ccAddresses?: string;
  subject?: string;
  textBody?: string;
  safeHtmlBody?: string;
  receivedAt?: string;
  sentAt?: string;
  creationTime: string;
  createdByUserName?: string;
  createdByUserId?: number;
  processingStatus?: string;
  attachments: EmailAttachment[];
}

export interface EmailConversationDetail extends EmailConversationListItem {
  messages: EmailMessage[];
  replyFrom?: string;
  replyTo?: string;
}

export interface EmailSupportUser {
  id: number;
  name: string;
  emailAddress: string;
}

export const EMAIL_CONVERSATION_STATUSES = [
  { id: 'Open', name: 'Open' },
  { id: 'Pending', name: 'Pending' },
  { id: 'Resolved', name: 'Resolved' },
];
