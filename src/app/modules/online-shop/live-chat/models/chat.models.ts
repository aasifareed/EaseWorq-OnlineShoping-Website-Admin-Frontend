export interface ChatHistoryItem {
  message: string;
  timestamp: string | Date;
  fromAdmin: boolean;
}

export const CHAT_IMAGE_PREFIX = '[[img]]';

export function encodeChatImage(url: string): string {
  return `${CHAT_IMAGE_PREFIX}${url}`;
}

export function isChatImageMessage(message?: string | null): boolean {
  return !!message && message.startsWith(CHAT_IMAGE_PREFIX);
}

export function chatImageUrl(message?: string | null): string {
  if (!isChatImageMessage(message)) {
    return '';
  }
  return String(message).slice(CHAT_IMAGE_PREFIX.length).trim();
}

export function chatPreviewText(message?: string | null): string {
  return isChatImageMessage(message) ? 'Photo' : (message || '');
}

export interface ChatConversation {
  id: string;
  name: string;
  email?: string;
  connectionId?: string;
  isOnline: boolean;
  lastMessage?: string;
  lastTimestamp?: string | Date;
  unreadCount?: number;
}

export function newChatGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function initialsFromName(name: string): string {
  const parts = (name || 'C').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'C';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
