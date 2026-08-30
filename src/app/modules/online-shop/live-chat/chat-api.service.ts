import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { RestService } from 'src/app/shared/services/rest.service';
import { ChatConversation, ChatHistoryItem } from './models/chat.models';

@Injectable()
export class ChatApiService {
  constructor(private restService: RestService) {}

  getChatHistory(userId: string): Observable<ChatHistoryItem[]> {
    return this.restService
      .getWithoutLoader(`${environment.urls.Chat_GetChatHistory}?userId=${encodeURIComponent(userId)}`)
      .pipe(
        map((response) =>
          (response?.result || []).map((item: any) => ({
            message: item.message || item.Message || '',
            fromAdmin: !!(item.fromAdmin ?? item.FromAdmin),
            timestamp: item.timestamp || item.Timestamp,
          })),
        ),
      );
  }

  uploadImage(file: File): Observable<string> {
    const form = new FormData();
    form.append('File', file);
    return this.restService.postFormData(environment.urls.ChatImage_Upload, form).pipe(
      map((response) => String(response?.result || '')),
    );
  }

  getConversations(): Observable<ChatConversation[]> {
    return this.restService.getWithoutLoader(environment.urls.Chat_GetConversations).pipe(
      map((response) =>
        (response?.result || []).map((item: any) => ({
          id: item.id || item.Id,
          name: item.name || item.Name || 'Customer',
          email: item.email || item.Email,
          connectionId: item.connectionId || item.ConnectionId,
          isOnline: !!(item.isOnline ?? item.IsOnline),
          lastMessage: item.lastMessage || item.LastMessage,
          lastTimestamp: item.lastTimestamp || item.LastTimestamp,
          unreadCount: 0,
        })),
      ),
    );
  }
}
