import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { NavigationService } from "../../../../services/navigation.service";
import { SearchService } from "../../../../services/search.service";
import { AuthService } from "../../../../services/auth.service";
import { TranslateService } from "@ngx-translate/core";
import { CustomizerService } from "src/app/shared/services/customizer.service";
import { UserService } from "src/app/shared/services/user.service";
import { Router } from "@angular/router";
import { SignalRService } from "src/app/shared/services/signal-r.service";
import { environment } from "src/environments/environment";
import { RestService } from "src/app/shared/services/rest.service";
import { NotificationsDto } from "src/app/shared/models/NotificationDto";
import { Location } from "@angular/common";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { NotificationSourceTypeEnum } from "src/app/shared/enum/notificationSourceType";
import * as moment from "moment";
import { LocalStoreService } from "src/app/shared/services/local-store.service";
import { IOption } from "ng-select";
import { CustomUserStoreService } from "src/app/shared/services/custom-user-store.service";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { GlobalDataService } from "src/app/shared/services/globalData.service";
import Swal from "sweetalert2/dist/sweetalert2.js";

@Component({
  selector: "app-header-sidebar-large",
  templateUrl: "./header-sidebar-large.component.html",
  styleUrls: ["./header-sidebar-large.component.scss"],
})
export class HeaderSidebarLargeComponent implements OnInit, OnDestroy {
  @ViewChild("detailsModal") popupTemplate;
  @ViewChild("GroupTaskdetailsModal") GroupTaskdetailsTemplate;
  isRTL: boolean;
  notifications: any[];
  fullName;

  userRole;
  showMegaMenu = false;
  arSelected = false;
  enSelected = false;
  linkEnabled = false;
  href;

  public languageName;
  selectedStoreSubscription: Subscription;

  constructor(
    private navService: NavigationService,
    public searchService: SearchService,
    private auth: AuthService,
    public customizer: CustomizerService,
    public translateService: TranslateService,
    public userService: UserService,
    private router: Router,
    public signalRService: SignalRService,
    private restService: RestService,
    private location: Location,
    private modalService: NgbModal,
    private store: LocalStoreService,
    public _customUserStoreService: CustomUserStoreService,
    private authService: AuthService,
    private toastr: ToastrService,
    public globalDataService: GlobalDataService,
    private renderer: Renderer2
  ) {}

  // changeLanguage(lang: string) {
  //   this.translateService.setDefaultLang(lang);
  //   this.translateService.use(lang);
  // }

  ngOnDestroy(): void {
    this.selectedStoreSubscription.unsubscribe();
  }

  ngOnInit() {
    this.selectedStoreSubscription =
      this._customUserStoreService.selectedStore$.subscribe((value) => {
        if (value && value.length == 0) {
          //this.toastr.warning("Default store can not be removed","Warning");
          this.toastr.warning(
            this.translateService.instant(
              "top_Header_Default_store_can_not_be_removed_Message"
            ),
            this.translateService.instant("toaster_Heading_Warning"),
            { progressBar: true }
          );
          this._customUserStoreService.selectedStore =
            this._customUserStoreService.getDefaultStoreId();
        }
      });

    this.getLanguagesList();
    
    var defaultLanguage = this.store.getItem("defaultLanguage");
    this.source = defaultLanguage;
    this.previousLanguageName = defaultLanguage;

    let currentUser = this.authService.getcurrentUser();
    if (currentUser) {
      this.fullName = currentUser.fullName;
      this.userRole = currentUser.roleNames && currentUser.roleNames.length > 0 ? currentUser.roleNames[0] : null;
      if (this.userRole === "ADMIN") this.linkEnabled = true;
      else this.linkEnabled = false;
    } else {
      // Handle case when local storage is cleared (e.g., during tenant setup)
      this.fullName = '';
      this.userRole = null;
      this.linkEnabled = false;
    }

    // this.userService.getUser().subscribe(data => {
    // let user = data.result;
    // this.fullName = user.name + ' ' + user.surname;
    // this.userRole = user.roleNames[0];
    //     if (this.userRole === 'ADMIN')
    //         this.linkEnabled = true;
    //     else
    //         this.linkEnabled = false;
    // });

    //this.signalRService.startConnection();
    this.signalRService
      .addDataListener("OnlineOrders")
      .subscribe((mockElement) => {
        // const mockElement = {
        //   title: 'New User Added',
        //   statusText: 'Active',
        //   description: 'A new user has been added to the system.',
        //   creationTime: new Date(),
        //   link: '/users/123',
        //   isRead: false,
        //   id: 1,
        //   sourceId: 101,
        //   sourceType: 'User',
        //   taskGroupId: 5
        // };

        this.signalRService.signalrNotifications.unshift({
          icon: "fontAwesome_Li_Class fa fa-3x fa-shopping-basket",
          title: mockElement.title,
          badge: mockElement.statusText,
          text: mockElement.description,
          time: mockElement.creationTime,
          status: mockElement.statusText,
          link: mockElement.link,
          isRead: mockElement.isRead,
          id: mockElement.id,
          sourceId: "101",
          sourceType: mockElement.sourceType,
          taskGroupId: "5",
        });
      });

    let url = environment.urls.Notification_GET_ALL;
    this.restService.getWithoutLoader(url).subscribe((res) => {
      this.signalRService.signalrNotifications = [];
      res.result.items.forEach((element) => {
        if (!element.status) {
          element.statusText = "Completed";
        }
        this.signalRService.signalrNotifications.push({
          icon: "fontAwesome_Li_Class fa fa-3x fa-shopping-basket",
          title: element.title,
          badge: element.statusText,
          text: element.description,
          time: element.creationTime,
          status: element.statusText,
          link: element.link,
          isRead: element.isRead,
          id: element.id,
          sourceId: element.sourceId,
          sourceType: element.sourceType,
          taskGroupId: element.taskGroupId,
        });
      });
    });
    this.href = this.router.url;
    console.log(this.router.url);

    // if (this.auth.isSuperAdmin()) {
    //   this.showMegaMenu = true;
    // }
    //this.selectedLanguage();
  }

