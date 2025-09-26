import { Brand } from './branded.type';
import { EStatus } from './status.enum';

export type Id = Brand<number, 'Id'>;
export type CreatedAt = Brand<Date, 'CreatedAt'>;
export type Status = Brand<EStatus, 'Status'>;
export type UpdatedAt = Brand<Date, 'UpdatedAt'>;

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface GetAllParamsType {
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface GetAllMetaType {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
