import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import * as moment from 'moment';
import { Page } from 'src/app/shared/models/page';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { environment } from 'src/environments/environment';
import { EmailMailboxFormModalComponent } from './email-mailbox-form-modal/email-mailbox-form-modal.component';
import {
  EMAIL_CONVERSATION_STATUSES,
  EMAIL_MAILBOX_TYPES,
  EmailConversationDetail,
  EmailConversationListItem,
  EmailInboxSummary,
  EmailMailboxConfig,
  EmailMessage,
  EmailSupportUser,
} from './models/email-support.models';

@Component({
  selector: 'app-customer-support',
  templateUrl: './customer-support.component.html',
  styleUrls: ['./customer-support.component.css'],
})
export class CustomerSupportComponent implements OnInit {
  ColumnMode = ColumnMode;
  activeTab = 0;
  gridHeight = '100%';
  summary: EmailInboxSummary = {
    mailboxes: [],
    openCount: 0,
    unassignedCount: 0,
    unreadCount: 0,
    resolvedCount: 0,
    unroutedCount: 0,
  };
  conversations: EmailConversationListItem[] = [];
  mailboxConfigurations: EmailMailboxConfig[] = [];
  filteredMailboxes: EmailMailboxConfig[] = [];
  loadingMailboxes = false;
  mailboxSearchControl = new FormControl('');
  selected: EmailConversationDetail | null = null;
  users: EmailSupportUser[] = [];
  statuses = EMAIL_CONVERSATION_STATUSES;
  searchControl = new FormControl();
  page = new Page();
  loadingList = false;
  loadingDetail = false;
  sendingReply = false;
  listError = '';
  detailError = '';
  replyBody = '';
  replyIdempotencyKey = '';
  filter: Record<string, unknown> = {};

  constructor(
    private restService: RestService,
    private http: HttpClient,
    private modalService: NgbModal,
    private injector: Injector,
    private toastr: ToastrService,
    private router: Router,
    public globalDataService: GlobalDataService,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 25;
  }

