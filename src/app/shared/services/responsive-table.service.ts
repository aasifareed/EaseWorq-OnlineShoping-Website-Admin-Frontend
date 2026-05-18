import { Injectable, HostListener } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ResponsiveTableHeights {
  rowHeight: number;
  headerHeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveTableService {
  private heightsSubject = new BehaviorSubject<ResponsiveTableHeights>(this.calculateHeights());
  public heights$: Observable<ResponsiveTableHeights> = this.heightsSubject.asObservable();

  constructor() {
    // Initial calculation
    this.updateHeights();
  }

  /**
   * Calculate responsive row and header heights based on screen width
   */
  private calculateHeights(): ResponsiveTableHeights {
    const screenWidth = window.innerWidth;
    
    // Large screens (24-inch monitors, 1920px and above)
    if (screenWidth >= 1920) {
      return {
        rowHeight: 50,
        headerHeight: 55
      };
    }
    // Medium-large screens (Laptops, 1366px - 1919px)
    else if (screenWidth >= 1366) {
      return {
        rowHeight: 42,
        headerHeight: 50
      };
    }
    // Medium screens (992px - 1365px)
    else if (screenWidth >= 992) {
      return {
        rowHeight: 40,
        headerHeight: 48
      };
    }
    // Small screens (below 992px)
    else {
      return {
        rowHeight: 38,
        headerHeight: 45
      };
    }
  }

  /**
   * Get current responsive heights
   */
  getHeights(): ResponsiveTableHeights {
    return this.calculateHeights();
  }

  /**
   * Get row height only
   */
  getRowHeight(): number {
    return this.calculateHeights().rowHeight;
  }

  /**
   * Get header height only
   */
  getHeaderHeight(): number {
    return this.calculateHeights().headerHeight;
  }

  /**
   * Update heights and notify subscribers
   */
  updateHeights(): void {
    this.heightsSubject.next(this.calculateHeights());
  }

  /**
   * Listen to window resize events
   * Components should call this in their @HostListener('window:resize')
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateHeights();
  }

  /**
   * Get responsive input height for form inputs in tables
   */
  getInputHeight(): number {
    const screenWidth = window.innerWidth;
    
    if (screenWidth >= 1920) {
      return 36;
    } else if (screenWidth >= 1366) {
      return 30;
    } else if (screenWidth >= 992) {
      return 28;
    } else {
      return 24;
    }
  }

  /**
   * Get responsive font size for table headers
   */
  getHeaderFontSize(): number {
    const screenWidth = window.innerWidth;
    
    if (screenWidth >= 1920) {
      return 15;
    } else if (screenWidth >= 1366) {
      return 14;
    } else if (screenWidth >= 992) {
      return 13;
    } else {
      return 12;
    }
  }
}

