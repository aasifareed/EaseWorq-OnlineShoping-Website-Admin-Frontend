/** API paths used by the online shop admin app (appended to apiBaseUrl). */
export const appServiceUrls = {
  // Auth & user
  USER_GETBYID: '/User/GetUserById',
  get_User_Store_By_UserId: '/User/getUserStoreByUserId',
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
  OnlineShopSaleOrder_GetNextStatuses: '/OnlineShopSaleOrder/GetNextOrderStatusesDropdown',
  OnlineShopSaleOrder_UpdateStatus: '/OnlineShopSaleOrder/UpdateOnlineShopOrderStatus',
  OnlineShopSaleOrder_ConfirmCod: '/OnlineShopSaleOrder/ConfirmCashOnDeliveryOrder',
  OnlineShopSaleOrder_MarkCodPaid: '/OnlineShopSaleOrder/MarkCashOnDeliveryPaid',
  OnlineShopSaleOrder_Cancel: '/OnlineShopSaleOrder/CancelOnlineShopOrder',
  OnlineShopSaleOrder_GetShipment: '/OnlineShopSaleOrder/GetShipmentByOrderId',
  OnlineShopSaleOrder_SaveShipment: '/OnlineShopSaleOrder/CreateOrUpdateShipment',
  OnlineShopSaleOrder_MarkDelivered: '/OnlineShopSaleOrder/MarkShipmentDelivered',
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

  // Online shop settings (OnlineShopSettingsAppService)
  Settings_GetForEdit: '/OnlineShopSettings/GetForEdit',
  Settings_Save: '/OnlineShopSettings/Save',

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

  // POS product categories — admin grid (OnlineShopProductCategoryAppService)
  OnlineShopProductCategory_GetAllForAdmin: '/OnlineShopProductCategory/GetAllForAdmin',
  OnlineShopProductCategory_UpdateForAdmin: '/OnlineShopProductCategory/UpdateForAdmin',

  // POS brands — admin grid (OnlineShopBrandAppService)
  OnlineShopBrand_GetAllForAdmin: '/OnlineShopBrand/GetAllForAdmin',
  OnlineShopBrand_UpdateForAdmin: '/OnlineShopBrand/UpdateForAdmin',
};
