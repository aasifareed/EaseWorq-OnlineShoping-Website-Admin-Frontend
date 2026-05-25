import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { WhatsAppListComponent } from './whatsapp/whatsapp-list/whatsapp-list.component';

@Component({
  selector: 'app-online-orders',
  templateUrl: './online-orders.component.html',
  styleUrls: ['./online-orders.component.css'],
})
export class OnlineOrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('WhatsAppListTargetDiv', { read: ViewContainerRef })
  WhatsAppListTargetDiv: ViewContainerRef;
  private WhatsAppListComponentRef: ComponentRef<any>;

  private querySub: Subscription;

  constructor(
    private compiler: ComponentFactoryResolver,
    public _customUserStoreService: CustomUserStoreService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.querySub = this.route.queryParams
      .pipe(filter((p) => !!(p.openChat || p.phoneNumber)))
      .subscribe(() => {
        if (this.WhatsAppListTargetDiv) {
          this.loadWhatsApp();
        }
      });
  }

  ngAfterViewInit(): void {
    this.loadWhatsApp();
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
    this.WhatsAppListComponentRef?.destroy();
  }

  private loadWhatsApp(): void {
    if (!this.WhatsAppListTargetDiv) {
      return;
    }
    this.WhatsAppListComponentRef?.destroy();
    const componentFactory = this.compiler.resolveComponentFactory(WhatsAppListComponent);
    this.WhatsAppListComponentRef = this.WhatsAppListTargetDiv.createComponent(componentFactory);
  }
}
