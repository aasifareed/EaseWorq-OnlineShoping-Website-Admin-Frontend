import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class LanguageInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Assume you store current language in localStorage or a service
    const currentLang = localStorage.getItem('defaultLanguage') || 'en';
    const currentLangId = localStorage.getItem('currentLanguageId') || "1";

    const modifiedReq = req.clone({
      setHeaders: {
        'Accept-Language': currentLang,
        'Accept-Language-Id': currentLangId,
      }
    });

    return next.handle(modifiedReq);
  }
}
