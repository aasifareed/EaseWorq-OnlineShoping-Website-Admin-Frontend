import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { OrderDeliveryStatusEnum } from 'src/app/shared/enum/OrderDeliveryStatusEnum.enum';
import { Page } from 'src/app/shared/models/page';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CustomUserStoreService } from 'src/app/shared/services/custom-user-store.service';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { RestService } from 'src/app/shared/services/rest.service';
import { SignalRService } from 'src/app/shared/services/signal-r.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2/dist/sweetalert2.js';


@Component({
  selector: 'app-completed-order-list',
  templateUrl: './completed-order-list.component.html',
  styleUrls: ['./completed-order-list.component.scss']
})
export class CompletedOrderListComponent implements OnInit,OnDestroy {

  ColumnMode = ColumnMode;
  data;
  filteredData;
  searchControl: FormControl = new FormControl();
  selectedRequests = [];
  currentUser: any;
  users: any[] = [];
  gridHeight = "100%";
  loadingIndicator: boolean = true;
  filter: any = {};

  totalAmountSum = 0;
  paidAmountSum = 0;
  remaningAmountSum = 0;

  selectedStoreSubscription: Subscription;

  constructor(
    private restService: RestService,
    public _customUserStoreService:CustomUserStoreService,
    public globalDataService:GlobalDataService,
    private el: ElementRef, private renderer: Renderer2,
    private toastr: ToastrService,
    public translate: TranslateService,
    public signalRService: SignalRService,
    private authService: AuthService,
  ) { 
    this.page.pageNumber = 0;
    //this.page.size = 10;
  }

  ngOnDestroy(): void {
    this.selectedStoreSubscription.unsubscribe();
  }
  
