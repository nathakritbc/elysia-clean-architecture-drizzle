import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';

import { ConflictError } from '@shared/errors/error-mapper';
import type { BUserName, IUser, UserEmail, UserPassword } from '@modules/accounts/domain/entities/user.entity';
import { UserRepository } from '@modules/accounts/domain/ports/user.repository';
import type { RefreshTokenExpiresAt, RefreshTokenHash, RefreshTokenJti } from '@modules/auth/domain/entities/refresh-token.entity';
import { AuthTokenService, GeneratedAuthTokens } from '@modules/auth/domain/ports/auth-token.service';
import type { AccessTokenExpiresAt } from '@modules/auth/domain/ports/auth-token.service';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { SignUpUseCase } from '@modules/auth/application/use-cases/sign-up.usecase';

const toUserInput = () => ({
  name: 'Jane Doe' as BUserName,
  email: 'jane@example.com' as UserEmail,
  password: 'StrongPassword123' as UserPassword,
});

describe('SignUpUseCase', () => {
  const userRepository = mock<UserRepository>();
  const refreshTokenRepository = mock<RefreshTokenRepository>();
  const authTokenService = mock<AuthTokenService>();

  let useCase: SignUpUseCase;

  beforeEach(() => {
    mockReset(userRepository);
    mockReset(refreshTokenRepository);
    mockReset(authTokenService);
    useCase = new SignUpUseCase(userRepository, refreshTokenRepository, authTokenService);
  });

  const generatedTokens: GeneratedAuthTokens = {
    accessToken: 'access-token',
    accessTokenExpiresAt: new Date() as AccessTokenExpiresAt,
    refreshToken: 'refresh-token',
    refreshTokenHash: 'hashed-refresh-token' as RefreshTokenHash,
    refreshTokenExpiresAt: new Date() as RefreshTokenExpiresAt,
    jti: 'token-jti' as RefreshTokenJti,
  };

  it('creates a new user when email is not taken', async () => {
    const input = toUserInput();
    const createdUser = mock<IUser>();
    createdUser.hiddenPassword.mockImplementation(() => undefined);

    userRepository.getByEmail.mockResolvedValue(undefined);
    userRepository.create.mockResolvedValue(createdUser);
    authTokenService.generateTokens.mockResolvedValue(generatedTokens);

    const result = await useCase.execute(input);

    expect(userRepository.getByEmail).toHaveBeenCalledWith(input.email);
    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(authTokenService.generateTokens).toHaveBeenCalledWith(createdUser);
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        jti: generatedTokens.jti,
        tokenHash: generatedTokens.refreshTokenHash,
        expiresAt: generatedTokens.refreshTokenExpiresAt,
      })
    );
    expect(createdUser.hiddenPassword).toHaveBeenCalled();
    expect(result).toEqual({ user: createdUser, tokens: generatedTokens });
  });

  it('throws conflict error when email already exists', async () => {
    const existingUser = mock<IUser>();
    userRepository.getByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute(toUserInput())).rejects.toBeInstanceOf(ConflictError);
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(authTokenService.generateTokens).not.toHaveBeenCalled();
  });
});
