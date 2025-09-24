import { t } from 'elysia';

import { EStatus } from '../status.enum';

// Common Success Response DTO
export const SuccessResponseDTO = t.Object({
  status: t.Number(),
  body: t.Object({
    message: t.String(),
  }),
});

// Common Error Response DTO
export const CommonErrorResponseDTO = t.Object({
  name: t.String(),
  message: t.String(),
  cause: t.Optional(t.Any()),
});

// Validation Error Response DTO
export const ValidationErrorResponseDTO = t.Object({
  name: t.String(),
  message: t.String(),
  validation: t.Object({
    field: t.String(),
    value: t.Any(),
    error: t.String(),
  }),
});

export const StatusDto = t.Enum(EStatus);

export const GetAllParamsDto = t.Object({
  search: t.Optional(t.String()),
  sort: t.Optional(t.String()),
  order: t.Optional(t.String()),
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
});

export const GetAllMetaDto = t.Object({
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
});

// Type exports
export type CommonErrorResponseDTOType = typeof CommonErrorResponseDTO;
export type GetAllMetaDtoType = typeof GetAllMetaDto;
export type GetAllParamsDtoType = typeof GetAllParamsDto;
export type StatusDtoType = typeof StatusDto;
export type SuccessResponseDTOType = typeof SuccessResponseDTO;
export type ValidationErrorResponseDTOType = typeof ValidationErrorResponseDTO;
