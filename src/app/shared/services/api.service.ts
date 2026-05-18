import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigService, RuntimeConfig } from './runtime-config.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private config: RuntimeConfig | null = null;

  constructor(
    private http: HttpClient,
    private runtimeConfigService: RuntimeConfigService
  ) {
    // Get the runtime configuration
    this.runtimeConfigService.loadConfig().subscribe(config => {
      this.config = config;
    });
  }

  // Get the current API base URL (runtime config takes precedence)
  getApiBaseUrl(): string {
    if (this.config) {
      return this.config.apiBaseUrl;
    }
    return environment.apiBaseUrl;
  }

  // Get the current base URL (runtime config takes precedence)
  getBaseUrl(): string {
    if (this.config) {
      return this.config.baseUrl;
    }
    return environment.baseUrl;
  }

  // Get the current asset URL (runtime config takes precedence)
  getAssetUrl(): string {
    if (this.config) {
      return this.config.assetUrl;
    }
    return environment.assetUrl;
  }

  // Get OAuth configuration (runtime config takes precedence)
  getOAuthConfig() {
    if (this.config) {
      return {
        host: this.config.oauthHost,
        port: this.config.oauthPort,
        protocol: this.config.oauthProtocol,
        path: this.config.oauthPath,
        client_id: this.config.oauthClientId,
        secret: this.config.oauthSecret,
      };
    }
    return environment.oauth;
  }

  // Helper method to build full API URLs
  buildApiUrl(endpoint: string): string {
    return `${this.getApiBaseUrl()}${endpoint}`;
  }

  // Helper method to build full asset URLs
  buildAssetUrl(path: string): string {
    return `${this.getAssetUrl()}${path}`;
  }
}