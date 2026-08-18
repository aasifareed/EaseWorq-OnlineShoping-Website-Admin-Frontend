import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/shared/services/auth.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { ChatConversation, newChatGuid } from '../../modules/online-shop/live-chat/models/chat.models';
import { AlertSoundService } from './alert-sound.service';

export interface ChatPrivateMessage {
  message: string;
  fromAdmin: boolean;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatHubService {
  private static readonly ADMIN_CHAT_USER_KEY = 'online_shop_admin_chat_user_id';

  public hubConnection?: signalR.HubConnection;
  public connected = false;

  private readonly usersUpdated = new Subject<ChatConversation[]>();
  private readonly privateMessage = new Subject<ChatPrivateMessage>();
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private startInProgress = false;

  readonly usersUpdated$ = this.usersUpdated.asObservable();
  readonly privateMessage$ = this.privateMessage.asObservable();
  readonly connected$ = this.connectedSubject.asObservable();

  constructor(
    private authService: AuthService,
    private globalDataService: GlobalDataService,
    private ngZone: NgZone,
    private alertSound: AlertSoundService,
  ) {}

  get adminChatUserId(): string {
    let id = localStorage.getItem(ChatHubService.ADMIN_CHAT_USER_KEY);
    if (!id) {
      id = newChatGuid();
      localStorage.setItem(ChatHubService.ADMIN_CHAT_USER_KEY, id);
    }
    return id;
  }

  startConnection(): void {
    if (!this.authService.getEncryptedToken()) {
      return;
    }

    const existing = this.hubConnection;
    if (existing) {
      const state = existing.state;
      if (
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        void this.registerAdmin();
        return;
      }
      void existing.stop().catch(() => undefined);
      this.hubConnection = undefined;
    }

    if (this.startInProgress) {
      return;
    }

    this.startInProgress = true;
    const token = this.authService.getEncryptedToken();
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.buildHubUrl(), {
        accessTokenFactory: () => this.authService.getEncryptedToken() || token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000, 30000])
      .build();

    this.hubConnection.on('UsersListUpdated', (users: ChatConversation[]) => {
      this.ngZone.run(() => this.usersUpdated.next(this.normalizeUsers(users)));
    });

    this.hubConnection.on(
      'ReceivePrivateMessage',
      (message: string, fromAdmin: boolean, userId: string) => {
        this.ngZone.run(() => {
          this.privateMessage.next({
            message,
            fromAdmin: !!fromAdmin,
            userId,
          });
          if (!fromAdmin) {
            this.alertSound.play();
          }
        });
      },
    );

    this.hubConnection.onreconnected(() => {
      this.connected = true;
      this.connectedSubject.next(true);
      void this.registerAdmin();
    });

    this.hubConnection.onclose(() => {
      this.connected = false;
      this.connectedSubject.next(false);
    });

    void this.hubConnection
      .start()
      .then(async () => {
        this.connected = true;
        this.connectedSubject.next(true);
        await this.registerAdmin();
      })
      .catch((err) => {
        this.connected = false;
        this.connectedSubject.next(false);
        console.warn('Chat hub start failed', err);
      })
      .finally(() => {
        this.startInProgress = false;
      });
  }

  disconnectOnLogout(): void {
    this.connected = false;
    this.connectedSubject.next(false);
    const conn = this.hubConnection;
    this.hubConnection = undefined;
    if (conn) {
      void conn.stop().catch(() => undefined);
    }
  }

  async registerAdmin(): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    const currentUser = this.authService.getcurrentUser();
    const name = currentUser?.fullName || currentUser?.name || 'Admin';
    const email = currentUser?.emailAddress || currentUser?.email || null;
    await this.hubConnection.invoke(
      'RegisterUser',
      this.adminChatUserId,
      name,
      true,
      email,
    );
  }

  async sendToCustomer(message: string, customerId: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Chat is not connected.');
    }
    await this.hubConnection.invoke('SendPrivateMessageToUser', message, true, customerId);
  }

  privateMessageListener(): Observable<ChatPrivateMessage> {
    return this.privateMessage$;
  }

  private buildHubUrl(): string {
    const base = environment.baseUrl.endsWith('/') ? environment.baseUrl : `${environment.baseUrl}/`;
    const tenantId = this.globalDataService.getCurrentTanantId();
    const params = new URLSearchParams();
    if (tenantId) {
      params.set('Abp.TenantId', String(tenantId));
      params.set('tenantId', String(tenantId));
    }
    const query = params.toString();
    return query ? `${base}signalr/chatHub?${query}` : `${base}signalr/chatHub`;
  }

  private normalizeUsers(users: ChatConversation[] | null | undefined): ChatConversation[] {
    return (users || []).map((user) => ({
      id: user.id || (user as any).Id,
      name: user.name || (user as any).Name || 'Customer',
      email: user.email || (user as any).Email,
      connectionId: user.connectionId || (user as any).ConnectionId,
      isOnline: !!(user.isOnline ?? (user as any).IsOnline ?? (user.connectionId || (user as any).ConnectionId)),
      lastMessage: user.lastMessage || (user as any).LastMessage,
      lastTimestamp: user.lastTimestamp || (user as any).LastTimestamp,
      unreadCount: 0,
    }));
  }
}
