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
  path: 'api/TokenAuth/OnlineShopAuthenticate',
  client_id: OauthClientId,
  secret: OauthSecret,
};

export const environment = {
  apiBaseUrl: BACKEND_URL + 'api/services/app',
  apiBaseUrlLocal: BACKEND_URL_LOCAL,
  baseUrl: BACKEND_URL,
  assetUrl: BACKEND_URL + 'SmartOfficerAttachment',
  production: true,
  googleMapsApiKey: 'AIzaSyBrkUdsOFG3lK22UBRk_Zu1BBee8YyS8RY',
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