  toggelSidebar() {
    const state = this.navService.sidebarState;
    if (state.childnavOpen && state.sidenavOpen) {
      state.childnavOpen = false;
      this.addSidebarOpenAndCloseClass();
      return (state.childnavOpen = false);
    }
    if (!state.childnavOpen && state.sidenavOpen) {
      state.sidenavOpen = false;
      this.addSidebarOpenAndCloseClass();
      return (state.sidenavOpen = false);
    }
    // item has child items
    if (
      !state.sidenavOpen &&
      !state.childnavOpen &&
      this.navService.selectedItem.type === "dropDown"
    ) {
      state.sidenavOpen = true;
      setTimeout(() => {
        state.childnavOpen = true;
      }, 50);
    }
    // item has no child items
    if (!state.sidenavOpen && !state.childnavOpen) {
      state.sidenavOpen = true;
    }

    this.addSidebarOpenAndCloseClass();
  }

  addSidebarOpenAndCloseClass() {
    const state = this.navService.sidebarState;
    let mainHeaderElement = this.renderer.selectRootElement(
      ".main-content-wrap",
      true
    );
    let querySelector = mainHeaderElement; // mainHeaderElement itself is the element you're looking for

    if (querySelector) {
      if (!state.sidenavOpen) {
        querySelector.classList.remove("sidenav-open");
        querySelector.classList.add("sidenav-icons-open");
      } else {
        querySelector.classList.remove("sidenav-icons-open");
        querySelector.classList.add("sidenav-open");
      }
    } else {
      console.error(".main-header element not found");
    }
  }

  signout() {
    this.userService.signout();
    this.selectedLanguage();
  }
  selectedLanguage() {
    let browserlang = localStorage.getItem("lang");
    if (browserlang == "ar") {
      this.arSelected = true;
      this.enSelected = false;
    } else {
      this.enSelected = true;
      this.arSelected = false;
    }
  }

  toggleDir(lang) {
    this.customizer.toggleDir(lang == "ar");
    this.changeLanguage(lang);
    this.selectedLanguage();
  }

  changeMode() {
    this.customizer.isDarkMode;
    this.customizer.toggleMode();
  }

  public sourceId = "";
  public isTaskGroup = false;
  readNotification(notification: NotificationsDto) {
    let url = environment.urls.Notification_Update_Notification;
    this.restService.post(url, notification).subscribe((res) => {
      var notificationIndex =
        this.signalRService.signalrNotifications.findIndex(
          (x) => x.id == notification.id
        );
      this.signalRService.signalrNotifications.splice(notificationIndex, 1);

      if (notification.link) {
        this.router.navigateByUrl(notification.link);
      } else if (
        notification.sourceType == NotificationSourceTypeEnum.OfficerTask
      ) {
        var path = this.location.path();
        if (path.includes("/safecity/officertask")) {
          if (notification.taskGroupId) {
            this.isTaskGroup = true;
            this.getOfficerTask(notification.sourceId);
          } else {
            this.sourceId = notification.sourceId;
            this.isTaskGroup = false;
            this.modalService
              .open(this.popupTemplate, { ariaLabelledBy: "modal-basic-title" })
              .result.then(
                (result) => {},
                (reason) => {
                  console.log("Err!", reason);
                }
              );
          }
        } else {
          if (notification.taskGroupId) {
            this.router.navigate([
              "/safecity/officertask",
              { sourceId: notification.sourceId, isTaskGroup: true },
            ]);
            this.getOfficerTask(notification.sourceId);
          } else {
            this.router.navigate([
              "/safecity/officertask",
              { sourceId: notification.sourceId, isTaskGroup: false },
            ]);
          }
        }
      }
    });
  }

