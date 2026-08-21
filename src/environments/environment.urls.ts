/** API paths used by the online shop admin app (appended to apiBaseUrl). */
export const appServiceUrls = {
  // Auth & user
  USER_GETBYID: '/User/GetUserByIdForOnlineShopAdmin',
  get_User_Store_By_UserId: '/User/getUserStoreByUserIdForOnlineShopAdmin',
  User_Reset_Password_Request: '/User/ResetPasswordRequest',
  User_Check_OTP: '/User/CheckOTP',
  User_Change_Password_ByOTP: '/User/ChangePasswordByOTP',
  User_Expire_Old_OTP: '/User/ExpireOldOTP',

  // Tenant
  Is_Tenant_Available: '/Account/IsTenantAvailable',
  Get_Setting_By_TenantId: '/CustomSetting/GetSettingByTenantId',

  // Header: notifications, language
  Notification_GET_ALL: '/Notification/GetNotifications',
  Notification_Update_Notification: '/Notification/UpdateNotification',
  OFFICERTASK_GET: '/OfficerTask/GetTaskById',
  Get_AllLanguages: '/TenantLanguage/GetAllLanguages',
  Get_All_Language_Text: '/TenantLanguage/GetAllLanguageText',
  Get_All_LookUps_Dropdown: '/POSLookUpLocalization/GetAllLookUpsDropdown',

  // Online orders (OnlineShopSaleOrderAppService)
  OnlineShopSaleOrder_GetAll: '/OnlineShopSaleOrder/GetAllOnlineShopSaleOrders',
  OnlineShopSaleOrder_GetDetail: '/OnlineShopSaleOrder/GetOnlineShopSaleOrderForSuccessPage',
  OnlineShopSaleOrder_GetStatusTimeline: '/OnlineShopSaleOrder/GetOnlineShopOrderStatusTimeline',
  OnlineShopSaleOrder_GetNextStatuses: '/OnlineShopSaleOrder/GetNextOrderStatusesDropdown',
  OnlineShopSaleOrder_GetRefundAccounts: '/OnlineShopSaleOrder/GetRefundAccountsDropdown',
  OnlineShopSaleOrder_UpdateStatus: '/OnlineShopSaleOrder/UpdateOnlineShopOrderStatus',
  OnlineShopSaleOrder_ConfirmCod: '/OnlineShopSaleOrder/ConfirmCashOnDeliveryOrder',
  OnlineShopSaleOrder_MarkCodPaid: '/OnlineShopSaleOrder/MarkCashOnDeliveryPaid',
  OnlineShopSaleOrder_Cancel: '/OnlineShopSaleOrder/CancelOnlineShopOrder',
  OnlineShopSaleOrder_GetShipment: '/OnlineShopSaleOrder/GetShipmentByOrderId',
  OnlineShopSaleOrder_GetDeliveryStatuses: '/OnlineShopSaleOrder/GetDeliveryStatusesForDropdown',
  OnlineShopSaleOrder_SaveShipment: '/OnlineShopSaleOrder/CreateOrUpdateShipment',
  OnlineShopSaleOrder_MarkDelivered: '/OnlineShopSaleOrder/MarkShipmentDelivered',
  OnlineShopShipment_SyncCourierShipments: '/OnlineShopShipment/SyncCourierShipments',
  Get_Online_Sale_Orders: '/OnlineOrder/GetOnlineSaleOrders',
  Get_Order_DeliveryStatus_For_Dropdown: '/OnlineOrder/GetOrderDeliveryStatusForDropdown',
  Change_Delivery_Order_Status: '/OnlineOrder/ChangeDeliveryOrderStatus',
  WhatsApp_UploadMedia: 'UploadFile/UploadWhatsAppMedia',

  // Online shop order status (OnlineShopStatusAppService)
  GetAllStatuses: '/OnlineShopStatus/GetAllStatuses',
  GetStatusForEdit: '/OnlineShopStatus/GetStatusForEdit',
  CreateStatus: '/OnlineShopStatus/CreateStatus',
  UpdateStatus: '/OnlineShopStatus/UpdateStatus',
  DeleteStatus: '/OnlineShopStatus/DeleteStatus',
  GetStatusDropdown: '/OnlineShopStatus/GetStatusDropdown',
  GetAllStatusMappingsDropdown: '/OnlineShopStatus/GetAllStatusMappingsDropdown',
  GetChildStatusesDropdownByCurrentStatusId:
    '/OnlineShopStatus/GetChildStatusesDropdownByCurrentStatusId',

  // Online shop status events (OnlineShopStatusEventAppService)
  StatusEvent_GetAll: '/OnlineShopStatusEvent/GetAll',
  StatusEvent_Create: '/OnlineShopStatusEvent/Create',
  StatusEvent_Update: '/OnlineShopStatusEvent/Update',
  StatusEvent_Delete: '/OnlineShopStatusEvent/Delete',
  GetStatusEventForEdit: '/OnlineShopStatusEvent/GetStatusEventForEdit',
  GetStatusEventsDropDown: '/OnlineShopStatusEvent/GetStatusEventsDropDown',

  // Online shop shipping (OnlineShopShippingAppService)
  Shipping_GetAllCountries: '/OnlineShopShipping/GetAllShippingCountries',
  Shipping_GetCountryForEdit: '/OnlineShopShipping/GetShippingCountryForEdit',
  Shipping_GetAvailableCountries: '/OnlineShopShipping/GetAvailableCountriesToSelect',
  Shipping_CreateCountries: '/OnlineShopShipping/CreateShippingCountries',
  Shipping_DeleteCountry: '/OnlineShopShipping/DeleteShippingCountry',
  Shipping_CreateOrUpdateRule: '/OnlineShopShipping/CreateOrUpdateShippingRule',
  Shipping_DeleteRule: '/OnlineShopShipping/DeleteShippingRule',

  // Online shop coupons (OnlineShopCouponAppService)
  Coupon_GetAll: '/OnlineShopCoupon/GetAll',
  Coupon_GetForEdit: '/OnlineShopCoupon/GetForEdit',
  Coupon_CreateOrUpdate: '/OnlineShopCoupon/CreateOrUpdate',
  Coupon_Delete: '/OnlineShopCoupon/Delete',
  Coupon_UpdateStatus: '/OnlineShopCoupon/UpdateStatus',

  // Online shop pages (OnlineShopPageAppService)
  Page_GetAll: '/OnlineShopPage/GetAll',
  Page_GetForEdit: '/OnlineShopPage/GetForEdit',
  Page_CreateOrUpdate: '/OnlineShopPage/CreateOrUpdate',
  Page_Delete: '/OnlineShopPage/Delete',
  Page_UpdateStatus: '/OnlineShopPage/UpdateStatus',
  Page_GetBySlug: '/OnlineShopPage/GetBySlug',
  Page_GetActivePages: '/OnlineShopPage/GetActivePages',
  Page_CreateDefaultPages: '/OnlineShopPage/CreateDefaultPages',
  Page_GetPageTemplates: '/OnlineShopPage/GetPageTemplates',

  // Customer support inbox (EmailSupportAppService)
  EmailSupport_GetInboxSummary: '/EmailSupport/GetInboxSummary',
  EmailSupport_GetMailboxConfigurations: '/EmailSupport/GetMailboxConfigurations',
  EmailSupport_SaveMailbox: '/EmailSupport/SaveMailbox',
  EmailSupport_SetMailboxActive: '/EmailSupport/SetMailboxActive',
  EmailSupport_AssignConversationToMailbox: '/EmailSupport/AssignConversationToMailbox',
  EmailSupport_GetConversations: '/EmailSupport/GetConversations',
  EmailSupport_GetConversation: '/EmailSupport/GetConversation',
  EmailSupport_Reply: '/EmailSupport/Reply',
  EmailSupport_SetReadState: '/EmailSupport/SetReadState',
  EmailSupport_Assign: '/EmailSupport/Assign',
  EmailSupport_ChangeStatus: '/EmailSupport/ChangeStatus',
  EmailSupport_GetAssignableUsers: '/EmailSupport/GetAssignableUsers',
  EmailSupport_DownloadAttachment: '/EmailSupport/DownloadAttachment',

  // Live chat (ChatAppService)
  Chat_GetChatHistory: '/Chat/GetChatHistory',
  Chat_GetConversations: '/Chat/GetConversations',
  Chat_GetSupportStatus: '/Chat/GetSupportStatus',
  ChatImage_Upload: '/ChatImageUpload/Upload',

  // Online shop settings (OnlineShopSettingsAppService)
  Settings_GetForEdit: '/OnlineShopSettings/GetForEdit',
  Settings_Save: '/OnlineShopSettings/Save',
  Settings_GetFlashipCouriersForAdmin: '/OnlineShopSettings/GetFlashipCouriersForAdmin',
  Settings_SaveCourierSettings: '/OnlineShopSettings/SaveCourierSettings',

  // Courier provider settings (OnlineShopCourierProviderAppService)
  CourierProvider_GetAll: '/OnlineShopCourierProvider/GetAllCourierProviders',
  CourierProvider_GetForEdit: '/OnlineShopCourierProvider/GetCourierProviderForEdit',
  CourierProvider_CreateOrUpdate: '/OnlineShopCourierProvider/CreateOrUpdateCourierProvider',
  CourierProvider_Delete: '/OnlineShopCourierProvider/DeleteCourierProvider',
  CourierProvider_EnableDisable: '/OnlineShopCourierProvider/EnableDisableCourierProvider',

  // Payment provider settings (OnlineShopPaymentProviderAppService)
  PaymentProvider_GetAll: '/OnlineShopPaymentProvider/GetAllPaymentProviders',
  PaymentProvider_GetForEdit: '/OnlineShopPaymentProvider/GetPaymentProviderForEdit',
  PaymentProvider_CreateOrUpdate: '/OnlineShopPaymentProvider/CreateOrUpdatePaymentProvider',
  PaymentProvider_Delete: '/OnlineShopPaymentProvider/DeletePaymentProvider',
  PaymentProvider_EnableDisable: '/OnlineShopPaymentProvider/EnableDisablePaymentProvider',
  PaymentProvider_SetDefault: '/OnlineShopPaymentProvider/SetDefaultPaymentProvider',

  // Store front header menu (OnlineShopHeaderMenuAppService)
  HeaderMenu_GetForEdit: '/OnlineShopHeaderMenu/GetForEdit',
  HeaderMenu_Save: '/OnlineShopHeaderMenu/Save',
  HeaderMenu_GetForStorefront: '/OnlineShopHeaderMenu/GetForStorefront',

  // POS products — admin grid (OnlineShopProductAppService)
  OnlineShopProduct_GetAllForAdmin: '/OnlineShopProduct/GetAllForAdmin',
  OnlineShopProduct_UpdateForAdmin: '/OnlineShopProduct/UpdateForAdmin',
  OnlineShopProduct_UploadImages: '/OnlineShopProductUpload/UploadImages',
  OnlineShopProduct_GetImages: '/OnlineShopProductUpload/GetImages',
  OnlineShopProduct_RemoveImage: '/OnlineShopProductUpload/RemoveImage',

  // Facebook Page product publishing (OnlineShopMetaPagePublishAppService)
  OnlineShopMetaPagePublish_GetDraft: '/OnlineShopMetaPagePublish/GetFacebookPostDraft',
  OnlineShopMetaPagePublish_GetHistory: '/OnlineShopMetaPagePublish/GetFacebookPostHistory',
  OnlineShopMetaPagePublish_Publish: '/OnlineShopMetaPagePublish/PublishFacebookPost',

  // Home page banners (OnlineShopHomeBannerUploadController)
  OnlineShopHomeBanner_GetBanners: '/OnlineShopHomeBannerUpload/GetBanners',
  OnlineShopHomeBanner_UploadBanners: '/OnlineShopHomeBannerUpload/UploadBanners',
  OnlineShopHomeBanner_RemoveBanner: '/OnlineShopHomeBannerUpload/RemoveBanner',
  OnlineShopHomeBanner_GetForStorefront: '/OnlineShopHomeBanner/GetHomeBannersForStorefront',

  // Store logo (OnlineShopStoreLogoUploadController / OnlineShopStoreLogoAppService)
  OnlineShopStoreLogo_GetLogo: '/OnlineShopStoreLogoUpload/GetLogo',
  OnlineShopStoreLogo_UploadLogo: '/OnlineShopStoreLogoUpload/UploadLogo',
  OnlineShopStoreLogo_RemoveLogo: '/OnlineShopStoreLogoUpload/RemoveLogo',
  OnlineShopStoreLogo_GetForStorefront: '/OnlineShopStoreLogo/GetLogoForStorefront',

  // POS product categories — admin grid (OnlineShopProductCategoryAppService)
  OnlineShopProductCategory_GetAllForAdmin: '/OnlineShopProductCategory/GetAllForAdmin',
  OnlineShopProductCategory_UpdateForAdmin: '/OnlineShopProductCategory/UpdateForAdmin',
  OnlineShopCategoryImage_Get: '/OnlineShopCategoryImageUpload/GetImage',
  OnlineShopCategoryImage_Upload: '/OnlineShopCategoryImageUpload/UploadImage',
  OnlineShopCategoryImage_Remove: '/OnlineShopCategoryImageUpload/RemoveImage',

  // POS brands — admin grid (OnlineShopBrandAppService)
  OnlineShopBrand_GetAllForAdmin: '/OnlineShopBrand/GetAllForAdmin',
  OnlineShopBrand_UpdateForAdmin: '/OnlineShopBrand/UpdateForAdmin',

  // Online shop brand images (OnlineShopBrandImageUploadController)
  OnlineShopBrandImage_Get: '/OnlineShopBrandImageUpload/GetImage',
  OnlineShopBrandImage_Upload: '/OnlineShopBrandImageUpload/UploadImage',
  OnlineShopBrandImage_Remove: '/OnlineShopBrandImageUpload/RemoveImage',

  // Store working area polygon (OnlineShopStoreWorkingLocationAppService)
  WorkingArea_CreateLocation: '/OnlineShopStoreWorkingLocation/CreateLocation',
  WorkingArea_GetCurrentStoreLocations: '/OnlineShopStoreWorkingLocation/GetCurrentStoreLocations',

  // Online shop reports (OnlineShopReportingAppService)
  OnlineShopReporting_GetSaleOrdersReport: '/OnlineShopReporting/GetSaleOrdersReport',
  OnlineShopReporting_GetProfitMarginReport: '/OnlineShopReporting/GetProfitMarginReport',
};
