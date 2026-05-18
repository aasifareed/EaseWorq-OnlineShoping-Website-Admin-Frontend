import { Component, OnInit } from '@angular/core';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  animations: [SharedAnimations]
})
export class SignupComponent implements OnInit {

  constructor(public globalDataService:GlobalDataService) { }

  ngOnInit() {
  }

}
