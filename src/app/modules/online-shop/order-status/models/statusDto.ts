export interface StatusDto {
  id?: string;
  statusCode: string;
  colorCode?: string;
  statusName: string;
  displayName: string;
  orderNumber: string | number;
  description?: string;
  childStatusIds?: string[];
  isSystem?: boolean;
  createdDate?: string;
}
