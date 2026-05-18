import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface RuntimeConfig {
  apiBaseUrl: string;
  baseUrl: string;
  assetUrl: string;
  oauthHost: string;
  oauthProtocol: string;
  oauthPort: string;
  oauthClientId: string;
  oauthSecret: string;
  oauthPath: string;
  production: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private config: RuntimeConfig | null = null;
  private configLoaded = false;

  constructor(private http: HttpClient) {}

  loadConfig(): Observable<RuntimeConfig> {
    if (this.configLoaded && this.config) {
      return of(this.config);
    }

    // Use relative path for file:// (packaged), absolute path for web
    const configPath = window.location.protocol === 'file:' 
      ? './assets/config/runtime-config.json' 
      : '/assets/config/runtime-config.json';

    return this.http.get<RuntimeConfig>(configPath).pipe(
      tap(config => {
        this.config = config;
        this.configLoaded = true;
        console.log('Runtime configuration loaded:', config);
      }),
      catchError(error => {
        console.error('Failed to load runtime configuration:', error);
        // Return default configuration if runtime config fails to load
        return of(this.getDefaultConfig());
      })
    );
  }

  getConfig(): RuntimeConfig | null {
    return this.config;
  }

  isConfigLoaded(): boolean {
    return this.configLoaded;
  }

  private getDefaultConfig(): RuntimeConfig {
    return {
      apiBaseUrl: 'https://pos-api.shanfusiontech.com/api/services/app',
      baseUrl: 'https://pos-api.shanfusiontech.com/',
      assetUrl: 'https://pos-api.shanfusiontech.com/SmartOfficerAttachment',
      oauthHost: '//pos-api.shanfusiontech.com',
      oauthProtocol: 'https',
      oauthPort: '',
      oauthClientId: '',
      oauthSecret: '',
      oauthPath: 'api/TokenAuth/Authenticate',
      production: true
    };
  }
}