  ngOnInit(): void {
    this.calculateGridHeight();
    this.replyIdempotencyKey = this.newIdempotencyKey();
    this.loadSummary();
    this.loadMailboxConfigurations();
    this.loadUsers();
    this.loadConversations();
    this.searchControl.valueChanges.pipe(debounceTime(250)).subscribe((value) => {
      this.page.pageNumber = 0;
      this.filter['keyword'] = value;
      this.loadConversations();
    });
    this.mailboxSearchControl.valueChanges.pipe(debounceTime(200)).subscribe(() => {
      this.applyMailboxFilter();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateGridHeight();
  }

  calculateGridHeight(): void {
    const rowHeight = 40;
    const headerFooterHeight = 320;
    const availableHeight = window.innerHeight - headerFooterHeight;
    this.gridHeight = `${Math.max(Math.floor(availableHeight / rowHeight) * rowHeight, 200)}px`;
  }

  loadSummary(): void {
    this.restService.getWithoutLoader(environment.urls.EmailSupport_GetInboxSummary).subscribe({
      next: (response) => {
        this.summary = response?.result || this.summary;
      },
    });
  }

  switchView(view: 'inbox' | 'mailboxes'): void {
    this.changeTab(view === 'mailboxes' ? 1 : 0);
  }

  changeTab(index: number): void {
    this.activeTab = index;
    if (index === 1) {
      this.calculateGridHeight();
      this.loadMailboxConfigurations();
    }
  }

  loadMailboxConfigurations(): void {
    this.loadingMailboxes = true;
    this.restService.getWithoutLoader(environment.urls.EmailSupport_GetMailboxConfigurations).subscribe({
      next: (response) => {
        this.mailboxConfigurations = response?.result || [];
        this.applyMailboxFilter();
        this.loadingMailboxes = false;
      },
      error: () => {
        this.loadingMailboxes = false;
        this.toastr.error('Could not load mailbox configuration.');
      },
    });
  }

  applyMailboxFilter(): void {
    const keyword = String(this.mailboxSearchControl.value || '').trim().toLowerCase();
    if (!keyword) {
      this.filteredMailboxes = [...this.mailboxConfigurations];
      return;
    }

    this.filteredMailboxes = this.mailboxConfigurations.filter((mailbox) =>
      (mailbox.displayName || '').toLowerCase().includes(keyword) ||
      (mailbox.emailAddress || '').toLowerCase().includes(keyword) ||
      (mailbox.domain || '').toLowerCase().includes(keyword) ||
      (mailbox.mailboxType || '').toLowerCase().includes(keyword));
  }

  openMailboxModal(mailbox: EmailMailboxConfig | null = null): void {
    const modalRef = this.modalService.open(EmailMailboxFormModalComponent, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
      injector: this.injector,
      windowClass: 'addSectionModal couponFormModal mailboxFormModal',
    });
    modalRef.componentInstance.mailbox = mailbox;
    modalRef.result.then(() => {
      this.loadMailboxConfigurations();
      this.loadSummary();
    }, () => undefined);
  }

  onMailboxStatusToggle(mailbox: EmailMailboxConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isActive = input.checked;
    this.restService.post(environment.urls.EmailSupport_SetMailboxActive, {
      id: mailbox.id,
      isActive,
    }).subscribe({
      next: () => {
        mailbox.isActive = isActive;
        this.toastr.success(isActive ? 'Mailbox activated.' : 'Mailbox deactivated.');
        this.loadSummary();
      },
      error: (err) => {
        input.checked = !isActive;
        this.toastr.error(err?.error?.error?.message || 'Could not update mailbox status.');
      },
    });
  }

  getMailboxTypeLabel(type: string): string {
    return EMAIL_MAILBOX_TYPES.find((item) => item.id === type)?.name || type;
  }

  assignConversationToMailbox(mailboxId: string): void {
    if (!this.selected || !mailboxId) {
      return;
    }

    this.restService.post(environment.urls.EmailSupport_AssignConversationToMailbox, {
      conversationId: this.selected.id,
      mailboxId,
    }).subscribe({
      next: () => {
        this.toastr.success('Conversation assigned to mailbox.');
        this.openConversation(this.selected);
        this.loadConversations();
        this.loadSummary();
      },
      error: (err) => {
        this.toastr.error(err?.error?.error?.message || 'Could not assign the conversation.');
      },
    });
  }

  activeMailboxesForAssignment(): EmailMailboxConfig[] {
    return this.mailboxConfigurations.filter((x) => x.isActive);
  }

  loadUsers(): void {
    this.restService.getWithoutLoader(environment.urls.EmailSupport_GetAssignableUsers).subscribe({
      next: (response) => {
        this.users = response?.result || [];
      },
    });
  }

  loadConversations(keepSelection = true): void {
    this.loadingList = true;
    this.listError = '';
    this.filter['maxResultCount'] = this.page.size;
    this.filter['skipCount'] = this.page.pageNumber * this.page.size;
    const url = environment.urls.EmailSupport_GetConversations + this.setFilterURL();
    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        this.conversations = response?.result?.items || [];
        this.page.totalElements = response?.result?.totalCount || 0;
        this.loadingList = false;
        if (!keepSelection) {
          this.selected = null;
        }
      },
      error: () => {
        this.loadingList = false;
        this.listError = 'Could not load conversations.';
      },
    });
  }

  openConversation(item: EmailConversationListItem): void {
    this.loadingDetail = true;
    this.detailError = '';
    this.replyBody = '';
    this.replyIdempotencyKey = this.newIdempotencyKey();
    this.restService.getWithoutLoader(`${environment.urls.EmailSupport_GetConversation}?id=${item.id}`).subscribe({
      next: (response) => {
        this.selected = response?.result || null;
        this.loadingDetail = false;
        if (this.selected?.isUnread) {
          this.setReadState(false);
        }
      },
      error: () => {
        this.loadingDetail = false;
        this.detailError = 'Could not load this conversation.';
      },
    });
  }

  applyMailbox(mailboxId: string | null): void {
    this.filter['mailboxId'] = mailboxId || '';
    this.reloadList();
  }

  applyStatus(status: string | null): void {
    const alreadyActive = this.isFilterActive('status', status);
    this.clearStatusGroupFilters();
    if (!alreadyActive && status) {
      this.filter['status'] = status;
    }
    this.reloadList();
  }

  applyUnassigned(): void {
    const alreadyActive = !!this.filter['unassigned'];
    this.clearStatusGroupFilters();
    if (!alreadyActive) {
      this.filter['unassigned'] = true;
    }
    this.reloadList();
  }

  applyUnread(): void {
    const alreadyActive = !!this.filter['unreadOnly'];
    this.clearStatusGroupFilters();
    if (!alreadyActive) {
      this.filter['unreadOnly'] = true;
    }
    this.reloadList();
  }

  applyUnrouted(): void {
    const alreadyActive = !!this.filter['includeUnrouted'];
    this.clearStatusGroupFilters();
    if (!alreadyActive) {
      this.filter['includeUnrouted'] = true;
    }
    this.reloadList();
  }

  clearFilters(): void {
    this.filter = {};
    this.searchControl.setValue('', { emitEvent: false });
    this.reloadList();
  }

  loadMore(): void {
    if ((this.page.pageNumber + 1) * this.page.size >= this.page.totalElements) {
      return;
    }
    this.page.pageNumber += 1;
    this.loadingList = true;
    this.filter['maxResultCount'] = this.page.size;
    this.filter['skipCount'] = this.page.pageNumber * this.page.size;
    const url = environment.urls.EmailSupport_GetConversations + this.setFilterURL();
    this.restService.getWithoutLoader(url).subscribe({
      next: (response) => {
        const items = response?.result?.items || [];
        this.conversations = [...this.conversations, ...items];
        this.page.totalElements = response?.result?.totalCount || this.page.totalElements;
        this.loadingList = false;
      },
      error: () => {
        this.loadingList = false;
      },
    });
  }

  sendReply(): void {
    if (!this.selected || this.isReplyEmpty()) {
      this.toastr.warning('Enter a reply before sending.');
      return;
    }

    this.sendingReply = true;
    this.restService.post(environment.urls.EmailSupport_Reply, {
      conversationId: this.selected.id,
      body: this.replyBody.trim(),
      idempotencyKey: this.replyIdempotencyKey,
    }).subscribe({
      next: () => {
        this.sendingReply = false;
        this.replyBody = '';
        this.replyIdempotencyKey = this.newIdempotencyKey();
        this.toastr.success('Reply sent.');
        this.openConversation(this.selected);
        this.loadConversations();
        this.loadSummary();
      },
      error: (err) => {
        this.sendingReply = false;
        this.toastr.error(err?.error?.error?.message || 'Could not send the reply.');
      },
    });
  }

  setReadState(isUnread: boolean): void {
    if (!this.selected) {
      return;
    }
    this.restService.post(environment.urls.EmailSupport_SetReadState, {
      conversationId: this.selected.id,
      isUnread,
    }).subscribe({
      next: () => {
        this.selected.isUnread = isUnread;
        this.loadConversations();
        this.loadSummary();
      },
    });
  }

  changeStatus(status: string): void {
    if (!this.selected) {
      return;
    }
    this.restService.post(environment.urls.EmailSupport_ChangeStatus, {
      conversationId: this.selected.id,
      status,
    }).subscribe({
      next: () => {
        this.selected.status = status;
        this.toastr.success(status === 'Resolved' ? 'Conversation resolved.' : 'Status updated.');
        this.loadConversations();
        this.loadSummary();
      },
      error: (err) => {
        this.toastr.error(err?.error?.error?.message || 'Could not update status.');
      },
    });
  }

  assignUser(userId: string): void {
    if (!this.selected) {
      return;
    }
    const assignedUserId = userId ? Number(userId) : null;
    this.restService.post(environment.urls.EmailSupport_Assign, {
      conversationId: this.selected.id,
      assignedUserId,
    }).subscribe({
      next: () => {
        this.selected.assignedUserId = assignedUserId;
        const user = this.users.find((x) => x.id === assignedUserId);
        this.selected.assignedUserName = user?.name || null;
        this.toastr.success(assignedUserId ? 'Conversation assigned.' : 'Conversation unassigned.');
        this.loadConversations();
      },
      error: (err) => {
        this.toastr.error(err?.error?.error?.message || 'Could not assign the conversation.');
      },
    });
  }

  downloadAttachment(attachmentId: string, fileName: string): void {
    const url = `${environment.apiBaseUrl}${environment.urls.EmailSupport_DownloadAttachment}?attachmentId=${attachmentId}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName || 'attachment';
        link.click();
        window.URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.toastr.error('Could not download the attachment.');
      },
    });
  }

  openCustomerOrders(): void {
    if (!this.selected?.customerEmail) {
      return;
    }
    this.router.navigate(['/online-shop/online-orders'], {
      queryParams: { keyword: this.selected.customerEmail },
    });
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }
    return moment.utc(value).local().format('DD MMM YYYY, h:mm A');
  }

  displayName(item: EmailConversationListItem | EmailMessage): string {
    const name = (item as EmailConversationListItem).customerName || (item as EmailMessage).fromName;
    const email = (item as EmailConversationListItem).customerEmail || (item as EmailMessage).fromAddress;
    return name ? `${name}` : email || 'Unknown sender';
  }

  isInbound(message: EmailMessage): boolean {
    return message.direction === 'Inbound';
  }

  isReplyEmpty(): boolean {
    if (!this.replyBody) {
      return true;
    }

    const text = this.replyBody
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return !text;
  }

  getMessageHtml(message: EmailMessage): string | null {
    return message.safeHtmlBody || null;
  }

  hasMore(): boolean {
    return (this.page.pageNumber + 1) * this.page.size < this.page.totalElements;
  }

  isFilterActive(key: string, value: unknown): boolean {
    return this.filter[key] === value;
  }

  private clearStatusGroupFilters(): void {
    delete this.filter['status'];
    delete this.filter['unreadOnly'];
    delete this.filter['unassigned'];
    delete this.filter['includeUnrouted'];
  }

  private reloadList(): void {
    this.page.pageNumber = 0;
    this.loadConversations(false);
  }

  private setFilterURL(): string {
    let path = '';
    Object.keys(this.filter).forEach((key) => {
      const value = this.filter[key];
      if (value !== null && value !== undefined && value !== '') {
        path = path ? `${path}&` : '?';
        path += `${key}=${encodeURIComponent(String(value))}`;
      }
    });
    return path;
  }

  private newIdempotencyKey(): string {
    return 'reply-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
}
