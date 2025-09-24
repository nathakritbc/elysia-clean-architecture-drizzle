import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import type { IUser, UserId } from '../../users/entity/user.entity';
import { UserRepository } from '../../users/service/user.repository';
import type {
  IRefreshToken,
  RefreshTokenExpiresAt,
  RefreshTokenHash,
  RefreshTokenJti,
  RefreshTokenPlain,
} from '../entity/refresh-token.entity';
import { AuthTokenService } from '../service/auth-token.service';
import type { AccessTokenExpiresAt } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { RefreshSessionUseCase } from './refresh-session.usecase';

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
    useCase = new RefreshSessionUseCase(userRepository, refreshTokenRepository, authTokenService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('throws unauthorized if refresh token not found', async () => {
    //Arrange
    refreshTokenRepository.findByJti.mockResolvedValue(undefined);

    //Act
    const promise = useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    //Assert
    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
    expect(refreshTokenRepository.findByJti).toHaveBeenCalledWith('token-jti' as RefreshTokenJti);
  });

  it('throws unauthorized if refresh token is revoked', async () => {
    //Arrange
    const storedToken = mock<IRefreshToken>();
    storedToken.isRevoked.mockReturnValue(true);
    storedToken.jti = 'token-jti' as RefreshTokenJti;

    refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

    //Act
    const promise = useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    //Assert
    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws unauthorized if refresh token is expired', async () => {
    //Arrange
    const storedToken = mock<IRefreshToken>();
    storedToken.isRevoked.mockReturnValue(false);
    storedToken.isExpired.mockReturnValue(true);
    storedToken.jti = 'token-jti' as RefreshTokenJti;

    refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

    //Act
    const promise = useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    //Assert
    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws unauthorized if refresh token comparison fails', async () => {
    //Arrange
    const storedToken = mock<IRefreshToken>();
    storedToken.isRevoked.mockReturnValue(false);
    storedToken.isExpired.mockReturnValue(false);
    storedToken.compareToken.mockResolvedValue(false);
    storedToken.jti = 'token-jti' as RefreshTokenJti;

    refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

    //Act
    const promise = useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    //Assert
    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws unauthorized if associated user not found', async () => {
    //Arrange
    const storedToken = mock<IRefreshToken>();
    storedToken.isRevoked.mockReturnValue(false);
    storedToken.isExpired.mockReturnValue(false);
    storedToken.compareToken.mockResolvedValue(true);
    storedToken.jti = 'token-jti' as RefreshTokenJti;
    storedToken.userId = 'user-id' as UserId;

    refreshTokenRepository.findByJti.mockResolvedValue(storedToken);
    userRepository.getById.mockResolvedValue(undefined);

    //Act
    const promise = useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    //Assert
    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rotates token when refresh token is valid', async () => {
    //Arrange
    const storedToken = mock<IRefreshToken>();
    storedToken.isRevoked.mockReturnValue(false);
    storedToken.isExpired.mockReturnValue(false);
    storedToken.compareToken.mockResolvedValue(true);
    storedToken.jti = 'token-jti' as RefreshTokenJti;
    storedToken.userId = 'user-id' as UserId;

    refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

    const user = mock<IUser>();
    user.hiddenPassword.mockImplementation(() => undefined);

    // Mock the repository methods
    vi.mocked(refreshTokenRepository.findByJti).mockResolvedValue(storedToken);
    vi.mocked(refreshTokenRepository.revokeByJti).mockResolvedValue(undefined);
    vi.mocked(refreshTokenRepository.create).mockResolvedValue(storedToken);
    vi.mocked(userRepository.getById).mockResolvedValue(user);
    vi.mocked(authTokenService.generateTokens).mockResolvedValue(generatedTokens);

    // Mock the generateTokensForUserWithoutRevoke method
    const generateTokensForUserWithoutRevokeSpy = vi.spyOn(useCase, 'generateTokensForUserWithoutRevoke');
    generateTokensForUserWithoutRevokeSpy.mockResolvedValue({ user, tokens: generatedTokens });

    //Act
    const actual = await useCase.execute({ refreshToken: refreshTokenString as RefreshTokenPlain });

    //Assert
    expect(refreshTokenRepository.findByJti).toHaveBeenCalledWith('token-jti' as RefreshTokenJti);
    expect(userRepository.getById).toHaveBeenCalledWith(storedToken.userId);
    expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledWith(storedToken.jti, expect.any(Date));
    expect(generateTokensForUserWithoutRevokeSpy).toHaveBeenCalledWith(user);
    expect(actual).toEqual({ user, tokens: generatedTokens });
  });

  it('generateTokensForUserWithoutRevoke creates tokens without revoking existing tokens', async () => {
    //Arrange
    const user = mock<IUser>();
    user.hiddenPassword.mockImplementation(() => undefined);

    const mockRefreshToken = mock<IRefreshToken>();

    vi.mocked(authTokenService.generateTokens).mockResolvedValue(generatedTokens);
    vi.mocked(refreshTokenRepository.create).mockResolvedValue(mockRefreshToken);

    //Act
    const actual = await useCase.generateTokensForUserWithoutRevoke(user);

    //Assert
    expect(authTokenService.generateTokens).toHaveBeenCalledWith(user);
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        jti: generatedTokens.jti,
        tokenHash: generatedTokens.refreshTokenHash,
        expiresAt: generatedTokens.refreshTokenExpiresAt,
      })
    );
    expect(user.hiddenPassword).toHaveBeenCalled();
    expect(actual).toEqual({ user, tokens: generatedTokens });
  });
});
