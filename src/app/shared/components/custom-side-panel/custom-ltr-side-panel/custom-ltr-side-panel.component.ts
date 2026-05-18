import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CustomLTRSidePanelService } from './custom-ltr-side-panel.service';


@Component({
  selector: 'app-custom-ltr-side-panel',
  templateUrl: './custom-ltr-side-panel.component.html',
  styleUrls: ['./custom-ltr-side-panel.component.css']
})
export class CustomLtrSidePanelComponent implements OnInit, OnDestroy {

  @Input() showToggle: boolean = true;

  constructor(public service: CustomLTRSidePanelService) { }

  isOpen;
  subscriptionRef;


  public right;
  public top = 0;
  public width=380;
  public height:number;;


  ngOnInit(): void {
    
    this.service.myWidth$.subscribe(value => {
      
      this.width = value;
    });

    this.service.myRight$.subscribe(value => {
      
      this.right = value;
    });

    this.service.myTop$.subscribe(value => {
      
      this.top = value;
    });


    this.service.myHeight$.subscribe(value => {
      
      this.height = value;
    });


    this.subscriptionRef = this.service.open$.subscribe((value) => {

      this.isOpen = value;
      var right;
  
      this.service.myRight$.subscribe(value => {
        
        right = value;
      });


      if(this.isOpen==false)
      {
        this.right = right;
      }else{
        this.right=0;
      }

    })
  }
  ngOnDestroy(): void {
    if (this.subscriptionRef) {
      this.subscriptionRef.unsubscribe();
    }
  }

  showHideSidePanel(){
     var right;
    this.isOpen=!this.isOpen;

    this.service.myRight$.subscribe(value => {
      
      right = value;
    });

    if(this.isOpen==false)
      {
        this.right = right;
      }else{
        this.right=0;
      }
  }




}