import { Component } from '@angular/core';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  activeTab: 'sale' | 'profit' = 'sale';

  constructor(public globalDataService: GlobalDataService) {}

  setTab(tab: 'sale' | 'profit'): void {
    this.activeTab = tab;
  }
}
