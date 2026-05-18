import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { Subscription } from 'rxjs';
import { WhatsAppCustomAppService } from '../services/whatsapp-custom-app.service';
import { SignalRService } from 'src/app/shared/services/signal-r.service';
import { WhatsAppMessageDto } from '../models/whatsapp.models';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-whatsapp-chatbox',
  templateUrl: './whatsapp-chatbox.component.html',
  styleUrls: ['./whatsapp-chatbox.component.scss']
})
export class WhatsAppChatboxComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() phoneNumber: string | null = null;
  @Input() openFromNotification = false;
  @Output() closed = new EventEmitter<void>();
  @Output() messagesMarkedAsRead = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') private messageInput: ElementRef<HTMLTextAreaElement>;

  messages: WhatsAppMessageDto[] = [];
  newMessageText = '';
  loading = false;
  sending = false;
  uploading = false;
  private shouldScrollToBottom = false;
  private signalRSub: Subscription;

  constructor(
    private whatsAppCustomAppService: WhatsAppCustomAppService,
    private signalRService: SignalRService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.signalRSub = this.signalRService.whatsAppNewMessage$.subscribe((payload) => {
      if (payload?.phoneNumber && payload.phoneNumber === this.phoneNumber) {
        this.loadMessages();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phoneNumber'] && this.phoneNumber) {
      this.loadMessages();
      this.markAsRead();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer?.nativeElement) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.signalRSub?.unsubscribe();
  }

  loadMessages(): void {
    if (!this.phoneNumber) {
      this.messages = [];
      return;
    }
    this.loading = true;
    this.whatsAppCustomAppService.getMessages(this.phoneNumber).subscribe({
      next: (res: any) => {
        // API may return array directly or { result: [...] }
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.result)
            ? res.result
            : [];
        this.messages = this.normalizeMessages(list);
        this.shouldScrollToBottom = true;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error(this.translate.instant('Failed to load messages'));
      }
    });
  }

  markAsRead(): void {
    if (!this.phoneNumber) return;
    this.whatsAppCustomAppService.markMessagesAsRead(this.phoneNumber).subscribe({
      next: () => this.messagesMarkedAsRead.emit(),
      error: () => {}
    });
  }

  sendMessage(): void {
    const text = (this.newMessageText || '').trim();
    if (!text || !this.phoneNumber || this.sending) return;

    this.sending = true;
    this.whatsAppCustomAppService.sendMessage(this.phoneNumber, text).subscribe({
      next: () => {
        this.newMessageText = '';
        this.loadMessages();
        this.sending = false;
      },
      error: (err) => {
        this.sending = false;
        const msg = err?.error?.error?.message || this.translate.instant('Failed to send message');
        this.toastr.error(msg);
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !this.phoneNumber || this.uploading || this.sending) return;

    const type = (file.type || '').toLowerCase();
    const isImage = type.startsWith('image/');
    const isAudio = type.startsWith('audio/') || /\.(ogg|mp3|m4a|wav)$/i.test(file.name);
    if (!isImage && !isAudio) {
      this.toastr.warning(this.translate.instant('Please choose an image or audio file.'));
      input.value = '';
      return;
    }

    this.uploading = true;
    this.whatsAppCustomAppService.uploadWhatsAppMedia(file).subscribe({
      next: (res) => {
        const mediaUrl = res?.mediaUrl;
        if (!mediaUrl) {
          this.uploading = false;
          this.toastr.error(this.translate.instant('Upload did not return a URL.'));
          input.value = '';
          return;
        }
        const caption = this.newMessageText?.trim() || undefined;
        const req = isImage
          ? this.whatsAppCustomAppService.sendImage(this.phoneNumber!, mediaUrl, caption)
          : this.whatsAppCustomAppService.sendAudio(this.phoneNumber!, mediaUrl);
        req.subscribe({
          next: () => {
            this.newMessageText = '';
            this.loadMessages();
            this.uploading = false;
            this.sending = false;
            input.value = '';
          },
          error: (err) => {
            this.uploading = false;
            const msg = err?.error?.error?.message || this.translate.instant('Failed to send.');
            this.toastr.error(msg);
            input.value = '';
          }
        });
      },
      error: (err) => {
        this.uploading = false;
        const msg = err?.error?.error?.message || this.translate.instant('Upload failed.');
        this.toastr.error(msg);
        input.value = '';
      }
    });
  }

  close(): void {
    this.closed.emit();
  }

  /** Normalize API response: ensure direction (inbound/outbound) and support both PascalCase and camelCase from API. */
  private normalizeMessages(list: any[]): WhatsAppMessageDto[] {
    return (list || []).map((m: any) => {
      const fromApi = (m.direction ?? m.Direction ?? '').toString().toLowerCase();
      const receivedAt = m.receivedAtUtc ?? m.ReceivedAtUtc;
      const sentAt = m.sentAtUtc ?? m.SentAtUtc;
      // Infer direction from timestamps when Direction is missing (API may use PascalCase)
      const inferred = receivedAt ? 'inbound' : (sentAt ? 'outbound' : '');
      const direction = fromApi === 'inbound' || fromApi === 'outbound' ? fromApi : (inferred || 'outbound');
      return {
        ...m,
        direction,
        receivedAtUtc: receivedAt ?? null,
        sentAtUtc: sentAt ?? null,
        messageText: m.messageText ?? m.MessageText ?? '',
        messageType: m.messageType ?? m.MessageType,
        mediaUrl: m.mediaUrl ?? m.MediaUrl ?? null
      } as WhatsAppMessageDto;
    });
  }

  isInbound(msg: WhatsAppMessageDto): boolean {
    return (msg.direction || '').toLowerCase() === 'inbound';
  }

  messageTime(msg: WhatsAppMessageDto): string {
    const d = msg.receivedAtUtc || msg.sentAtUtc;
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
