import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateJsonFileService {

  constructor(private http: HttpClient) {}

  // Read JSON file
  getJsonData(language:any): Observable<any> {
   var jsonUrl = `../../../custom-assets/i18n/${language}.json`;
    return this.http.get(jsonUrl);
  }

}
