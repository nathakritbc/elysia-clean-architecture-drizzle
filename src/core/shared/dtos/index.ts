// Export all DTOs for easy importing
export * from './user.dto';
export * from './common.dto';

// Re-export commonly used types
export type {
  UserDtoType as UserDTOType,
  CreateUserRequestDtoType as CreateUserRequestDTOType,
  CreateUserResponseDtoType as CreateUserResponseDTOType,
  GetUserResponseDtoType as GetUserResponseDTOType,
  GetUsersResponseDtoType as GetUsersResponseDTOType,
  ErrorResponseDtoType as ErrorResponseDTOType,
  UserIdParamsDtoType as UserIdParamsDTOType,
} from './user.dto';

export type { SuccessResponseDTOType, CommonErrorResponseDTOType, ValidationErrorResponseDTOType } from './common.dto';
