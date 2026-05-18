import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { LocalStoreService } from '../../services/local-store.service';
import { GlobalDataService } from '../../services/globalData.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
  @Input()
  isLoading: boolean;

  @Input() isManualLoading: boolean;

  loader:any;

  constructor(private loaderService: LoaderService,
    private store: LocalStoreService,
    public globalDataService:GlobalDataService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    
    this.loaderService.status.subscribe((val: boolean) => {
      this.isLoading = val;
      this.cdRef.detectChanges();
    })
  }
  
}