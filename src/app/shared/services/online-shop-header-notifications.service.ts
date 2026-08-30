import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ChatHubService } from './chat-hub.service';
import { RestService } from './rest.service';
import { environment } from 'src/environments/environment';

export interface LiveChatHeaderPreview {
  userId: string;
  name: string;
  preview: string;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class OnlineShopHeaderNotificationsService implements OnDestroy {
  private readonly liveChatUnreadByUser = new Map<string, number>();
  private readonly liveChatNamesByUser = new Map<string, string>();
  private readonly liveChatPreviewByUser = new Map<string, string>();

  private readonly liveChatUnreadTotalSubject = new BehaviorSubject<number>(0);
  private readonly emailUnreadSubject = new BehaviorSubject<number>(0);
  private readonly priceChallengeReviewSubject = new BehaviorSubject<number>(0);

  readonly liveChatUnreadTotal$ = this.liveChatUnreadTotalSubject.asObservable();
  readonly emailUnread$ = this.emailUnreadSubject.asObservable();
  readonly priceChallengeReviewCount$ = this.priceChallengeReviewSubject.asObservable();

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private chatSub: Subscription | null = null;
  private liveChatPageActive = false;
  private activeLiveChatUserId: string | null = null;

  constructor(
    private chatHub: ChatHubService,
    private restService: RestService,
  ) {}

  ngOnDestroy(): void {
    this.stop();
  }

  start(): void {
    if (this.pollTimer) {
      return;
    }

    this.chatHub.startConnection();
    this.refreshEmailUnread();
    this.refreshPriceChallengeReviewCount();

    this.chatSub?.unsubscribe();
    this.chatSub = this.chatHub.privateMessage$.subscribe((payload) => {
      if (!payload?.userId || payload.fromAdmin || this.liveChatPageActive) {
        return;
      }
      this.recordLiveChatCustomerMessage(payload.userId, payload.message);
    });

    this.pollTimer = setInterval(() => {
      this.refreshEmailUnread();
      this.refreshPriceChallengeReviewCount();
    }, 60000);
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.chatSub?.unsubscribe();
    this.chatSub = null;
  }

  setLiveChatPageActive(active: boolean): void {
    this.liveChatPageActive = active;
    if (!active) {
      this.activeLiveChatUserId = null;
    }
  }

  setActiveLiveChatCustomer(userId: string | null): void {
    this.activeLiveChatUserId = userId ? this.normalizeUserId(userId) : null;
    if (this.activeLiveChatUserId) {
      this.clearLiveChatUnread(this.activeLiveChatUserId);
    }
  }

  registerLiveChatConversation(userId: string, name: string, unreadCount = 0): void {
    const key = this.normalizeUserId(userId);
    if (!key) {
      return;
    }
    this.liveChatNamesByUser.set(key, name || 'Customer');
    if (unreadCount > 0) {
      this.liveChatUnreadByUser.set(key, unreadCount);
      this.publishLiveChatTotal();
    }
  }

  getLiveChatUnread(userId: string): number {
    return this.liveChatUnreadByUser.get(this.normalizeUserId(userId)) || 0;
  }

  getLiveChatUnreadTotal(): number {
    return this.liveChatUnreadTotalSubject.value;
  }

  getEmailUnread(): number {
    return this.emailUnreadSubject.value;
  }

  getPriceChallengeReviewCount(): number {
    return this.priceChallengeReviewSubject.value;
  }

  getLiveChatPreviews(limit = 5): LiveChatHeaderPreview[] {
    return Array.from(this.liveChatUnreadByUser.entries())
      .filter(([, count]) => count > 0)
      .map(([userId, unreadCount]) => ({
        userId,
        name: this.liveChatNamesByUser.get(userId) || 'Customer',
        preview: this.liveChatPreviewByUser.get(userId) || '',
        unreadCount,
      }))
      .slice(0, limit);
  }

  clearLiveChatUnread(userId: string): void {
    const key = this.normalizeUserId(userId);
    if (!key) {
      return;
    }
    this.liveChatUnreadByUser.delete(key);
    this.publishLiveChatTotal();
  }

  refreshEmailUnread(): void {
    this.restService.getWithoutLoader(environment.urls.EmailSupport_GetInboxSummary).subscribe({
      next: (response) => {
        const unread = Number(response?.result?.unreadCount ?? response?.result?.UnreadCount ?? 0);
        this.emailUnreadSubject.next(Number.isFinite(unread) && unread > 0 ? unread : 0);
      },
      error: () => undefined,
    });
  }

  refreshPriceChallengeReviewCount(): void {
    const url = `${environment.urls.PriceChallengeAdmin_GetReviewsForAdmin}?MaxResultCount=1&SkipCount=0`;
    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        const total = Number(response?.result?.totalCount ?? response?.result?.TotalCount ?? 0);
        this.priceChallengeReviewSubject.next(Number.isFinite(total) && total > 0 ? total : 0);
      },
      error: () => undefined,
    });
  }

  recordLiveChatCustomerMessage(userId: string, message: string): void {
    const key = this.normalizeUserId(userId);
    if (!key) {
      return;
    }

    this.liveChatPreviewByUser.set(key, this.previewText(message));

    if (
      this.liveChatPageActive
      && this.activeLiveChatUserId
      && this.activeLiveChatUserId === key
    ) {
      return;
    }

    const next = (this.liveChatUnreadByUser.get(key) || 0) + 1;
    this.liveChatUnreadByUser.set(key, next);
    this.publishLiveChatTotal();
  }

  private publishLiveChatTotal(): void {
    let total = 0;
    this.liveChatUnreadByUser.forEach((count) => {
      total += count;
    });
    this.liveChatUnreadTotalSubject.next(total);
  }

  private previewText(message: string): string {
    const text = (message || '').trim();
    if (text.startsWith('[[img]]')) {
      return 'Photo';
    }
    return text;
  }

  private normalizeUserId(userId?: string | null): string {
    return (userId || '').trim().toLowerCase();
  }
}