  ngOnInit() {

    this.getOrderDeliveryStatusList();

    this.selectedStoreSubscription = this._customUserStoreService.selectedStore$.subscribe(value => {        
      if(value == null || value.length == 0){
        this.calculatePageSize(this._customUserStoreService.getDefaultStoreId()); 
      }
      else{
        this.calculatePageSize(value);        
      }
    });

    
    // if (this.authService.getEncryptedToken())
    // {
    //   this.signalRService.startConnection();
    // }

    //this.getData()
    this.searchControl.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value) => {
        this.filerData(value);
      });
  }

  filerData(val) {
    this.page.pageNumber = 0;
    this.filter["keyword"] = val;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  resetSearch(){
    this.searchControl.setValue(null);

    if (this.filter.FromDate && this.filter.ToDate) {
      this.filter.ToDateUTC=null;
      this.filter.FromDateUTC=null;
    }

    this.filter.ToDate=null;
    this.filter.FromDate=null;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  search() {
    this.getData(this._customUserStoreService.selectedUserStore);
  }
  page = new Page();

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.offset;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  setFilterURL() {
    let path = "";
    Object.keys(this.filter).forEach((key) => {
      if (this.filter[key]) {
        path = path ? path + "&" : "?";
        if (Array.isArray(this.filter[key])) {
          //path = path + key + "=" + this.filter[key].toLocaleString();

        this.filter[key].forEach(value => {
          path += key + '=' + encodeURIComponent(value) + '&';
      });
      // Remove the extra '&' at the end
      path = path.slice(0, -1);  
        } else {
          path = path + key + "=" + this.filter[key];
        }
      }
    });
    return path;
  }

  getData(storeId: any) {
    
    this.filter["maxResultCount"] = this.page.size;
    this.filter["skipCount"] = this.page.pageNumber * this.page.size;
    this.filter["storeIds"] = storeId;
    this.filter["orderDeliveryStatus"] = OrderDeliveryStatusEnum.Completed;

    if (this.filter.FromDate && this.filter.ToDate) {
      // Store formatted values separately for API submission
      this.filter.FromDateUTC =moment(this.filter.FromDate).startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.filter.ToDateUTC = moment(this.filter.ToDate).endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss');
    }

    var url = this.setFilterURL();

    this.restService.get(`${environment.urls.Get_Online_Sale_Orders + url}`).subscribe(
      async (response) => {

        this.totalAmountSum = 0;
        this.paidAmountSum = 0;
        this.remaningAmountSum = 0;
        
        if (response && response.result && response.result.items) {
              
          let data = response.result.items;
          data.forEach(element => {
            element.expanded=false;
            element.orderDeliveryStatus = "";
          });

          this.filteredData=[];

          this.data = [...data];
          this.filteredData = [...this.data];

          this.totalAmountSum = data[0]?.totalAmountSum;
          this.paidAmountSum = data[0]?.totalPaidAmountSum;
          this.remaningAmountSum = data[0]?.remainingAmountSum;

          this.page.totalElements = response.result.totalCount;
          this.page.totalPages = response.result.totalCount / this.page.size;
          this.loadingIndicator = false;
          
          //this.notification();
        }
      },
      (err) => {
        this.loadingIndicator = false;
        console.log(err);
      }
    );
  }  

  onSort(event) {
    this.page.pageNumber = 0;
    this.filter["sorting"] = event.sorts[0].prop + " " + event.sorts[0].dir;
    this.getData(this._customUserStoreService.selectedUserStore);
  }

  public orderDetail=[];
  orderDetailToggle(row) {
    
    if (row.value.orderId) {
      this.orderDetail=row.value.onlineOrderProduct;
    }
  }

  @ViewChild('orderDetailTable') table: any;
  toggleExpandRow(row) {
    

    this.filteredData.filter(x=>x.orderId!=row.orderId).forEach(element => {
      element.expanded=false;
    });

    if(row.expanded==false)
    {
      row.expanded=true;
      this.table.rowDetail.collapseAllRows();
      this.table.rowDetail.toggleExpandRow(row);
    }else{
      row.expanded=false;
      this.table.rowDetail.collapseAllRows();
    }

  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // Recalculate page size on window resize
    this.calculatePageSize(this._customUserStoreService.selectedUserStore);
    //this.getData();
  }
  
  calculatePageSize(storeId: any): void {
    
    const rowHeight = 40;
    const headerFooterHeight = 135;
    let availableHeight = window.innerHeight - headerFooterHeight;
  
    
  
    const mainHeaderElement = this.renderer.selectRootElement('.main-header', true);
    const mainHeaderElementHeight = mainHeaderElement ? mainHeaderElement.offsetHeight : 0;
    availableHeight -= mainHeaderElementHeight;
    
    const tabElement = this.renderer.selectRootElement('.tabs__links', true);
    const tabElementHeight = tabElement ? tabElement.offsetHeight : 0;
    availableHeight -= tabElementHeight;
  
    // Get the height of the gridAboveHeight elements
    const gridAboveHeightElement = this.el.nativeElement.querySelector('.gridAboveHeightInSaleOrderHistory');
    const gridAboveHeightElementHeight = gridAboveHeightElement ? gridAboveHeightElement.offsetHeight : 0;
    availableHeight -= gridAboveHeightElementHeight;
  
  
    // Calculate the number of rows that can be displayed
    this.page.size = Math.floor(availableHeight / rowHeight);
    if(this.page.size <=0){
      this.page.size=10;
    }
    this.getData(storeId);
  }


  orderDeliveryStatusList=[];
  getOrderDeliveryStatusList() {
    this.restService.get(`${environment.urls.Get_Order_DeliveryStatus_For_Dropdown}`).subscribe(
       (response) => {             
      this.orderDeliveryStatusList=[...response.result];
      },
      (err) => {
        console.log(err);
      }
    );
  }

  async orderDeliveryStatusUpdateInRowDetails(event, rowIndex){
    

    var index = this.data.findIndex(x => x.orderId == rowIndex.orderId);

    if (event.target.value) {
      var orderDeliveryStatus = event.target.value;
      var orderId = rowIndex.orderId;
      this.data[index].orderDeliveryStatus = orderDeliveryStatus;
      const result = await openSweetAlertForChangeOrderDeliveryStatus();
      if(result){
        this.changeOrderDeliveryStatus(orderDeliveryStatus, orderId);
      }
    } else {
      this.data[index].orderDeliveryStatus = "";
    }

  }

  changeOrderDeliveryStatus(orderDeliveryStatus:any,orderId:any){
    

      this.restService.get(`${environment.urls.Change_Delivery_Order_Status}?orderId=${orderId}&orderDeliveryStatus=${orderDeliveryStatus}`).subscribe(
            (response) => {  
              if(response.result){
                this.toastr.success(this.translate.instant('Change order delivery status is Completed.'), this.translate.instant("toaster_Heading_Success"), { progressBar: true });
                this.getData(this._customUserStoreService.selectedUserStore);
              }
              else{
                this.toastr.error(this.translate.instant('Invalid Request.'), this.translate.instant("toaster_Heading_Error"), { progressBar: true });
              }
        },
        (err) => {
          console.log(err);
        }
      );

  }

}

export function openSweetAlertForChangeOrderDeliveryStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    Swal.fire({
      title: 'Are you sure want to Change Status?',
      text: 'Do you want to change order delivery status.!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        resolve(true);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        resolve(false);
      }
    });
  });
}
