import { Injectable } from '@angular/core';
import { HttpInterceptor } from '@angular/common/http';
import { AuthService } from '../shared/services/auth.service';
import { environment } from 'src/environments/environment';


@Injectable()
export class TokenInterceptorService implements HttpInterceptor {

 constructor(private authService: AuthService) { }
  private clone:any
 intercept(request, next) {
  const requestSource = 'web-app';
  if(request.url.includes(environment.apiBaseUrlLocal))
  {
    this.clone = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.authService.getToken()}`,
        'X-App-Request-Source': requestSource
      }
    });
  }else{
    this.clone = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.authService.getToken()}`,
        'X-App-Request-Source': requestSource
      }
    });
  }

   return next.handle(this.clone);
 }
}