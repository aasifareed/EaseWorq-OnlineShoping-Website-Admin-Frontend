import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { ChatHubService } from 'src/app/shared/services/chat-hub.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { OnlineShopHeaderNotificationsService } from 'src/app/shared/services/online-shop-header-notifications.service';
import { ChatApiService } from './chat-api.service';
import {
  ChatConversation,
  ChatHistoryItem,
  chatImageUrl,
  chatPreviewText,
  encodeChatImage,
  initialsFromName,
  isChatImageMessage,
} from './models/chat.models';

@Component({
  selector: 'app-live-chat',
  templateUrl: './live-chat.component.html',
  styleUrls: ['./live-chat.component.css'],
})
export class LiveChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer: ElementRef<HTMLDivElement>;

  conversations: ChatConversation[] = [];
  filteredConversations: ChatConversation[] = [];
  selected: ChatConversation | null = null;
  messages: ChatHistoryItem[] = [];
  searchTerm = '';
  listFilter: 'all' | 'online' | 'unread' = 'all';
  hubConnected = false;
  draft = '';
  loadingList = false;
  loadingMessages = false;
  sending = false;
  private static readonly maxImageBytes = 5 * 1024 * 1024;
  private static readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  readonly quickReplies = [
    'Hi! How can I help you today?',
    'Please share your order number.',
    'We are looking into this for you.',
    'Your order has been updated. Please check your email.',
  ];
  private shouldScroll = false;
  private pendingSelectUserId: string | null = null;
  private pendingDraft: string | null = null;
  private readonly subs: Subscription[] = [];
  /** Realtime messages received before the admin opens that conversation or while history is loading. */
  private readonly pendingRealtimeByUser = new Map<string, ChatHistoryItem[]>();

  constructor(
    private chatApi: ChatApiService,
    private chatHub: ChatHubService,
    private headerNotifications: OnlineShopHeaderNotificationsService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    public globalDataService: GlobalDataService,
  ) {}

  ngOnInit(): void {
    this.pendingSelectUserId = (this.route.snapshot.queryParamMap.get('userId') || '').trim() || null;
    this.pendingDraft = (this.route.snapshot.queryParamMap.get('draft') || '').trim() || null;
    if (this.pendingDraft) {
      this.draft = this.pendingDraft;
    }
    this.headerNotifications.setLiveChatPageActive(true);
    this.chatHub.startConnection();
    this.loadConversations();
    this.subs.push(
      this.chatHub.usersUpdated$.subscribe((users) => this.mergeUsers(users)),
      this.chatHub.privateMessage$.subscribe((payload) => this.handleIncoming(payload)),
      this.chatHub.connected$.subscribe((connected) => {
        this.hubConnected = connected;
      }),
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.headerNotifications.setLiveChatPageActive(false);
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  loadConversations(): void {
    this.loadingList = true;
    this.chatApi.getConversations().subscribe({
      next: (items) => {
        this.conversations = items.map((item) => ({
          ...item,
          unreadCount: this.headerNotifications.getLiveChatUnread(item.id),
        }));
        items.forEach((item) => {
          this.headerNotifications.registerLiveChatConversation(
            item.id,
            item.name,
            this.headerNotifications.getLiveChatUnread(item.id),
          );
        });
        this.applyFilter();
        this.loadingList = false;
        this.selectPendingConversation();
      },
      error: () => {
        this.loadingList = false;
        this.toastr.error('Could not load conversations.');
      },
    });
  }

  selectConversation(conversation: ChatConversation): void {
    this.selected = conversation;
    this.headerNotifications.setActiveLiveChatCustomer(conversation.id);
    conversation.unreadCount = 0;
    this.loadingMessages = true;
    const conversationKey = this.normalizeUserId(conversation.id);
    this.chatApi.getChatHistory(conversation.id).subscribe({
      next: (history) => {
        if (this.normalizeUserId(this.selected?.id) !== conversationKey) {
          return;
        }
        const pending = this.consumePendingMessages(conversationKey);
        this.messages = this.mergeChatHistory(history || [], pending);
        this.loadingMessages = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.loadingMessages = false;
        this.toastr.error('Could not load messages.');
      },
    });
  }

  private selectPendingConversation(): void {
    if (!this.pendingSelectUserId) {
      return;
    }

    const targetId = this.pendingSelectUserId.toLowerCase();
    this.pendingSelectUserId = null;
    this.listFilter = 'all';
    this.applyFilter();

    const conversation = this.conversations.find((item) => item.id.toLowerCase() === targetId);
    if (conversation) {
      this.selectConversation(conversation);
      if (this.pendingDraft) {
        this.draft = this.pendingDraft;
        this.pendingDraft = null;
      }
    }
  }

  applyFilter(): void {
    const keyword = (this.searchTerm || '').trim().toLowerCase();
    this.filteredConversations = this.conversations.filter((item) => {
      if (this.listFilter === 'online' && !item.isOnline) {
        return false;
      }
      if (this.listFilter === 'unread' && !item.unreadCount) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        (item.name || '').toLowerCase().includes(keyword) ||
        (item.email || '').toLowerCase().includes(keyword) ||
        (item.lastMessage || '').toLowerCase().includes(keyword) ||
        chatPreviewText(item.lastMessage).toLowerCase().includes(keyword)
      );
    });
  }

  setFilter(filter: 'all' | 'online' | 'unread'): void {
    this.listFilter = filter;
    this.applyFilter();
  }

  useQuickReply(text: string): void {
    this.draft = text;
    this.send();
  }

  get onlineCount(): number {
    return this.conversations.filter((item) => item.isOnline).length;
  }

  get unreadTotal(): number {
    return this.headerNotifications.getLiveChatUnreadTotal();
  }

  send(): void {
    const text = (this.draft || '').trim();
    if (!text || !this.selected || this.sending) {
      return;
    }
    this.deliver(text, true);
  }

  onPickImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.sendImage(file);
    }
  }

  onPaste(event: ClipboardEvent): void {
    const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith('image/'));
    if (!file) {
      return;
    }
    event.preventDefault();
    this.sendImage(file);
  }

  isImage(message?: string): boolean {
    return isChatImageMessage(message);
  }

  imageSrc(message?: string): string {
    return this.resolveMediaUrl(chatImageUrl(message));
  }

  previewText(message?: string): string {
    return chatPreviewText(message);
  }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  initials(name: string): string {
    return initialsFromName(name);
  }

  formatTime(value: string | Date): string {
    if (!value) {
      return '';
    }
    return moment.utc(value).local().format('h:mm A');
  }

  formatListTime(value: string | Date): string {
    if (!value) {
      return '';
    }
    const local = moment.utc(value).local();
    return local.isSame(moment(), 'day') ? local.format('h:mm A') : local.format('DD MMM');
  }

  isSameDay(current: ChatHistoryItem, previous?: ChatHistoryItem): boolean {
    if (!previous) {
      return false;
    }
    return moment.utc(current.timestamp).local().isSame(moment.utc(previous.timestamp).local(), 'day');
  }

  dayLabel(value: string | Date): string {
    const local = moment.utc(value).local();
    if (local.isSame(moment(), 'day')) {
      return 'Today';
    }
    if (local.isSame(moment().subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }
    return local.format('DD MMM YYYY');
  }

  private sendImage(file: File): void {
    if (!this.selected || this.sending) {
      return;
    }
    if (
      !LiveChatComponent.allowedImageTypes.includes(file.type) &&
      !/\.(jpe?g|png|gif|webp)$/i.test(file.name)
    ) {
      this.toastr.error('Please send a JPG, PNG, GIF, or WEBP image.');
      return;
    }
    if (file.size > LiveChatComponent.maxImageBytes) {
      this.toastr.error('Image must be 5 MB or smaller.');
      return;
    }

    this.sending = true;
    this.chatApi.uploadImage(file).subscribe({
      next: (url) => {
        if (!url) {
          this.sending = false;
          this.toastr.error('Could not upload the image. Please try again.');
          return;
        }
        this.deliver(encodeChatImage(url), false);
      },
      error: () => {
        this.sending = false;
        this.toastr.error('Could not upload the image. Please try again.');
      },
    });
  }

  private deliver(text: string, clearDraft: boolean): void {
    if (!this.selected) {
      this.sending = false;
      return;
    }

    this.sending = true;
    this.chatHub
      .sendToCustomer(text, this.selected.id)
      .then(() => {
        this.messages = [
          ...this.messages,
          { message: text, fromAdmin: true, timestamp: new Date().toISOString() },
        ];
        this.selected.lastMessage = text;
        this.selected.lastTimestamp = new Date().toISOString();
        this.moveConversationToTop(this.selected);
        if (clearDraft) {
          this.draft = '';
        }
        this.sending = false;
        this.shouldScroll = true;
      })
      .catch((err) => {
        this.sending = false;
        const message = this.extractSendErrorMessage(err);
        this.toastr.error(message);
      });
  }

  private extractSendErrorMessage(err: unknown): string {
    const hubMessage =
      (err as any)?.message
      || (err as any)?.error?.message
      || (err as any)?.error?.error?.message;
    if (typeof hubMessage === 'string' && hubMessage.trim()) {
      return hubMessage.trim();
    }
    return 'Could not send the message. Check the chat connection.';
  }

  private resolveMediaUrl(url: string): string {
    if (!url) {
      return '';
    }
    const value = url.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
      return value;
    }
    const base = (environment.baseUrl || '').replace(/\/$/, '');
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${base}${path}`;
  }

  private handleIncoming(payload: { message: string; fromAdmin: boolean; userId: string }): void {
    if (!payload?.userId) {
      return;
    }

    const userKey = this.normalizeUserId(payload.userId);
    const item: ChatHistoryItem = {
      message: payload.message,
      fromAdmin: payload.fromAdmin,
      timestamp: new Date().toISOString(),
    };

    const conversation = this.conversations.find((entry) => this.normalizeUserId(entry.id) === userKey);
    if (conversation) {
      conversation.lastMessage = payload.message;
      conversation.lastTimestamp = item.timestamp;
      this.moveConversationToTop(conversation);
      this.headerNotifications.registerLiveChatConversation(conversation.id, conversation.name);
    }

    const isSelected = this.isSelectedUser(payload.userId);
    if (isSelected && !this.loadingMessages) {
      if (!this.isDuplicateMessage(this.messages, item)) {
        this.messages = [...this.messages, item];
        this.shouldScroll = true;
      }
    } else {
      this.queuePendingMessage(userKey, item);
      this.headerNotifications.recordLiveChatCustomerMessage(payload.userId, payload.message);
    }
    if (conversation) {
      conversation.unreadCount = this.headerNotifications.getLiveChatUnread(payload.userId);
    }
  }

  private mergeUsers(users: ChatConversation[]): void {
    const byId = new Map(
      this.conversations.map((item) => [this.normalizeUserId(item.id), item]),
    );
    users.forEach((user) => {
      const userKey = this.normalizeUserId(user.id);
      const existing = byId.get(userKey);
      if (existing) {
        existing.name = user.name || existing.name;
        existing.email = user.email || existing.email;
        existing.isOnline = user.isOnline;
        existing.connectionId = user.connectionId;
        existing.lastMessage = user.lastMessage || existing.lastMessage;
        existing.lastTimestamp = user.lastTimestamp || existing.lastTimestamp;
      } else {
        this.conversations.push({
          ...user,
          unreadCount: this.headerNotifications.getLiveChatUnread(user.id),
        });
      }
    });
    this.conversations.sort(
      (a, b) =>
        new Date(b.lastTimestamp || 0).getTime() - new Date(a.lastTimestamp || 0).getTime(),
    );
    this.applyFilter();
  }

  private moveConversationToTop(conversation: ChatConversation): void {
    this.conversations = [
      conversation,
      ...this.conversations.filter((item) => item.id !== conversation.id),
    ];
    this.applyFilter();
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  private normalizeUserId(userId?: string | null): string {
    return (userId || '').trim().toLowerCase();
  }

  private isSelectedUser(userId?: string | null): boolean {
    if (!userId || !this.selected?.id) {
      return false;
    }
    return this.normalizeUserId(this.selected.id) === this.normalizeUserId(userId);
  }

  private queuePendingMessage(userKey: string, item: ChatHistoryItem): void {
    const pending = this.pendingRealtimeByUser.get(userKey) || [];
    if (this.isDuplicateMessage(pending, item)) {
      return;
    }
    this.pendingRealtimeByUser.set(userKey, [...pending, item]);
  }

  private consumePendingMessages(userKey: string): ChatHistoryItem[] {
    const pending = this.pendingRealtimeByUser.get(userKey) || [];
    this.pendingRealtimeByUser.delete(userKey);
    return pending;
  }

  private mergeChatHistory(history: ChatHistoryItem[], pending: ChatHistoryItem[]): ChatHistoryItem[] {
    if (!pending.length) {
      return history;
    }

    const merged = [...history];
    for (const item of pending) {
      if (!this.isDuplicateMessage(merged, item)) {
        merged.push(item);
      }
    }

    merged.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return merged;
  }

  private isDuplicateMessage(list: ChatHistoryItem[], item: ChatHistoryItem): boolean {
    return list.some(
      (existing) =>
        existing.message === item.message
        && !!existing.fromAdmin === !!item.fromAdmin
        && Math.abs(new Date(existing.timestamp).getTime() - new Date(item.timestamp).getTime()) < 5000,
    );
  }
}
