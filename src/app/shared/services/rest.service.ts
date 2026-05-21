import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { LoaderService } from "./loader.service";
import { tap, catchError, map } from "rxjs/operators";
import { of } from "rxjs";
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import 'rxjs/add/operator/finally';
import { take, finalize } from 'rxjs/operators';
import { environment } from "src/environments/environment";
import { UrlHelperService } from "./url-helper.service";
@Injectable({
    providedIn: "root"
})
export class RestService {
    constructor(private http: HttpClient,
        private loaderService: LoaderService,
        private router: Router,
        private urlHelper: UrlHelperService
    ) {

    }

    getDirect(url: string, isLocal?: boolean): Observable<any> {
        let baseURL = environment.apiBaseUrl;
        if(isLocal)
        {
            baseURL = environment.apiBaseUrlLocal
        }
        return this.http.get(baseURL + url);
    }

    get(url: string, isLocal?: boolean): Observable<any> {
        this.loaderService.display(true);
        let baseURL = environment.apiBaseUrl;
        if(isLocal)
        {
            baseURL = environment.apiBaseUrlLocal
        }
        return this.http.get(baseURL + url).pipe(finalize(() => {
            this.loaderService.display(false);
        }))
    }


    // getByToken(url: string,token:any, isLocal?: boolean): Observable<any> {
    //     
       
    //     this.loaderService.display(true);
    //     let baseURL = environment.apiBaseUrl;
    //     if(isLocal)
    //     {
    //         baseURL = environment.apiBaseUrlLocal
    //     }
    //     return this.http.get(baseURL + url, { headers:reqHeader}).pipe(finalize(() => {
    //         this.loaderService.display(false);
    //     }))
    // }


    getWithQueryParams(url: string,queryParams?:any, isLocal?: boolean): Observable<any> {
        this.loaderService.display(true);
        let baseURL = environment.apiBaseUrl;
        if(isLocal)
        {
            baseURL = environment.apiBaseUrlLocal
        }
        return this.http.get(baseURL + url,{params:queryParams}).pipe(finalize(() => {
            this.loaderService.display(false);
        }))
    }

    getwithId(userId): Observable<any> {
        this.loaderService.display(true);
        return this.http.get(environment.apiBaseUrl + '?UserId' + userId).pipe(finalize(() => {
            this.loaderService.display(false);
        }))

    }


    getWithoutLoader(url: string): Observable<any> {
        return this.http.get(environment.apiBaseUrl + url).pipe(finalize(() => {
            //this.loaderService.display(false);
        }))

    }

    getData(url: string): Observable<any> {
        return this.http.get(environment.apiBaseUrl + url).pipe(finalize(() => {
            this.loaderService.display(false);
        }))

    }

    getJSON(url: string): Observable<any> {
        const headers = new HttpHeaders();
        headers.append('Content-Type', 'application/json');

        return this.http.get(url, { headers }).pipe(finalize(() => {
            this.loaderService.display(false);
        }))
    }

    postUrlEncoded(url: string, body): Observable<any> {
        this.loaderService.display(true)
        const headers = new HttpHeaders();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');


        if ((navigator.userAgent.indexOf("MSIE") !== -1) || (!!document['documentMode'] === true)) { //IF IE > 10

            var urlSearchParams = '';
            let firstKey = true;
            Object.keys(body).forEach(function (key) {
                if (firstKey) {
                    firstKey = false;
                    urlSearchParams = key + '=' + body[key];
                }
                else {
                    urlSearchParams = urlSearchParams + '&' + key + '=' + body[key];
                }

            });

            // $.post(url, urlSearchParams, 
            //     function(result) {  
            //         alert( "success" );
            //     })
            //       .done(function(result) {
            //         alert( "second success" );
            //       })
            //       .fail(function(result) {
            //         alert( "error" );
            //       })
            //       .always(function(result) {
            //             alert( "finished" );
            //       });    

            return this.http.post(url, urlSearchParams, { headers }
            ).pipe(finalize(() => {
                this.loaderService.display(false);
            }));

        } else {
            const urlSearchParams = new URLSearchParams();
            Object.keys(body).forEach(function (key) {
                urlSearchParams.append(key, body[key]);
            });
            return this.http.post(url, urlSearchParams.toString(), { headers }).pipe(finalize(() => {
                this.loaderService.display(false);
            }));
        }



    }

    post(url: string, body: any): Observable<any> {
        this.loaderService.display(true);
        const headers = new HttpHeaders(
            {
                'Content-Type': 'application/json',
            }
        );
        return this.http.post(environment.apiBaseUrl + url, body, { headers }
        ).pipe(finalize(() => {
            this.loaderService.display(false);
        }));
    }

    postFormData(url: string, formData: FormData): Observable<any> {
        this.loaderService.display(true);
        return this.http.post(environment.apiBaseUrl + url, formData).pipe(
            finalize(() => {
                this.loaderService.display(false);
            }),
        );
    }

    postWithOutSpinner(url: string, body: any): Observable<any> {
        const headers = new HttpHeaders(
            {
                'Content-Type': 'application/json',
            }
        );
        return this.http.post(environment.apiBaseUrl + url, body, { headers }
        ).pipe(finalize(() => {
        }));
    }

    put(url: string, body: any): Observable<any> {
        const headers = new HttpHeaders(
            {
                'Content-Type': 'application/json',
            }
        );
        return this.http.put(environment.apiBaseUrl + url, body, { headers }).pipe(finalize(() => {
            this.loaderService.display(false);
        }));
    }
    delete(url:string):Observable<any>{
        const headers = new HttpHeaders(
            {
                'Content-Type': 'application/json',
            }
        );
        return this.http.delete(environment.apiBaseUrl +url,{headers}).pipe(finalize(()=>{
            this.loaderService.display(false);
        }))
    }


    checkTenant( body: any): Observable<any> {

        const url = this.urlHelper.getUrl('Is_Tenant_Available_Oauth');

        this.loaderService.display(true);
    
        const headers = new HttpHeaders().set('X-App-Request-Source', 'web-app');

        return this.http.post(url, body, { headers })
          .pipe(
            finalize(() => {
              this.loaderService.display(false);
            })
          );
    }
    


    // private handleError(error: HttpErrorResponse) {
    //     let errorMessage = '';

    //     if (error.error instanceof ErrorEvent) {
    //         errorMessage = `An error occurred: ${error.error.message}`
    //     } else {
    //         if (error.status === 401) {
    //             errorMessage = 'يرجى تسجيل الدخول';
    //             this.router.navigate(['/auth/login']);
    //         } else if (error.status === 403) {
    //             errorMessage = 'لا تملك الصلاحية';
    //             // this.router.navigate(['/auth/login']);
    //         }
    //         else {
    //             console.error(error.status);
    //             console.error(error.message);
    //             errorMessage = `حدث خطأ بالنظام, يرجى المحاولة لاحقا`;
    //         }
    //     }
    //     const msg = new SnackBarMessage(errorMessage);
    //     this.snackBarService.error(msg);
    //     return Observable.throw(errorMessage);
    // }

}
