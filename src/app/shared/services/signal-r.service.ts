import { Injectable, NgZone } from '@angular/core';
import * as signalR from "@microsoft/signalr";
import { title } from 'process';
import { environment } from 'src/environments/environment';
import { NotificationsDto } from '../models/NotificationDto';
import { AuthService } from './auth.service';
import { RestService } from './rest.service';
import { Observable, Subject } from 'rxjs';

export interface WhatsAppNotificationPayload {
  phoneNumber: string;
  messageId?: string;
  text?: string;
  receivedAtUtc?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public signalrNotifications: NotificationsDto[] = [];
  public hubConnection?: signalR.HubConnection;
  public signalRConnectionEnabled: boolean = false;

  /** Real-time WhatsApp new message notifications (for badge and click-to-open chat) */
  public whatsAppNotifications: WhatsAppNotificationPayload[] = [];
  private whatsAppNewMessageSubject = new Subject<WhatsAppNotificationPayload>();
  public whatsAppNewMessage$ = this.whatsAppNewMessageSubject.asObservable();

  private syncingDataSubject = new Subject<any>();
  public syncingData$ = this.syncingDataSubject.asObservable();

  private syncingTablesNameSubject = new Subject<any>();
  public syncingTablesName$ = this.syncingTablesNameSubject.asObservable();

  constructor(
    private authService: AuthService,
    private restService: RestService,
    private ngZone: NgZone
  ) { }

    public startConnection = () => {
    const existing = this.hubConnection;
    if (existing) {
      const s = existing.state;
      if (
        s === signalR.HubConnectionState.Connecting ||
        s === signalR.HubConnectionState.Connected ||
        s === signalR.HubConnectionState.Reconnecting
      ) {
        return;
      }
      void existing.stop().catch(() => undefined);
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.baseUrl + 'signalr/mart-task-hub', { accessTokenFactory: () => this.authService.getEncryptedToken() })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          // retryContext.previousRetryCount = 0,1,2,3...∞
          if (retryContext.previousRetryCount < 5) {
            // First 5 retries: backoff 0s, 2s, 5s, 10s, 20s
            const delays = [0, 2000, 5000, 10000, 20000];
            return delays[retryContext.previousRetryCount];
          }
    
          // After that retry every 30 seconds forever
          return 30000;
        }
      })
      .build();

    // Register handlers before start() so events are not missed while the connection is opening.
    this.hubConnection.on('SyncingData', data => {
      this.ngZone.run(() => this.syncingDataSubject.next(data));
    });

    this.hubConnection.on('SyncingTablesName', data => {
      this.ngZone.run(() => this.syncingTablesNameSubject.next(data));
    });

    this.hubConnection.on('ReceiveMessage', (data) =>
        {         
          
          let url = environment.urls.Notification_GET_ALL;
                   this.restService.getWithoutLoader(url).subscribe(res=>{
                    this.signalrNotifications=[];
                    res.result.items.forEach(element => {
                      
                      if(!element.status)
                      {
                       element.statusText='Completed';
                      }
                      
                      this.signalrNotifications.push({
                        icon: 'i-Add-User',
                        title:element.title,
                        badge: element.statusText,
                        text:element.description,
                        time:new Date(element.creationTime),
                        status:element.statusText,
                        link: element.link,
                        isRead:element.isRead,
                        id:element.id,
                        sourceId:element.sourceId,
                        sourceType:element.sourceType,
                        taskGroupId:element.taskGroupId               
                      });

                    });

                   });

            console.log('From signalR- message received ' + data);
        });

    this.hubConnection.on('WhatsAppNewMessage', (data: WhatsAppNotificationPayload) => {
      if (data && data.phoneNumber) {
        this.ngZone.run(() => {
          this.whatsAppNotifications.push(data);
          this.whatsAppNewMessageSubject.next(data);
        });
      }
    });

    this.hubConnection
      .start()
      .then(() => {
        this.signalRConnectionEnabled = true;
        console.log('signalR Connection  started');
      })
      .catch(err => {
        this.signalRConnectionEnabled = false;
        console.log('signalr Error while starting connection:  ' + err);
      });
  }

  /** Call on logout so the next user does not inherit connection state or the previous token. */
  disconnectOnLogout(): void {
    this.signalRConnectionEnabled = false;
    const conn = this.hubConnection;
    if (conn) {
      conn.stop().catch(() => undefined);
      this.hubConnection = undefined;
    }
    this.signalrNotifications = [];
    this.whatsAppNotifications = [];
  }

  clearWhatsAppNotifications(phoneNumber?: string): void {
    if (phoneNumber) {
      this.whatsAppNotifications = this.whatsAppNotifications.filter(n => n.phoneNumber !== phoneNumber);
    } else {
      this.whatsAppNotifications = [];
    }
  }

  //   public addDataListener = () => {

  //       this.hubConnection.on('transferchartdata', (data) =>
  //       {
  //           console.log(data);
  //       });

  //       this.hubConnection.on('ReceiveMessage', (data) =>
  //       {
  //           console.log('From signalR- message received ' + data);
  //       });

  //       this.hubConnection.on('SmartOfficeGroupMessage', (data: string) => {
  //       });
  // }


  public addDataListener(eventType: string): Observable<any> {
    return new Observable<any>((observer) => {
      // Check if hubConnection exists and is connected
      if (!this.hubConnection) {
        console.error('SignalR hubConnection is not initialized. Make sure startConnection() is called first.');
        observer.error(new Error('SignalR hubConnection is not initialized'));
        return;
      }

      // Always register listener; it starts receiving once the connection becomes connected.
      this.hubConnection.on(eventType, (data: any) => {
        this.ngZone.run(() => observer.next(data));
      });

      // Start only when fully disconnected to avoid:
      // "Cannot start a HubConnection that is not in the 'Disconnected' state."
      if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
        this.startConnection();
      } else if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
        console.warn(`SignalR connection is not connected yet. Current state: ${this.hubConnection.state}. Listener registered and waiting.`);
      }
    });
  }

}


