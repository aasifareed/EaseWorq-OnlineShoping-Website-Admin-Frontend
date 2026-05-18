import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { SearchService } from 'src/app/shared/services/search.service';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { Router, RouteConfigLoadStart, ResolveStart, RouteConfigLoadEnd, ResolveEnd } from '@angular/router';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';

@Component({
  selector: 'app-admin-layout-sidebar-compact',
  templateUrl: './admin-layout-sidebar-compact.component.html',
  styleUrls: ['./admin-layout-sidebar-compact.component.scss']
})
export class AdminLayoutSidebarCompactComponent implements OnInit {
    moduleLoading: boolean;
  
    constructor(
      public navService: NavigationService,
      public searchService: SearchService,
      private router: Router,
      private globalService:GlobalDataService
    ) { 
    }
  
    ngOnInit() {
      this.router.events.subscribe(event => {
        if (event instanceof RouteConfigLoadStart || event instanceof ResolveStart) {
          this.moduleLoading = true;
        }
        if (event instanceof RouteConfigLoadEnd || event instanceof ResolveEnd) {
          this.moduleLoading = false;
        }
      });
    }

}
