import { Component, OnInit } from '@angular/core';
import { GlobalDataService } from '../../services/globalData.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor(public globalDataService:GlobalDataService) { }

  ngOnInit() {
  }

}
