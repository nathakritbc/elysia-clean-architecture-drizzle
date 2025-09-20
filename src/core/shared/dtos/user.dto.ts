import { t } from "elysia";

// Base User DTO
export const UserDto = t.Object({
  id: t.Optional(t.String()),
  name: t.String(),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
  status: t.Optional(t.String()),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

// Create User Request DTO
export const CreateUserRequestDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6, maxLength: 100 }),
});

// Create User Response DTO
export const CreateUserResponseDto = t.Object({
  status: t.Number(),
  body: t.Object({
    message: t.String(),
  }),
});

// Get User Response DTO (single user)
export const GetUserResponseDto = t.Object({
  id: t.Optional(t.String()),
  name: t.String(),
  email: t.String({ format: "email" }),
  password: t.String(),
  status: t.Optional(t.String()),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

// Get Users Response DTO (array of users)
export const GetUsersResponseDto = t.Array(GetUserResponseDto);

// Error Response DTO
export const ErrorResponseDto = t.Object({
  name: t.String(),
  message: t.String(),
});

// Path Parameters DTO
export const UserIdParamsDto = t.Object({
  id: t.Number(),
});

export interface UserResponseDto {
  id?: string;
  name: string;
  email: string;
  password: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type exports for TypeScript
export type UserDtoType = typeof UserDto;
export type CreateUserRequestDtoType = typeof CreateUserRequestDto;
export type CreateUserResponseDtoType = typeof CreateUserResponseDto;
export type GetUserResponseDtoType = typeof GetUserResponseDto;
export type GetUsersResponseDtoType = typeof GetUsersResponseDto;
export type ErrorResponseDtoType = typeof ErrorResponseDto;
export type UserIdParamsDtoType = typeof UserIdParamsDto;
