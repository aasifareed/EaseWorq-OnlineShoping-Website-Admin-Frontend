export interface WhatsAppUserListItem {
  id: string;
  phoneNumber: string;
  lastMessageTimeUtc: string;
  lastMessagePreview: string | null;
  unreadCount: number;
}

export interface WhatsAppMessageDto {
  id: string;
  phoneNumber: string;
  messageId: string;
  messageText: string;
  messageType?: string;
  mediaUrl?: string | null;
  direction: string;
  status: string;
  receivedAtUtc: string | null;
  sentAtUtc: string | null;
  isUnread: boolean;
}

export interface WhatsAppNewMessageNotification {
  phoneNumber: string;
  messageId: string;
  text: string | null;
  messageType?: string;
  mediaUrl?: string | null;
  receivedAtUtc: string;
}
