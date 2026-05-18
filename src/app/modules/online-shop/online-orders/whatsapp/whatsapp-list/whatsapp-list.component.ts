import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WhatsAppCustomAppService } from '../services/whatsapp-custom-app.service';
import { SignalRService } from 'src/app/shared/services/signal-r.service';
import { WhatsAppUserListItem } from '../models/whatsapp.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-whatsapp-list',
  templateUrl: './whatsapp-list.component.html',
  styleUrls: ['./whatsapp-list.component.scss']
})
export class WhatsAppListComponent implements OnInit, OnDestroy {
  @ViewChild('webhookTestModal') webhookTestModalRef: TemplateRef<any>;

  users: WhatsAppUserListItem[] = [];
  selectedPhoneNumber: string | null = null;
  openFromNotificationPhone: string | null = null;
  loading = false;
  showChatOnMobile = false;
  webhookTestPhoneNumber = '';
  webhookTestMessage = '';
  webhookSending = false;
  webhookError = '';
  webhookSuccess = '';
  private subs = new Subscription();

  constructor(
    private whatsAppCustomAppService: WhatsAppCustomAppService,
    private signalRService: SignalRService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.checkQueryParams();
    this.subs.add(
      this.signalRService.whatsAppNewMessage$.subscribe((payload) => {
        if (payload?.phoneNumber) {
          this.refreshUsers();
          if (this.selectedPhoneNumber === payload.phoneNumber) {
            this.whatsAppCustomAppService.getMessages(payload.phoneNumber).subscribe((res) => {
              this.refreshUsers();
            });
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      const openPhone = params['openChat'] || params['phoneNumber'];
      if (openPhone) {
        this.openFromNotificationPhone = openPhone;
        this.selectedPhoneNumber = openPhone;
        this.showChatOnMobile = true;
        this.signalRService.clearWhatsAppNotifications(openPhone);
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.whatsAppCustomAppService.getUsers().subscribe({
      next: (res) => {
        this.users = this.normalizeUsersResponse(res);
        if (this.openFromNotificationPhone && !this.selectedPhoneNumber) {
          this.selectedPhoneNumber = this.openFromNotificationPhone;
          this.showChatOnMobile = true;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  refreshUsers(): void {
    this.whatsAppCustomAppService.getUsers().subscribe({
      next: (res) => {
        this.users = this.normalizeUsersResponse(res);
      }
    });
  }

  /** Ensure we always get an array (API or interceptor may wrap result). */
  private normalizeUsersResponse(res: any): WhatsAppUserListItem[] {
    const raw = res?.result;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.result)) return raw.result;
    return [];
  }

  selectUser(user: WhatsAppUserListItem): void {
    this.selectedPhoneNumber = user.phoneNumber;
    this.showChatOnMobile = true;
    this.signalRService.clearWhatsAppNotifications(user.phoneNumber);
  }

  closeChat(): void {
    this.showChatOnMobile = false;
    this.selectedPhoneNumber = null;
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString();
  }

  public openWebhookTestModal(): void {
    this.webhookError = '';
    this.webhookSuccess = '';
    this.webhookTestPhoneNumber = this.selectedPhoneNumber || '';
    this.webhookTestMessage = '';
    this.modalService.open(this.webhookTestModalRef, { size: 'lg', scrollable: true });
  }

  /** Build full webhook payload from user phone + message; IDs and timestamp set by system. */
  private buildWebhookPayload(phoneNumber: string, message: string): object {
    const phone = phoneNumber.trim();
    const messageId = 'TEST_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const entryId = 'entry_' + Date.now();
    const phoneNumberId = '123456123';
    const displayPhoneNumber = '16505551111';
    return {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: entryId,
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: displayPhoneNumber,
                  phone_number_id: phoneNumberId
                },
                contacts: [
                  {
                    profile: { name: 'Test User' },
                    wa_id: phone
                  }
                ],
                messages: [
                  {
                    from: phone,
                    id: messageId,
                    timestamp,
                    type: 'text',
                    text: { body: message }
                  }
                ]
              }
            }
          ]
        }
      ]
    };
  }

  public sendWebhookPayload(modal: any): void {
    this.webhookError = '';
    this.webhookSuccess = '';
    const phone = (this.webhookTestPhoneNumber || '').trim();
    const message = (this.webhookTestMessage || '').trim();
    if (!phone || !message) {
      this.webhookError = 'Phone number and message are required.';
      return;
    }
    const payload = this.buildWebhookPayload(phone, message);
    this.webhookSending = true;
    this.whatsAppCustomAppService.sendWebhookPayload(payload).subscribe({
      next: () => {
        this.webhookSending = false;
        this.refreshUsers();
        modal.close();
      },
      error: (err) => {
        this.webhookSending = false;
        this.webhookError = err?.error?.message || err?.message || 'Request failed. Check console and CORS/URL.';
      }
    });
  }
}
