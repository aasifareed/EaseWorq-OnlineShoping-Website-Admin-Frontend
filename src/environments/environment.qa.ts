import { appServiceUrls } from './environment.urls';

const BACKEND_URL = 'https://pos-api.qa-behzitech.store/';
const OauthHost = '//pos-api.qa-behzitech.store';
const BACKEND_URL_LOCAL = 'http://localhost:63661/api';
const OauthProtocol = 'https';
const OauthClientId = '';
const OauthPort = '';
const OauthSecret = '';

const oauthConfig = {
  host: OauthHost,
  port: OauthPort,
  protocol: OauthProtocol,
  path: 'api/TokenAuth/Authenticate',
  client_id: OauthClientId,
  secret: OauthSecret,
};

export const environment = {
  apiBaseUrl: BACKEND_URL + 'api/services/app',
  apiBaseUrlLocal: BACKEND_URL_LOCAL,
  baseUrl: BACKEND_URL,
  assetUrl: BACKEND_URL + 'SmartOfficerAttachment',
  production: true,
  oauth: oauthConfig,
  impersonateOauth: {
    ...oauthConfig,
    path: 'api/TokenAuth/ImpersonateAuthenticate',
  },
  Is_Tenant_Available_Oauth: {
    ...oauthConfig,
    path: 'api/CheckTenantAvailability/checkTenantAvailabilityOnline',
  },
  urls: appServiceUrls,
};
