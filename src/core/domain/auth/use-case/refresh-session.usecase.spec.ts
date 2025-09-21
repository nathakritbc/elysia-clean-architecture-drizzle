import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';
import { RefreshSessionUseCase } from './refresh-session.usecase';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { UserRepository } from '../../users/service/user.repository';
import { AuthTokenService } from '../service/auth-token.service';
import type {
  IRefreshToken,
  RefreshTokenJti,
  RefreshTokenHash,
  RefreshTokenExpiresAt,
  RefreshTokenPlain,
} from '../entity/refresh-token.entity';
import type { IUser, UserId } from '../../users/entity/user.entity';
import type { AccessTokenExpiresAt } from '../service/auth-token.service';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';

const refreshTokenString = 'token-jti.random-secret';

describe('RefreshSessionUseCase', () => {
  const refreshTokenRepository = mock<RefreshTokenRepository>();
  const userRepository = mock<UserRepository>();
  const authTokenService = mock<AuthTokenService>();

  let useCase: RefreshSessionUseCase;

  const generatedTokens = {
    accessToken: 'access-token',
    accessTokenExpiresAt: new Date() as AccessTokenExpiresAt,
    refreshToken: 'new-refresh-token',
    refreshTokenHash: 'new-refresh-hash' as RefreshTokenHash,
    refreshTokenExpiresAt: new Date() as RefreshTokenExpiresAt,
    jti: 'new-token-jti' as RefreshTokenJti,
  };

  beforeEach(() => {
    mockReset(refreshTokenRepository);
    mockReset(userRepository);
    mockReset(authTokenService);
    useCase = new RefreshSessionUseCase(refreshTokenRepository, userRepository, authTokenService);
  });

  it('throws unauthorized if refresh token not found', async () => {
    refreshTokenRepository.findByJti.mockResolvedValue(undefined);

    await expect(useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });

  it('rotates token when refresh token is valid', async () => {
    const storedToken = mock<IRefreshToken>();
    storedToken.isRevoked.mockReturnValue(false);
    storedToken.isExpired.mockReturnValue(false);
    storedToken.compareToken.mockResolvedValue(true);
    storedToken.jti = 'token-jti' as RefreshTokenJti;
    storedToken.userId = 'user-id' as UserId;

    const user = mock<IUser>();
    user.hiddenPassword.mockImplementation(() => undefined);

    refreshTokenRepository.findByJti.mockResolvedValue(storedToken);
    userRepository.getById.mockResolvedValue(user);
    authTokenService.generateTokens.mockResolvedValue(generatedTokens);

    const result = await useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    expect(refreshTokenRepository.findByJti).toHaveBeenCalledWith('token-jti' as RefreshTokenJti);
    expect(userRepository.getById).toHaveBeenCalledWith(storedToken.userId);
    expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledWith(storedToken.jti, expect.any(Date));
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ jti: generatedTokens.jti, tokenHash: generatedTokens.refreshTokenHash })
    );
    expect(user.hiddenPassword).toHaveBeenCalled();
    expect(result).toEqual({ user, tokens: generatedTokens });
  });
});
