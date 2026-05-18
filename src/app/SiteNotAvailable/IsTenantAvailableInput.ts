export interface IsTenantAvailableInput {
    tenancyName:string;
}



export interface TenantConfigurationInputDto {
    tenancyName:string;
    storeName:string;
    userNameOrEmailAddress:string;
    password:string;
}
