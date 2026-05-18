import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WhatsAppUserListItem, WhatsAppMessageDto } from '../models/whatsapp.models';

/** Base URL for api/services/app (ABP app services). */
const apiBase = () => (environment.apiBaseUrl || '').replace(/\/$/, '');

/** CustomWhatsAppMessage – GetUsers, GetMessages, MarkMessagesAsRead. */
const customWhatsAppMessage = () => apiBase() + '/CustomWhatsAppMessage';

/** WhatsAppCustom – SendTextMessage, SendImageMessage, SendAudioMessage, HandleWebhook. */
const whatsAppCustom = () => apiBase() + '/WhatsAppCustom';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppCustomAppService {

  constructor(private http: HttpClient) {}

  getUsers(): Observable<{ result: WhatsAppUserListItem[] }> {
    return this.http.get<{ result: WhatsAppUserListItem[] }>(customWhatsAppMessage() + '/GetUsers');
  }

  getMessages(phoneNumber: string): Observable<{ result: WhatsAppMessageDto[] }> {
    return this.http.get<{ result: WhatsAppMessageDto[] }>(
      customWhatsAppMessage() + '/GetMessages?phoneNumber=' + encodeURIComponent(phoneNumber)
    );
  }

  markMessagesAsRead(phoneNumber: string): Observable<unknown> {
    return this.http.post(customWhatsAppMessage() + '/MarkMessagesAsRead', { phoneNumber });
  }

  sendMessage(phoneNumber: string, message: string): Observable<unknown> {
    return this.http.post(whatsAppCustom() + '/SendTextMessage', { to: phoneNumber, message });
  }

  sendImage(phoneNumber: string, mediaUrl: string, caption?: string): Observable<unknown> {
    return this.http.post(whatsAppCustom() + '/SendImageMessage', { to: phoneNumber, mediaUrl, caption });
  }

  sendAudio(phoneNumber: string, mediaUrl: string): Observable<unknown> {
    return this.http.post(whatsAppCustom() + '/SendAudioMessage', { to: phoneNumber, mediaUrl });
  }

  /** Upload file for WhatsApp image/audio. Uses environment WhatsApp_UploadMedia path if set. */
  uploadWhatsAppMedia(file: File): Observable<{ mediaUrl: string; id: string }> {
    const path = (environment.urls as Record<string, string>)?.WhatsApp_UploadMedia ?? 'UploadFile/UploadWhatsAppMedia';
    const url = apiBase() + '/' + path.replace(/^\//, '');
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ mediaUrl: string; id: string }>(url, form);
  }

  /** Test webhook: POST WhatsAppCustom/HandleWebhook. */
  sendWebhookPayload(payload: object): Observable<unknown> {
    return this.http.post(whatsAppCustom() + '/HandleWebhook', payload);
  }
}
