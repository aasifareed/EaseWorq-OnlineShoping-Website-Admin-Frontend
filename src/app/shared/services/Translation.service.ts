import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  constructor(private translate: TranslateService, private http: HttpClient) {
    
    this.setTranslations({ HELLO: 'Hello World' });
  }

  setTranslations(translations: { [key: string]: string }): void {
    this.translate.setTranslation('en', translations);
    this.translate.setDefaultLang('en');
  }
}