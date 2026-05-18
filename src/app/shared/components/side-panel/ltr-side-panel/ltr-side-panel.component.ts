import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SidePanelService } from '../side-panel.service';


@Component({
  selector: 'app-ltr-side-panel',
  templateUrl: './ltr-side-panel.component.html',
  styleUrls: ['./ltr-side-panel.component.css']
})
export class LtrSidePanelComponent implements OnInit, OnDestroy {

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