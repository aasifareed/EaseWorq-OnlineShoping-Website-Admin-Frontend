import { appServiceUrls } from './environment.urls';

// const BACKEND_URL = 'https://localhost:44374/';
const BACKEND_URL = 'https://wqw3kv18-44374.uks1.devtunnels.ms/';
const OauthHost = '//wqw3kv18-44374.uks1.devtunnels.ms';
const BACKEND_URL_LOCAL = BACKEND_URL + 'api';
const OauthProtocol = 'https';
const OauthClientId = '';
const OauthPort = '';
const OauthSecret = '';

const oauthConfig = {
  host: OauthHost,
  port: OauthPort,
  protocol: OauthProtocol,
  path: 'api/TokenAuth/OnlineShopAuthenticate',
  client_id: OauthClientId,
  secret: OauthSecret,
};

export const environment = {
  apiBaseUrl: BACKEND_URL + 'api/services/app',
  apiBaseUrlLocal: BACKEND_URL_LOCAL,
  baseUrl: BACKEND_URL,
  assetUrl: BACKEND_URL + 'SmartOfficerAttachment',
  /** Customer storefront base URL for page preview links, e.g. http://localhost:4200 */
  onlineShopStorefrontUrl: 'http://localhost:4200',
  production: false,
  /** Same key as POS Orders Map Dashboard / Store Working Area. */
  googleMapsApiKey: 'AIzaSyBiCLFWeI8W8gDzHKs5uQEBgnIlmih1DTs',
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
