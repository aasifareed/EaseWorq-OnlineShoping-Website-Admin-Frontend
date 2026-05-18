import { Component, OnInit, AfterViewInit, HostListener, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import {
  NavigationService,
  IMenuItem,
  IChildItem,
  InconsTypeEnum
} from '../../../../services/navigation.service';
import { Router, NavigationEnd } from '@angular/router';
import { PerfectScrollbarDirective } from 'ngx-perfect-scrollbar';

import { filter } from 'rxjs/operators';
import { Utils } from '../../../../utils';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';

@Component({
  selector: 'app-sidebar-large',
  templateUrl: './sidebar-large.component.html',
  styleUrls: ['./sidebar-large.component.scss']
})
export class SidebarLargeComponent implements OnInit, AfterViewInit {

  public inconsTypeEnum = InconsTypeEnum;
  selectedItem: IMenuItem;
  nav: IMenuItem[];
  @ViewChildren(PerfectScrollbarDirective) psContainers:QueryList<PerfectScrollbarDirective>;
  psContainerSecSidebar: PerfectScrollbarDirective;

  constructor(public router: Router
    , public navService: NavigationService
    , public globalService:GlobalDataService,
    private renderer: Renderer2) {
  }

  ngAfterViewInit() {
    // ViewChildren are available after view initialization
    if (this.psContainers && this.psContainers.length > 1) {
      this.psContainerSecSidebar = this.psContainers.toArray()[1];
    } else {
      // Fallback: try again after a short delay if not ready
      setTimeout(() => {
        if (this.psContainers && this.psContainers.length > 1) {
          this.psContainerSecSidebar = this.psContainers.toArray()[1];
        }
      }, 0);
    }
  }

    ngOnInit() {
      
    this.updateSidebar();
    // CLOSE SIDENAV ON ROUTE CHANGE
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
        this.closeChildNav();
        if (Utils.isMobile()) {
          this.navService.sidebarState.sidenavOpen = false;
        }
      });

      this.navService.menuItems$.subscribe(items => {
        
      // Menu permission filtering disabled for now.
      // var accessMenu = this.navService.getAllowedMenu(items);
      // this.nav = accessMenu;
      this.nav = items;
      this.setActiveFlag();
      
    });
  }

    selectItem(item) {
    this.navService.sidebarState.childnavOpen = true;
    this.navService.selectedItem = item;
    this.setActiveMainItem(item);

    // Scroll to top secondary sidebar
    setTimeout(() => {            
      this.psContainerSecSidebar.update();
      this.psContainerSecSidebar.scrollToTop(0, 400);
    });
  }
    closeChildNav() {
    this.navService.sidebarState.childnavOpen = false;
    this.setActiveFlag();
  }

    onClickChangeActiveFlag(item) {
    this.setActiveMainItem(item);
  }
    setActiveMainItem(item) {
    this.nav.forEach(i => {
      i.active = false;
    });
    item.active = true;
  }

    setActiveFlag() {
    if (!this.nav?.length) {
      return;
    }

    const activeRoute = this.normalizeRoutePath(
      window.location.hash || this.router.url || window.location.pathname
    );

    this.nav.forEach(item => {
      item.active = false;
      if (item.state && this.isRouteMatch(activeRoute, item.state)) {
        this.navService.selectedItem = item;
        item.active = true;
      }
      if (item.sub) {
        item.sub.forEach(subItem => {
          subItem.active = false;
          if (subItem.state && this.isRouteMatch(activeRoute, subItem.state)) {
            this.navService.selectedItem = item;
            item.active = true;
          }
          if (subItem.sub) {
            subItem.sub.forEach(subChildItem => {
              if (subChildItem.state && this.isRouteMatch(activeRoute, subChildItem.state)) {
                this.navService.selectedItem = item;
                item.active = true;
                subItem.active = true;
              }
            });
          }
        });
      }
    });
  }

  /** Avoid matching /online-shop/settings when the URL is /online-shop/settings/storefront vs /online-shop/storefront */
  private isRouteMatch(activeRoute: string, menuState: string): boolean {
    const route = this.normalizeRoutePath(activeRoute);
    const state = this.normalizeRoutePath(menuState);
    return route === state || route.startsWith(state + '/');
  }

  private normalizeRoutePath(url: string): string {
    if (!url) {
      return '';
    }
    return url.replace(/^#/, '').split('?')[0].replace(/\/+$/, '');
  }

    updateSidebar() {
    if (Utils.isMobile()) {
      this.navService.sidebarState.sidenavOpen = false;
      this.navService.sidebarState.childnavOpen = false;
    } else {
      this.navService.sidebarState.sidenavOpen = true;
    }

    this.addSidebarOpenAndCloseClass();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateSidebar();
  }



  addSidebarOpenAndCloseClass(){
    
    const state = this.navService.sidebarState;
    let mainHeaderElement = this.renderer.selectRootElement('.main-content-wrap', true);
    let querySelector = mainHeaderElement; // mainHeaderElement itself is the element you're looking for
    
    if (querySelector) {
      if (!state.sidenavOpen) {
        querySelector.classList.remove('sidenav-open');
        querySelector.classList.add('sidenav-icons-open');
      } else {
        querySelector.classList.remove('sidenav-icons-open');
        querySelector.classList.add('sidenav-open');
      }
    } else {
      console.error('.main-header element not found');
    }

  }
}
