import { t } from 'elysia';

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

// Type exports
export type SuccessResponseDTOType = typeof SuccessResponseDTO;
export type CommonErrorResponseDTOType = typeof CommonErrorResponseDTO;
export type ValidationErrorResponseDTOType = typeof ValidationErrorResponseDTO;
