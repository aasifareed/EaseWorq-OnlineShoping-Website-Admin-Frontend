import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptorService } from './interceptors/token-interceptor.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { PermissionService } from './shared/services/permission.service';
import { SharedComponentsModule } from './shared/components/shared-components.module';
import { CustomUserStoreService } from './shared/services/custom-user-store.service';
import { GlobalDataService } from './shared/services/globalData.service';
import { SiteNotAvailableComponent } from './SiteNotAvailable/SiteNotAvailable.component';
import { TenantService } from './shared/services/Tenant.service';
import { Router, RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageInterceptor } from './interceptors/LanguageInterceptor';
import { GlobalErrorHandler } from './shared/services/global-error.handler';
import { SignalRService } from './shared/services/signal-r.service';
import { LayoutsModule } from './shared/components/layouts/layouts.module';

export function TranslationLoaderFactory(http: HttpClient) {
  return null;
}

export function checkTenantFactory(
  tenantService: TenantService,
  router: Router,
  globalDataService: GlobalDataService
): () => Promise<void> {
  return async (): Promise<void> => {
    if (environment.production === false) {
      globalDataService.setTenantName('beta-ak-mobile-shop');
      globalDataService.setTenantId(1);
      return Promise.resolve();
    }

    const subdomain = window.location.hostname.split('.')[0];

    if (subdomain !== globalDataService.getCurrentTanantName()) {
      return tenantService
        .checkTenantAvailability(subdomain)
        .toPromise()
        .then((available) => {
          if (!available) {
            router.navigate(['/site-not-available']);
          }
        })
        .catch(() => {
          router.navigate(['/site-not-available']);
        });
    }

    return Promise.resolve();
  };
}

@NgModule({
  declarations: [AppComponent, SiteNotAvailableComponent],
  imports: [
    BrowserModule,
    SharedModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgMultiSelectDropDownModule.forRoot(),
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: TranslationLoaderFactory,
        deps: [HttpClient],
      },
    }),
    SharedComponentsModule,
    LayoutsModule,
  ],
  providers: [
    TenantService,
    GlobalDataService,
    [
      {
        provide: APP_INITIALIZER,
        useFactory: checkTenantFactory,
        deps: [TenantService, Router, GlobalDataService],
        multi: true,
      },
    ],
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LanguageInterceptor,
      multi: true,
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    DatePipe,
    PermissionService,
    SignalRService,
    CustomUserStoreService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
