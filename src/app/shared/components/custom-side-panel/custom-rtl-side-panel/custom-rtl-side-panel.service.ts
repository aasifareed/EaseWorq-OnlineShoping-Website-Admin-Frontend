import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomRTLSidePanelService {

  private myLeftSubject = new BehaviorSubject<any>(null);
  public myLeft$ = this.myLeftSubject.asObservable();
  
  private myWidthSubject = new BehaviorSubject<any>(null);
  public myWidth$ = this.myWidthSubject.asObservable();
  
  private myTopSubject = new BehaviorSubject<any>(null);
  public myTop$ = this.myTopSubject.asObservable();
  
  private myHeightSubject = new BehaviorSubject<any>(null);
public myHeight$ = this.myHeightSubject.asObservable();

    public top = 0;
  
    private _open = new Subject();
    open$ = this._open.asObservable();
    constructor() { 
      this.myWidthSubject.next(380);
      this.myWidthSubject.next(380);
      this.myTopSubject.next(0);
    }
  
    open(value) {
      this._open.next(value);
    }
  
    setWidthAndLeft(width:any, left:any, top?:any,height?:any){
      this.myWidthSubject.next(width);
      this.myLeftSubject.next(left);
      if(top){
        this.myTopSubject.next(top);
      }else{
        this.myTopSubject.next(0);
      }

      if(height){
        this.myHeightSubject.next(height);
      }else{
        this.myHeightSubject.next(600);
      }


    }


}
