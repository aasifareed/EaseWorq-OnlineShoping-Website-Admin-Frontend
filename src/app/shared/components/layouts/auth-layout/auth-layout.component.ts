import { Component, OnInit } from '@angular/core';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit {


  constructor(
    public globalDataService:GlobalDataService
  ) { }

  ngOnInit() {
  }




  onKeyboardChangeForSignInForm(event) {
    
    // if(this.virtualKeyBoardService.genericForm){
    //   this.virtualKeyBoardService.genericForm.controls[this.virtualKeyBoardService.inputName].setValue(this.virtualKeyBoardService.keyboardValue);
    // }
    // else{
    //   this.virtualKeyBoardService.myFormControl.setValue(this.virtualKeyBoardService.keyboardValue);
    // }
  }


  getStyle(url: string, index: number) {
    
    if(url){
      // Normalize the path to ensure it uses forward slashes
      const normalizedUrl = url.replace(/\\/g, '/');
    
      return {
        'background-image': `url(${encodeURI(normalizedUrl)})`,
        'animation-delay': this.globalDataService.images[index].delay
      };
    }
  }

}
