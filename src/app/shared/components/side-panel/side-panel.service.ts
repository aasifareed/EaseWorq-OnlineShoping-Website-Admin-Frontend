import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidePanelService {
  private _open = new Subject();
  open$ = this._open.asObservable();
  constructor() { }

  open(value) {
    this._open.next(value);
  }
}
