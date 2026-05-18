export enum PermissionsEnum {


    User = 'Admin.User',
    USER_VIEW = 'USER_VIEW',
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',

    Admin = 'Admin',

  ViewAuditLog = 'ViewAuditLog',
  
  // Point Of Sale Module Permissions
  ViewPOSMenu='ViewPOSMenu',

  // Impersonation Management Module
  ImpersonationManagement = 'ImpersonationManagement',
  ImpersonationManagement_Feature = 'ImpersonationManagement.Feature',
  ImpersonationManagement_Permission = 'ImpersonationManagement.Permission',
  ImpersonationManagement_Language = 'ImpersonationManagement.Language',
  ImpersonationManagement_LanguageText = 'ImpersonationManagement.LanguageText',

  Roles = 'Admin.Roles',
  Permissions = 'Admin.Permission',

  // Dashboard Management Module
  DashboardManagement = 'DashboardManagement',
  Dashboard = 'DashboardManagement.Dashboard',
  
  // Expense Management Module
  ExpenseManagement = 'ExpenseManagement',
  ExpenseList = 'ExpenseManagement.ExpenseList',
  ExpenseList_View = 'ExpenseManagement.ExpenseList.View',
  ExpenseList_Create = 'ExpenseManagement.ExpenseList.Create',
  ExpenseList_Update = 'ExpenseManagement.ExpenseList.Update',
  ExpenseList_Delete = 'ExpenseManagement.ExpenseList.Delete',
  ExpenseType = 'ExpenseManagement.ExpenseType',
  ExpenseType_View = 'ExpenseManagement.ExpenseType.View',
  ExpenseType_Create = 'ExpenseManagement.ExpenseType.Create',
  ExpenseType_Update = 'ExpenseManagement.ExpenseType.Update',
  ExpenseType_Delete = 'ExpenseManagement.ExpenseType.Delete',
  
  // Stock Management Module
  StockManagement = 'StockManagement',
  ProductStockInStore = 'StockManagement.ProductStockInStore',
  ProductStockInStore_View = 'StockManagement.ProductStockInStore.View',
  ProductStockInStore_RestockToStore = 'StockManagement.ProductStockInStore.RestockToStore',
  ProductStockInStore_RestockToWarehouse = 'StockManagement.ProductStockInStore.RestockToWarehouse',
  ProductStockInWarehouse = 'StockManagement.ProductStockInWarehouse',
  ProductStockInWarehouse_View = 'StockManagement.ProductStockInWarehouse.View',
  ProductStockInWarehouse_RestockToStore = 'StockManagement.ProductStockInWarehouse.RestockToStore',
  
  // Order History Management Module
  OrderHistoryManagement = 'OrderHistoryManagement',
  SaleOrderHistory = 'OrderHistoryManagement.SaleOrderHistory',
  SaleOrderHistory_View = 'OrderHistoryManagement.SaleOrderHistory.View',
  PurchaseOrderHistory = 'OrderHistoryManagement.PurchaseOrderHistory',
  PurchaseOrderHistory_View = 'OrderHistoryManagement.PurchaseOrderHistory.View',
  
  // Accounting Management Module
  AccountingManagement = 'AccountingManagement',
  Accounts = 'AccountingManagement.Accounts',
  Accounts_View = 'AccountingManagement.Accounts.View',
  Accounts_Create = 'AccountingManagement.Accounts.Create',
  Accounts_Update = 'AccountingManagement.Accounts.Update',
  Deposits = 'AccountingManagement.Deposits',
  Deposits_View = 'AccountingManagement.Deposits.View',
  Deposits_Create = 'AccountingManagement.Deposits.Create',
  Deposits_Update = 'AccountingManagement.Deposits.Update',
  Deposits_Delete = 'AccountingManagement.Deposits.Delete',
  Transfers = 'AccountingManagement.Transfers',
  Transfers_View = 'AccountingManagement.Transfers.View',
  Transfers_Create = 'AccountingManagement.Transfers.Create',
  Transfers_Update = 'AccountingManagement.Transfers.Update',
  Transfers_Delete = 'AccountingManagement.Transfers.Delete',
  Transactions = 'AccountingManagement.Transactions',
  Transactions_View = 'AccountingManagement.Transactions.View',

  LedgerManagement = 'LedgerManagement',
  LedgerManagement_View = 'LedgerManagement.View',
  
  // Master Categories Management Module
  MasterCategoriesManagement = 'AllCategoriesManagement',
  AvailableProduct = 'MasterCategoriesManagement.AvailableProduct',
  AvailableProduct_View = 'MasterCategoriesManagement.AvailableProduct.View',
  AvailableProduct_Update = 'MasterCategoriesManagement.AvailableProduct.Update',
  AvailableProduct_AddQuantity = 'MasterCategoriesManagement.AvailableProduct.AddQuantity',
  Products = 'MasterCategoriesManagement.Products',
  Products_View = 'MasterCategoriesManagement.Products.View',
  Products_Create = 'MasterCategoriesManagement.Products.Create',
  Products_Update = 'MasterCategoriesManagement.Products.Update',
  Brands = 'MasterCategoriesManagement.Brands',
  Brands_View = 'MasterCategoriesManagement.Brands.View',
  Brands_Create = 'MasterCategoriesManagement.Brands.Create',
  Brands_Update = 'MasterCategoriesManagement.Brands.Update',
  Category = 'MasterCategoriesManagement.Category',
  Category_View = 'MasterCategoriesManagement.Category.View',
  Category_Create = 'MasterCategoriesManagement.Category.Create',
  Category_Update = 'MasterCategoriesManagement.Category.Update',
  Vendors = 'MasterCategoriesManagement.Vendors',
  Vendors_View = 'MasterCategoriesManagement.Vendors.View',
  Vendors_Create = 'MasterCategoriesManagement.Vendors.Create',
  Vendors_Update = 'MasterCategoriesManagement.Vendors.Update',
  Customers = 'MasterCategoriesManagement.Customers',
  Customers_View = 'MasterCategoriesManagement.Customers.View',
  Customers_Create = 'MasterCategoriesManagement.Customers.Create',
  Customers_Update = 'MasterCategoriesManagement.Customers.Update',
  Warehouse = 'MasterCategoriesManagement.Warehouse',
  Warehouse_View = 'MasterCategoriesManagement.Warehouse.View',
  Warehouse_Create = 'MasterCategoriesManagement.Warehouse.Create',
  Warehouse_Update = 'MasterCategoriesManagement.Warehouse.Update',
  LowStock = 'MasterCategoriesManagement.LowStock',
  LowStock_View = 'MasterCategoriesManagement.LowStock.View',
  
  // Purchase Order Management Module
  PurchaseOrderManagement = 'PurchaseOrderManagement',
  PurchaseOrders = 'PurchaseOrderManagement.PurchaseOrders',
  PurchaseProduct = 'PurchaseOrderManagement.PurchaseProduct',
  
  // Return Order Management Module
  ReturnOrderManagement = 'ReturnOrderManagement',
  ReturnSaleOrders = 'ReturnOrderManagement.ReturnSaleOrders',
  ReturnSaleOrders_View = 'ReturnOrderManagement.ReturnSaleOrders.View',
  ReturnSaleOrders_CreateReturnOrder = 'ReturnOrderManagement.ReturnSaleOrders.CreateReturnOrder',
  ReturnPurchaseOrders = 'ReturnOrderManagement.ReturnPurchaseOrders',
  ReturnPurchaseOrders_View = 'ReturnOrderManagement.ReturnPurchaseOrders.View',
  ReturnPurchaseOrders_CreateReturnOrder = 'ReturnOrderManagement.ReturnPurchaseOrders.CreateReturnOrder',
  ReturnPurchaseOrders_WarehouseReturn = 'ReturnOrderManagement.ReturnPurchaseOrders.WarehouseReturn',

  // Reports Management Module
  ReportsManagement = 'ReportsManagement',
  TillReport = 'ReportsManagement.TillReport',
  TillReport_View = 'ReportsManagement.TillReport.View',
  StoreCashFlowReport = 'ReportsManagement.StoreCashFlowReport',
  StoreCashFlowReport_View = 'ReportsManagement.StoreCashFlowReport.View',
  PurchaseOrderReport = 'ReportsManagement.PurchaseOrderReport',
  PurchaseOrderReport_View = 'ReportsManagement.PurchaseOrderReport.View',
  SaleOrderReport = 'ReportsManagement.SaleOrderReport',
  SaleOrderReport_View = 'ReportsManagement.SaleOrderReport.View',
  ProfitMarginReport = 'ReportsManagement.ProfitMarginReport',
  ProfitMarginReport_View = 'ReportsManagement.ProfitMarginReport.View',
  CustomerReport = 'ReportsManagement.CustomerReport',
  CustomerReport_View = 'ReportsManagement.CustomerReport.View',
  UserReport = 'ReportsManagement.UserReport',
  UserReport_View = 'ReportsManagement.UserReport.View',
  ReturnSaleOrderReport = 'ReportsManagement.ReturnSaleOrderReport',
  ReturnSaleOrderReport_View = 'ReportsManagement.ReturnSaleOrderReport.View',
  ReturnPurchaseOrderReport = 'ReportsManagement.ReturnPurchaseOrderReport',
  ReturnPurchaseOrderReport_View = 'ReportsManagement.ReturnPurchaseOrderReport.View',

  // Make Sale Management Module
  MakeSaleManagement = 'MakeSaleManagement',
  MakeSale = 'MakeSaleManagement.MakeSale',
  MakeSale_SaleTax = 'MakeSaleManagement.SaleTax',
  MakeSale_Discount = 'MakeSaleManagement.Discount',
  MakeSale_HoldOrders = 'MakeSaleManagement.HoldOrders',
  MakeSale_CreateHoldOrders = 'MakeSaleManagement.CreateHoldOrders',
  MakeSale_EstimateOrders = 'MakeSaleManagement.EstimateOrders',
  MakeSale_CreateEstimateOrders = 'MakeSaleManagement.CreateEstimateOrders',
  MakeSale_TillDeposit = 'MakeSaleManagement.TillDeposit',
  
  // Payable And Receivable Tracker Management Module
  PayableAndReceivableTrackerManagement = 'PayableAndReceivableTrackerManagement',
  Payable = 'PayableAndReceivableTrackerManagement.Payable',
  Payable_View = 'PayableAndReceivableTrackerManagement.Payable.View',
  Payable_Pay = 'PayableAndReceivableTrackerManagement.Payable.Pay',
  Receivable = 'PayableAndReceivableTrackerManagement.Receivable',
  Receivable_View = 'PayableAndReceivableTrackerManagement.Receivable.View',
  Receivable_Receive = 'PayableAndReceivableTrackerManagement.Receivable.Receive',
  
  // Damage Or Lost Item Management Module
  DamageOrLostItemManagement = 'DamageOrLostItemManagement',
  DamageOrLostItem = 'DamageOrLostItemManagement.DamageOrLostItem',
  DamageOrLostItem_View = 'DamageOrLostItemManagement.DamageOrLostItem.View',
  DamageOrLostItem_Create = 'DamageOrLostItemManagement.DamageOrLostItem.Create',
  DamageOrLostItem_Update = 'DamageOrLostItemManagement.DamageOrLostItem.Update',
  
  // IMEI Inventory Module (standalone device registry)
  ImeiInventoryManagement = 'ImeiInventoryManagement',
  ImeiInventory = 'ImeiInventoryManagement.ImeiRecords',
  ImeiInventory_View = 'ImeiInventoryManagement.ImeiRecords.View',
  ImeiInventory_Create = 'ImeiInventoryManagement.ImeiRecords.Create',
  ImeiInventory_Update = 'ImeiInventoryManagement.ImeiRecords.Update',
  ImeiInventory_Delete = 'ImeiInventoryManagement.ImeiRecords.Delete',
  
  // Item Placement Management Module
  ItemPlacementManagement = 'ItemPlacementManagement',
  Section = 'ItemPlacementManagement.Section',
  Section_View = 'ItemPlacementManagement.Section.View',
  Section_Create = 'ItemPlacementManagement.Section.Create',
  Section_Update = 'ItemPlacementManagement.Section.Update',
  SectionRowNumber = 'ItemPlacementManagement.SectionRowNumber',
  SectionRowNumber_View = 'ItemPlacementManagement.SectionRowNumber.View',
  SectionRowNumber_Create = 'ItemPlacementManagement.SectionRowNumber.Create',
  SectionRowNumber_Update = 'ItemPlacementManagement.SectionRowNumber.Update',
  SectionRowCabonNumber = 'ItemPlacementManagement.SectionRowCabonNumber',
  SectionRowCabonNumber_View = 'ItemPlacementManagement.SectionRowCabonNumber.View',
  SectionRowCabonNumber_Create = 'ItemPlacementManagement.SectionRowCabonNumber.Create',
  SectionRowCabonNumber_Update = 'ItemPlacementManagement.SectionRowCabonNumber.Update',
  ProductPlacement = 'ItemPlacementManagement.ProductPlacement',
  ProductPlacement_View = 'ItemPlacementManagement.ProductPlacement.View',
  ProductPlacement_Create = 'ItemPlacementManagement.ProductPlacement.Create',
  ProductPlacement_Update = 'ItemPlacementManagement.ProductPlacement.Update',
  
  // Claims Management Module
  ClaimsManagement = 'ClaimsManagement',
  Claims = 'ClaimsManagement.Claims',
  Claims_View = 'ClaimsManagement.Claims.View',
  Claims_ReturnClaim = 'ClaimsManagement.Claims.ReturnClaim',
  Claims_Update = 'ClaimsManagement.Claims.Update',
  
  // Online Order Management Module
  OnlineOrderManagement = 'OnlineOrderManagement',
  OnlineOrder = 'OnlineOrderManagement.OnlineOrder',

  // Capital Management Module
  CapitalManagement = 'CapitalManagement',
  CapitalManagement_Dashboard = 'CapitalManagement.Dashboard',
  CapitalManagement_Partners = 'CapitalManagement.Partners',
  CapitalManagement_Partners_View = 'CapitalManagement.Partners.View',
  CapitalManagement_Partners_Create = 'CapitalManagement.Partners.Create',
  CapitalManagement_Partners_Update = 'CapitalManagement.Partners.Update',
  CapitalManagement_Transactions = 'CapitalManagement.Transactions',
  CapitalManagement_Transactions_View = 'CapitalManagement.Transactions.View',
  CapitalManagement_Transactions_Create = 'CapitalManagement.Transactions.Create',
  CapitalManagement_Transactions_Update = 'CapitalManagement.Transactions.Update',
  CapitalManagement_Assets = 'CapitalManagement.Assets',
  CapitalManagement_Assets_View = 'CapitalManagement.Assets.View',
  CapitalManagement_Assets_Create = 'CapitalManagement.Assets.Create',
  CapitalManagement_Assets_Update = 'CapitalManagement.Assets.Update',
  CapitalManagement_Ledger = 'CapitalManagement.Ledger',
  CapitalManagement_Ledger_View = 'CapitalManagement.Ledger.View',

  // Till Management Management Module
  TillManagementManagement = 'TillManagementManagement',
  Tills = 'TillManagementManagement.Tills',
  Tills_View = 'TillManagementManagement.Tills.View',
  Tills_Create = 'TillManagementManagement.Tills.Create',
  Tills_Update = 'TillManagementManagement.Tills.Update',
  Tills_AssignUser = 'TillManagementManagement.Tills.AssignUser',
  Tills_AssignAccounts = 'TillManagementManagement.Tills.AssignAccounts',
  CompanyCashFlow = 'TillManagementManagement.CompanyCashFlow',
  CompanyCashFlow_View = 'TillManagementManagement.CompanyCashFlow.View',
  CompanyCashFlow_SubmittedToCompany = 'TillManagementManagement.CompanyCashFlow.SubmittedToCompany',
  CompanyCashInHand = 'TillManagementManagement.CompanyCashInHand',
  CompanyCashInHand_View = 'TillManagementManagement.CompanyCashInHand.View',
  CompanyCashInHand_DepositToCompanyCash = 'TillManagementManagement.CompanyCashInHand.DepositToCompanyCash',
  StoreCashFlow = 'TillManagementManagement.StoreCashFlow',
  StoreCashFlow_View = 'TillManagementManagement.StoreCashFlow.View',
  StoreCashFlow_Deposit = 'TillManagementManagement.StoreCashFlow.Deposit',
  StoreCashFlow_Withdraw = 'TillManagementManagement.StoreCashFlow.Withdraw',
  StoreCashInHand = 'TillManagementManagement.StoreCashInHand',
  StoreCashInHand_View = 'TillManagementManagement.StoreCashInHand.View',
  CanDepositTillCash = 'TillManagementManagement.CanDepositTillCash',
  CanTillTransfer = 'MakeSaleManagement.CanTillTransfer',
  
  // Orders Map Dashboard Management Module
  OrdersMapDashboardManagement = 'OrdersMapDashboardManagement',
  OrdersMapDashboard = 'OrdersMapDashboardManagement.OrdersMapDashboard',

  // General Setting Management Module
  MGeneralSettingManagement = 'MGeneralSettingManagement',
  CanWebLogin = 'MGeneralSettingManagement.CanWebLogin',

  // Setting Management Module
  SettingManagement = 'SettingManagement',
  
  // General Setting
  GeneralSetting = 'SettingManagement.GeneralSetting',
  GeneralSetting_View = 'SettingManagement.GeneralSetting.View',
  GeneralSetting_Update = 'SettingManagement.GeneralSetting.Update',
  
  // Company Detail
  CompanyDetail = 'SettingManagement.CompanyDetail',
  CompanyDetail_View = 'SettingManagement.CompanyDetail.View',
  CompanyDetail_Update = 'SettingManagement.CompanyDetail.Update',
  
  // System
  System = 'SettingManagement.System',
  System_View = 'SettingManagement.System.View',
  System_Update = 'SettingManagement.System.Update',
  
  // Email
  Email = 'SettingManagement.Email',
  Email_View = 'SettingManagement.Email.View',
  Email_Update = 'SettingManagement.Email.Update',
  
  // Custom Localization
  CustomLocalization = 'SettingManagement.CustomLocalization',
  CustomLocalization_View = 'SettingManagement.CustomLocalization.View',
  CustomLocalization_Update = 'SettingManagement.CustomLocalization.Update',
  CustomLocalization_Translate = 'SettingManagement.CustomLocalization.Translate',
  
  // Lookups Localization
  LookupsLocalization = 'SettingManagement.LookupsLocalization',
  LookupsLocalization_View = 'SettingManagement.LookupsLocalization.View',
  LookupsLocalization_Update = 'SettingManagement.LookupsLocalization.Update',
  
  // Tax
  Tax = 'SettingManagement.Tax',
  Tax_View = 'SettingManagement.Tax.View',
  Tax_Create = 'SettingManagement.Tax.Create',
  Tax_Update = 'SettingManagement.Tax.Update',
  
  // Payment Method
  PaymentMethod = 'SettingManagement.PaymentMethod',
  PaymentMethod_View = 'SettingManagement.PaymentMethod.View',
  PaymentMethod_EnableDisable = 'SettingManagement.PaymentMethod.EnableDisable',
  
  // Order Status Type
  OrderStatusType = 'SettingManagement.OrderStatusType',
  OrderStatusType_View = 'SettingManagement.OrderStatusType.View',
  OrderStatusType_EnableDisable = 'SettingManagement.OrderStatusType.EnableDisable',
  
  // Measurement Unit
  MeasurementUnitSetting = 'SettingManagement.MeasurementUnit',
  MeasurementUnitSetting_View = 'SettingManagement.MeasurementUnit.View',
  MeasurementUnitSetting_Create = 'SettingManagement.MeasurementUnit.Create',
  MeasurementUnitSetting_Update = 'SettingManagement.MeasurementUnit.Update',
  
  // Email / Sms Template
  EmailSmsTemplate = 'SettingManagement.EmailSmsTemplate',
  EmailSmsTemplate_View = 'SettingManagement.EmailSmsTemplate.View',
  EmailSmsTemplate_Update = 'SettingManagement.EmailSmsTemplate.Update',


}


