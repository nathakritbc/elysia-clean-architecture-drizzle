import { t } from 'elysia';
import { StatusDto } from '../../../core/shared/dtos/common.dto';

export const UserResponseDto = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: 'email' }),
  status: StatusDto,
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

export const SignUpRequestDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const SignInRequestDto = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const AuthResponseDto = t.Object({
  user: UserResponseDto,
  accessToken: t.String(),
  accessTokenExpiresAt: t.Date(),
  refreshTokenExpiresAt: t.Date(),
  csrf_token: t.String(),
});

export const RefreshResponseDto = AuthResponseDto;

export const ErrorResponseDto = t.Object({
  error: t.String(),
  message: t.String(),
});

export type SignUpRequestDtoType = typeof SignUpRequestDto;
export type SignInRequestDtoType = typeof SignInRequestDto;
export type AuthResponseDtoType = typeof AuthResponseDto;
export type ErrorResponseDtoType = typeof ErrorResponseDto;
export type UserResponseDtoType = typeof UserResponseDto;
export type RefreshResponseDtoType = typeof RefreshResponseDto;
