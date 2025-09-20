import { t } from 'elysia';
import { StatusDto } from '../../../core/shared/dtos/common.dto';
import { EStatus } from '../../../core/shared/status.enum';
// Base User DTO
export const UserDto = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
  status: StatusDto,
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

// Create User Request DTO
export const CreateUserRequestDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6, maxLength: 100 }),
});

// Create User Response DTO
export const CreateUserResponseDto = UserDto;

// Update User Request DTO
export const UpdateUserRequestDto = t.Object(
  {
    name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
    email: t.Optional(t.String({ format: 'email' })),
    password: t.Optional(t.String({ minLength: 6, maxLength: 100 })),
    status: t.Optional(StatusDto),
  },
  { additionalProperties: false }
);

// Update User Response DTO
export const UpdateUserResponseDto = UserDto;

// Delete User Response DTO
export const DeleteUserResponseDto = t.Object({
  success: t.Boolean(),
});

// Get User Response DTO (single user)
export const GetUserResponseDto = UserDto;

// Get Users Response DTO (array of users)
export const GetUsersResponseDto = t.Array(GetUserResponseDto);

// Error Response DTO
export const ErrorResponseDto = t.Object({
  name: t.String(),
  message: t.String(),
});

// Path Parameters DTO
export const UserIdParamsDto = t.Object({
  id: t.String(),
});

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  password: string;
  status: EStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type exports for TypeScript
export type UserDtoType = typeof UserDto;
export type CreateUserRequestDtoType = typeof CreateUserRequestDto;
export type CreateUserResponseDtoType = typeof CreateUserResponseDto;
export type UpdateUserRequestDtoType = typeof UpdateUserRequestDto;
export type UpdateUserResponseDtoType = typeof UpdateUserResponseDto;
export type DeleteUserResponseDtoType = typeof DeleteUserResponseDto;
export type GetUserResponseDtoType = typeof GetUserResponseDto;
export type GetUsersResponseDtoType = typeof GetUsersResponseDto;
export type ErrorResponseDtoType = typeof ErrorResponseDto;
export type UserIdParamsDtoType = typeof UserIdParamsDto;
