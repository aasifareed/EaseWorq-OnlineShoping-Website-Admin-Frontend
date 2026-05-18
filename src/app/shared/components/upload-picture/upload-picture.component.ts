
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GlobalDataService } from 'src/app/shared/services/globalData.service';


@Component({
  selector: 'app-upload-picture',
  templateUrl: './upload-picture.component.html',
  styleUrls: ['./upload-picture.component.scss']
})
export class UploadPictureComponent implements OnInit {

  @Output() passFileEvent = new EventEmitter<File>();

  progress: number;
  message: string;
  fileIsTooBig:boolean=false;

  constructor(public activeModal: NgbActiveModal,public globalDataService:GlobalDataService,) { }
  ngOnInit() {
  }
  uploadFile = (files) => {
    if (files.length === 0) {
      return;
    }
    this.fileIsTooBig=false;
    
    let fileToUpload = <File>files[0];
    this.passFileEvent.emit(fileToUpload);
    this.activeModal.close(fileToUpload);
  }


}


