import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SidePanelService } from '../side-panel.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-rtl-side-panel',
  templateUrl: './rtl-side-panel.component.html',
  styleUrls: ['./rtl-side-panel.component.scss']
})
export class RtlSidePanelComponent implements OnInit, OnDestroy {

  constructor(private service: SidePanelService) { }

  isOpen;
  subscriptionRef;
  
  ngOnInit(): void {

    

    this.subscriptionRef = this.service.open$.subscribe((value) => {
      this.isOpen = value;
    })
  }
  ngOnDestroy(): void {
    if (this.subscriptionRef) {
      this.subscriptionRef.unsubscribe();
    }
  }

}
