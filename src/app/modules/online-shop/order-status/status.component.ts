import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css'],
})
export class StatusComponent implements OnInit, OnDestroy {
  activeIndex = 0;
  private routerSub: Subscription;

  constructor(
    public globalDataService: GlobalDataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.syncActiveTabFromUrl(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.syncActiveTabFromUrl(e.urlAfterRedirects || e.url);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  changeTab(index: number): void {
    this.activeIndex = index;
    if (index === 0) {
      this.router.navigate(['/online-shop/order-status']);
    } else {
      this.router.navigate(['/online-shop/order-status/events']);
    }
  }

  private syncActiveTabFromUrl(url: string): void {
    this.activeIndex = url.includes('/order-status/events') ? 1 : 0;
  }
}