  officerTask;
  getOfficerTask(taskGroupId: any) {
    this.restService
      .get(`${environment.urls.OFFICERTASK_GET}?&id=${taskGroupId}`)
      .subscribe((data) => {
        this.officerTask = data.result;
        this.modalService
          .open(this.GroupTaskdetailsTemplate, {
            ariaLabelledBy: "modal-basic-title",
          })
          .result.then(
            (result) => {},
            (reason) => {
              console.log("Err!", reason);
            }
          );
      });
  }

  languagesForDropDown = [];
  getLanguagesList() {
    this.languagesForDropDown = [];
    this.restService.get(`${environment.urls.Get_AllLanguages}`).subscribe(
      (response) => {
        this.languagesForDropDown = [...response.result];
        this.store.setItem("languages", this.languagesForDropDown);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  previousLanguageName: "";
  defaultLanguage: any = "en";
  public source: any = "en";

  changeLanguage(language: any): void {
    this.defaultLanguage = language.name;

    this.openSweetAlert(language).then((result: boolean) => {
      if (result) {
        this.previousLanguageName = language.name;

        this.restService
          .get(
            `${environment.urls.Get_All_Language_Text}?source=${language.name}&languageName=${language.displayName}`
          )
          .subscribe((response) => {
            if (response.result.length > 0) {
              this.selectedLanguage = language.displayName;
    
              let translationsData = {} as any;
    
              response?.result?.forEach((translationText: any) => {
                translationsData[translationText?.key] = translationText.value;
              });
    
              if (language.rtl == true) {
                this.store.setItem("dir", "rtl");
                document
                  .getElementsByTagName("html")[0]
                  .setAttribute("lang", language.name);
                document.getElementsByTagName("body")[0].setAttribute("dir", "rtl");
              } else {
                this.store.setItem("dir", "ltr");
                document
                  .getElementsByTagName("html")[0]
                  .setAttribute("lang", language.name);
                document.getElementsByTagName("body")[0].setAttribute("dir", "ltr");
              }
    
              this.translateService.setTranslation(
                this.defaultLanguage,
                translationsData
              );
    
              this.translateService.setDefaultLang(this.defaultLanguage);
    
              this.store.setItem("languageTexts", translationsData);
              this.store.setItem("defaultLanguage", language.name);
    
              this.store.setItem("currentLanguageId", language.id.toString());
    
              this.translateService.use(this.defaultLanguage);
    
              var languageDisplayName = language.displayName.toLowerCase();
              //  this.virtualKeyBoardService.setKeyboardLanguageLouts(languageDisplayName);
    
              //this.customizer.toggleDir(language.name == 'ar');
    
              //this.toastr.success(`Language translated to : ${language.displayName}`);
    
              this.toastr.success(
                `${this.translateService.instant(
                  "top_Header_Language_translated_to_Message"
                )} : ${language.displayName}`,
                this.translateService.instant("toaster_Heading_Success"),
                { progressBar: true }
              );
            } else {
              //this.toastr.error(`No data found for : ${language.displayName}`);
    
              this.toastr.error(
                `${this.translateService.instant(
                  "top_Header_No_data_found_for_Message"
                )} : ${language.displayName}`,
                this.translateService.instant("toaster_Heading_Error"),
                { progressBar: true }
              );
            }
          });
      }
      else{
        this.source = this.previousLanguageName; // Fallback to "en" if undefined
      }
    });

  }

  languagesForDropDownValueChanged() {
    for (let i = 0; i < this.languagesForDropDown?.length; i++) {
      const lang = this.languagesForDropDown[i];
      if (lang.name == this.source) {
        this.languageName = lang.displayName;
        this.changeLanguage(lang);
        break;
      }
    }
  }

  openWhatsAppChat(phoneNumber: string): void {
    this.router.navigate(['/online-shop/online-orders'], {
      queryParams: { openChat: phoneNumber }
    });
  }

  openSweetAlert(language): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      Swal.fire({
        title: this.translateService.instant("toaster_Heading_Warning"),
        text: `Do you really want to change language to ${language.displayName}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.value) {
          resolve(true);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          resolve(false);
        }
      });
    });
  }

}
