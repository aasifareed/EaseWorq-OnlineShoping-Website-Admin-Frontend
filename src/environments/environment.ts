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
  /** Store domain used to load the storefront logo on the sign-in page (same as customer website). */
  onlineShopBrandHostName: 'sastakhareedo.com',
  production: false,
  /** Same key as POS Orders Map Dashboard / Store Working Area. */
  googleMapsApiKey: 'AIzaSyBrkUdsOFG3lK22UBRk_Zu1BBee8YyS8RY',
  /** Online ArcGIS JS API (Esri CDN). Used by Manage Order location map. */
  esriMapUrlDomain: 'https://js.arcgis.com',
  esriMapUrlPath: '/4.18/',
  esriMapCssUrlPath: '/4.18/esri/themes/light/main.css',
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
