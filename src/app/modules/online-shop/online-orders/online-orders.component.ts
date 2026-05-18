import { AfterViewInit, Component, ComponentFactoryResolver, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PendingOrderListComponent } from './online-order-list-for-pending/pending-order-list/pending-order-list.component';
import { ConfirmedOrderListComponent } from './online-order-list-for-confirmed/confirmed-order-list/confirmed-order-list.component';
import { ShippedOrderListComponent } from './online-order-list-for-shipped/shipped-order-list/shipped-order-list.component';
import { DeliveredOrderListComponent } from './online-order-list-for-delivered/delivered-order-list/delivered-order-list.component';
import { CompletedOrderListComponent } from './online-order-for-completed/completed-order-list/completed-order-list.component';
import { WhatsAppListComponent } from './whatsapp/whatsapp-list/whatsapp-list.component';

@Component({
  selector: 'app-online-orders',
  templateUrl: './online-orders.component.html',
  styleUrls: ['./online-orders.component.css']
})
export class OnlineOrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('OnlineOrderListTargetDiv', { read: ViewContainerRef }) OnlineOrderListTargetDiv: ViewContainerRef;
  private OnlineOrderListComponentRef: ComponentRef<any>;

  @ViewChild('ConfirmedOrderListTargetDiv', { read: ViewContainerRef }) ConfirmedOrderListTargetDiv: ViewContainerRef;
  private ConfirmedOrderListComponentRef: ComponentRef<any>;
  
  @ViewChild('ShippedOrderListTargetDiv', { read: ViewContainerRef }) ShippedOrderListTargetDiv: ViewContainerRef;
  private ShippedOrderListComponentRef: ComponentRef<any>;

  @ViewChild('deliveredOrderListTargetDiv', { read: ViewContainerRef }) deliveredOrderListTargetDiv: ViewContainerRef;
  private deliveredOrderListComponentRef: ComponentRef<any>;

  @ViewChild('CompletedOrderListTargetDiv', { read: ViewContainerRef }) CompletedOrderListTargetDiv: ViewContainerRef;
  private CompletedOrderListComponentRef: ComponentRef<any>;

  @ViewChild('WhatsAppListTargetDiv', { read: ViewContainerRef }) WhatsAppListTargetDiv: ViewContainerRef;
  private WhatsAppListComponentRef: ComponentRef<any>;

  activeIndex = 0;
  private querySub: Subscription;

  constructor(
    private compiler: ComponentFactoryResolver,
    public _customUserStoreService: CustomUserStoreService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.querySub = this.route.queryParams
      .pipe(filter(p => !!(p.openChat || p.phoneNumber)))
      .subscribe(() => {
        this.activeIndex = 5;
        if (this.WhatsAppListTargetDiv) {
          this.changeTab(5);
        }
      });
  }

  ngAfterViewInit(): void {
    const openChat = this.route.snapshot.queryParamMap.get('openChat') || this.route.snapshot.queryParamMap.get('phoneNumber');
    if (openChat) {
      this.activeIndex = 5;
      this.changeTab(5);
    } else {
      this.changeTab(0);
    }
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }
  
  changeTab(index) {
    
    this.activeIndex = index;
    if(index==0){
      this.OnlineOrderListComponentRef?.destroy();
      let componentFactory = this.compiler.resolveComponentFactory(PendingOrderListComponent);
      this.OnlineOrderListComponentRef = this.OnlineOrderListTargetDiv.createComponent(componentFactory);
    }else if(index==1){
      this.ConfirmedOrderListComponentRef?.destroy();
      let componentFactory = this.compiler.resolveComponentFactory(ConfirmedOrderListComponent);
      this.ConfirmedOrderListComponentRef = this.ConfirmedOrderListTargetDiv.createComponent(componentFactory);
    }else if(index==2){
      this.ShippedOrderListComponentRef?.destroy();
      let componentFactory = this.compiler.resolveComponentFactory(ShippedOrderListComponent);
      this.ShippedOrderListComponentRef = this.ShippedOrderListTargetDiv.createComponent(componentFactory);
    }else if(index==3){
      this.deliveredOrderListComponentRef?.destroy();
      let componentFactory = this.compiler.resolveComponentFactory(DeliveredOrderListComponent);
      this.deliveredOrderListComponentRef = this.deliveredOrderListTargetDiv.createComponent(componentFactory);
    }else if(index==4){
      this.CompletedOrderListComponentRef?.destroy();
      let componentFactory = this.compiler.resolveComponentFactory(CompletedOrderListComponent);
      this.CompletedOrderListComponentRef = this.CompletedOrderListTargetDiv.createComponent(componentFactory);
    } else if (index === 5) {
      this.WhatsAppListComponentRef?.destroy();
      let componentFactory = this.compiler.resolveComponentFactory(WhatsAppListComponent);
      this.WhatsAppListComponentRef = this.WhatsAppListTargetDiv.createComponent(componentFactory);
    }
  }
}
