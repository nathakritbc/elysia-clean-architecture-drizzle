import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';
import { SignInUseCase } from './sign-in.usecase';
import { UserRepository } from '../../users/service/user.repository';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { AuthTokenService } from '../service/auth-token.service';
import type { IUser, UserEmail, UserPassword } from '../../users/entity/user.entity';
import type { RefreshTokenHash, RefreshTokenExpiresAt, RefreshTokenJti } from '../entity/refresh-token.entity';
import type { AccessTokenExpiresAt } from '../service/auth-token.service';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';

const toInput = () => ({
  email: 'john@example.com' as UserEmail,
  password: 'SecurePass123' as UserPassword,
});

describe('SignInUseCase', () => {
  const userRepository = mock<UserRepository>();
  const refreshTokenRepository = mock<RefreshTokenRepository>();
  const authTokenService = mock<AuthTokenService>();

  let useCase: SignInUseCase;

  const generatedTokens = {
    accessToken: 'access-token',
    accessTokenExpiresAt: new Date() as AccessTokenExpiresAt,
    refreshToken: 'refresh-token',
    refreshTokenHash: 'hashed-refresh-token' as RefreshTokenHash,
    refreshTokenExpiresAt: new Date() as RefreshTokenExpiresAt,
    jti: 'token-jti' as RefreshTokenJti,
  };

  beforeEach(() => {
    mockReset(userRepository);
    mockReset(refreshTokenRepository);
    mockReset(authTokenService);
    useCase = new SignInUseCase(userRepository, refreshTokenRepository, authTokenService);
  });

  it('throws unauthorized if user does not exist', async () => {
    userRepository.getByEmail.mockResolvedValue(undefined);

    await expect(useCase.execute(toInput())).rejects.toBeInstanceOf(UnauthorizedError);
    expect(authTokenService.generateTokens).not.toHaveBeenCalled();
  });

  it('throws unauthorized if password is invalid', async () => {
    const user = mock<IUser>();
    user.comparePassword.mockResolvedValue(false);
    userRepository.getByEmail.mockResolvedValue(user);

    await expect(useCase.execute(toInput())).rejects.toBeInstanceOf(UnauthorizedError);
    expect(authTokenService.generateTokens).not.toHaveBeenCalled();
  });

  it('returns tokens when credentials are valid', async () => {
    const input = toInput();
    const user = mock<IUser>();
    user.comparePassword.mockResolvedValue(true);
    user.hiddenPassword.mockImplementation(() => undefined);
    userRepository.getByEmail.mockResolvedValue(user);
    authTokenService.generateTokens.mockResolvedValue(generatedTokens);

    const result = await useCase.execute(input);

    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalled();
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        jti: generatedTokens.jti,
        tokenHash: generatedTokens.refreshTokenHash,
        expiresAt: generatedTokens.refreshTokenExpiresAt,
      })
    );
    expect(user.hiddenPassword).toHaveBeenCalled();
    expect(result).toEqual({ user, tokens: generatedTokens });
  });
});
