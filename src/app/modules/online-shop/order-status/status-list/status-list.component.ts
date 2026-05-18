import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColumnMode, SelectionType } from "@swimlane/ngx-datatable";
import { debounceTime } from "rxjs/operators";
import { Page } from "src/app/shared/models/page";
import { CustomUserStoreService } from "src/app/shared/services/custom-user-store.service";
import { GlobalDataService } from "src/app/shared/services/globalData.service";
import { RestService } from "src/app/shared/services/rest.service";
import { UserService } from "src/app/shared/services/user.service";

import * as moment from "moment";
import { AddUpdateStatusComponent } from "../add-update-status/add-update-status.component";
import { environment } from "src/environments/environment";
import { StatusDto } from "../models/statusDto";

@Component({
  selector: "app-status-list",
  templateUrl: "./status-list.component.html",
  styleUrls: ["./status-list.component.css"],
})
export class StatusListComponent implements OnInit {
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

  @ViewChild("detailsModal") popupTemplate;

  gridDataLoaded = false;

  page = new Page();

  constructor(
    private restService: RestService,
    private modalService: NgbModal,
    private userService: UserService,
    public _customUserStoreService: CustomUserStoreService,
    public globalDataService: GlobalDataService,
    private el: ElementRef,
    private renderer: Renderer2,
  ) {
    this.page.pageNumber = 0;
    //this.page.size = 11;
  }

  ngOnInit() {
    this.calculatePageSize();

    this.searchControl.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value) => {
        this.filerData(value);
      });
  }

  filerData(val) {
    this.page.pageNumber = 0;
    this.filter["keyword"] = val;
    this.getData();
  }

  resetSearch() {
    this.searchControl.setValue(null);

    if (this.filter.FromDate && this.filter.ToDate) {
      this.filter.ToDateUTC = null;
      this.filter.FromDateUTC = null;
    }

    this.filter.ToDate = null;
    this.filter.FromDate = null;
    this.getData();
  }

  search() {
    this.getData();
  }

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.offset;
    this.getData();
  }

  setFilterURL() {
    let path = "";
    Object.keys(this.filter).forEach((key) => {
      if (this.filter[key]) {
        path = path ? path + "&" : "?";
        if (Array.isArray(this.filter[key])) {
          //path = path + key + "=" + this.filter[key].toLocaleString();

          this.filter[key].forEach((value) => {
            path += key + "=" + encodeURIComponent(value) + "&";
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

  getData() {
    this.loadingIndicator = true;
    this.filter["maxResultCount"] = this.page.size;
    this.filter["skipCount"] = this.page.pageNumber * this.page.size;

    if (this.filter.FromDate && this.filter.ToDate) {
      // Store formatted values separately for API submission
      this.filter.FromDateUTC = moment(this.filter.FromDate)
        .startOf("day")
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss");
      this.filter.ToDateUTC = moment(this.filter.ToDate)
        .endOf("day")
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss");
    }

    var url = this.setFilterURL();

    this.restService.get(`${environment.urls.GetAllStatuses + url}`).subscribe(
      async (response) => {
        this.loadingIndicator = false;

        if (response && response.result && response.result.items) {
          let data = response.result.items;

          // let data = response.result.items.sort(
          //   (a, b) => (a.creationTime < b.creationTime && 1) || -1
          // );

          this.filteredData = [];

          this.data = [...data];
          this.filteredData = [...this.data];

          this.page.totalElements = response.result.totalCount;
          this.page.totalPages = response.result.totalCount / this.page.size;

          // const delay = ms => new Promise(res => setTimeout(res, ms));
          // await delay(50);
          // this.gridDataLoaded=true;
        }
      },
      (err) => {
        this.loadingIndicator = false;
        console.log(err);
      },
    );
  }

  onSort(event) {
    this.page.pageNumber = 0;
    this.filter["sorting"] = event.sorts[0].prop + " " + event.sorts[0].dir;
    this.getData();
  }

  dto = {} as StatusDto;
  selected = [];
  SelectionType = SelectionType;
  onSelect(event) {
    this.selected = [];

    // this.dto.id = selected[0].id;
    // this.dto.name = selected[0].name;
    // this.dto.pictureUrl=selected[0].pictureUrl;
    // this.rowSelectedEvent.emit(this.dto);
  }

  onDblClickRow(event) {
    if (event.type === "dblclick" && event.row) {
      // if (
      //   this.globalDataService.isPermitted(
      //     this.globalDataService.permissions.Section_Update,
      //   )
      // ) {
      //   this.editRow(event.row);
      // }
      this.editRow(event.row);
    }
  }

  editRow(row: any) {
    this.dto.id = row.id;
    this.dto.statusName = row.statusName;
    this.dto.colorCode = row.colorCode;
    this.dto.displayName = row.displayName;
    this.dto.statusCode = row.statusCode;
    this.dto.orderNumber = row.orderNumber;
    this.dto.isSystem = row.isSystem;
    this.dto.createdDate = row.createdDate;
    this.dto.childStatusIds = row.childStatusIds;

    const modalRef = this.modalService.open(AddUpdateStatusComponent, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
      windowClass: "UpdateStatusModal",
    });

    modalRef.componentInstance.setViewScreen(this.dto);

    modalRef.componentInstance.sectionUpdatedEvent.subscribe(() => {
      this.getData();
    });
  }

  addUpdateExpenseDynamically(dto: StatusDto) {
    this.getData();
  }

  AddNew() {
    const modalRef = this.modalService.open(AddUpdateStatusComponent, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
      windowClass: "addSectionModal",
    });

    modalRef.componentInstance.setAddScreen();

    modalRef.componentInstance.sectionCreatedEvent.subscribe(() => {
      this.getData();
    });
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    // Recalculate page size on window resize
    this.calculatePageSize();
    //this.getData();
  }

  calculatePageSize(): void {
    const rowHeight = 45;
    const headerFooterHeight = 70;
    let availableHeight = window.innerHeight - headerFooterHeight;

    const mainHeaderElement = this.renderer.selectRootElement(
      ".main-header",
      true,
    );
    const mainHeaderElementHeight = mainHeaderElement
      ? mainHeaderElement.offsetHeight
      : 0;
    availableHeight -= mainHeaderElementHeight;

    const tabElement = this.renderer.selectRootElement(".tabs__links", true);
    const tabElementHeight = tabElement ? tabElement.offsetHeight : 0;
    availableHeight -= tabElementHeight;

    // Get the height of the gridAboveHeight elements
    const gridAboveHeightElement =
      this.el.nativeElement.querySelector(".gridAboveHeight");
    const gridAboveHeightElementHeight = gridAboveHeightElement
      ? gridAboveHeightElement.offsetHeight
      : 0;
    availableHeight -= gridAboveHeightElementHeight;

    // Calculate the number of rows that can be displayed
    this.page.size = Math.floor(availableHeight / rowHeight);
    if (this.page.size <= 0) {
      this.page.size = 10;
    }
    this.getData();
  }

  getTextColor(bgColor: string | null | undefined): string {
    if (!bgColor) {
      // Default to black if bgColor is null or undefined
      return "black";
    }

    // Extract RGB components from hex color
    const color = bgColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Calculate brightness and decide text color
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "black" : "white";
  }
}
