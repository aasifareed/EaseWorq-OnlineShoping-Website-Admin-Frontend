export interface StatusEventDto {
  id: string;
  event: string;
  currentStatusId?: string | null;
  currentStatusName?: string;
  newStatusId: string;
  newStatusName?: string;
  createdDate?: string;
}

export interface CreateOrEditStatusEventDto {
  id?: string | null;
  event: string;
  currentStatusId?: string | null;
  newStatusId: string;
}
