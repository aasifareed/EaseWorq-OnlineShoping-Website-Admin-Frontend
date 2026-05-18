import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CustomRTLSidePanelService } from './custom-rtl-side-panel.service';

@Component({
  selector: 'app-custom-rtl-side-panel',
  templateUrl: './custom-rtl-side-panel.component.html',
  styleUrls: ['./custom-rtl-side-panel.component.scss']
})
export class CustomRtlSidePanelComponent implements OnInit, OnDestroy {

  @Input() showToggle: boolean = true;
 
  constructor(public service: CustomRTLSidePanelService) { }

  isOpen;
  subscriptionRef;

  public left;
  public top = 0;
  public width=380;
  public height:number;;


  ngOnInit(): void {
    this.service.myWidth$.subscribe(value => {
      
      this.width = value;
    });

    this.service.myLeft$.subscribe(value => {
      
      this.left = value;
    });

    this.service.myTop$.subscribe(value => {
      
      this.top = value;
    });

    this.service.myHeight$.subscribe(value => {
      
      this.height = value;
    });


    this.subscriptionRef = this.service.open$.subscribe((value) => {

      this.isOpen = value;
      var left;
  
      this.service.myLeft$.subscribe(value => {
        
        left = value;
      });


      if(this.isOpen==false)
      {
        this.left = left;
      }else{
        this.left=0;
      }

    })
  }
  ngOnDestroy(): void {
    if (this.subscriptionRef) {
      this.subscriptionRef.unsubscribe();
    }
  }

  showHideSidePanel(){
     var left;
    this.isOpen=!this.isOpen;

    this.service.myLeft$.subscribe(value => {
      
      left = value;
    });

    if(this.isOpen==false)
      {
        this.left = left;
      }else{
        this.left=0;
      }
  }

}
