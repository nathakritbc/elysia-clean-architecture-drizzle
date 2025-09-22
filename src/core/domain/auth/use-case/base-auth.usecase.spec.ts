import 'reflect-metadata';
import { mock } from 'vitest-mock-extended';
import { vi } from 'vitest';
import { BaseAuthUseCase, AuthenticatedUser } from './base-auth.usecase';
import { UserRepository } from '../../users/service/user.repository';
import { AuthTokenService, GeneratedAuthTokens } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import {
  RefreshToken,
  RefreshTokenJti,
  RefreshTokenPlain,
  IRefreshToken,
  RefreshTokenRevokedAt,
} from '../entity/refresh-token.entity';
import { IUser, User } from '../../users/entity/user.entity';
import { Builder } from 'builder-pattern';
import { faker } from '@faker-js/faker';

describe('BaseAuthUseCase', () => {
  class BaseAuthUseCaseMock extends BaseAuthUseCase<unknown, unknown> {
    public async execute(_input: unknown): Promise<unknown> {
      return {};
    }

    // Expose protected methods for testing
    public async testGenerateTokensForUser(user: IUser): Promise<AuthenticatedUser> {
      return this.generateTokensForUser(user);
    }

    public async testGenerateTokensForUserWithoutRevoke(user: IUser): Promise<AuthenticatedUser> {
      return this.generateTokensForUserWithoutRevoke(user);
    }

    public async testRevokeRefreshTokenByJti(jti: RefreshTokenJti): Promise<void> {
      return this.revokeRefreshTokenByJti(jti);
    }

    public testValidateRefreshTokenFormat(refreshToken: RefreshTokenPlain): RefreshTokenJti {
      return this.validateRefreshTokenFormat(refreshToken);
    }

    public async testValidateAndRetrieveRefreshToken(
      refreshToken: RefreshTokenPlain
    ): Promise<{ storedToken: IRefreshToken; jti: RefreshTokenJti }> {
      return this.validateAndRetrieveRefreshToken(refreshToken);
    }
  }

  const userRepository = mock<UserRepository>();
  const refreshTokenRepository = mock<RefreshTokenRepository>();
  const authTokenService = mock<AuthTokenService>();
  let useCase: BaseAuthUseCaseMock;

  beforeEach(() => {
    useCase = new BaseAuthUseCaseMock(userRepository, refreshTokenRepository, authTokenService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const user = Builder(User)
    .id('user-123' as User['id'])
    .name(faker.person.fullName() as User['name'])
    .email(faker.internet.email() as User['email'])
    .password(faker.internet.password() as User['password'])
    .status('ACTIVE' as User['status'])
    .build();

  describe('generateTokensForUser', () => {
    it('should revoke existing tokens and generate new ones for user', async () => {
      // Arrange

      const mockTokens: GeneratedAuthTokens = {
        accessToken: faker.string.uuid(),
        accessTokenExpiresAt: new Date() as GeneratedAuthTokens['accessTokenExpiresAt'],
        refreshToken: faker.string.uuid(),
        refreshTokenHash: faker.string.uuid() as GeneratedAuthTokens['refreshTokenHash'],
        refreshTokenExpiresAt: new Date() as GeneratedAuthTokens['refreshTokenExpiresAt'],
        jti: faker.string.uuid() as GeneratedAuthTokens['jti'],
      };

      authTokenService.generateTokens.mockResolvedValue(mockTokens);
      refreshTokenRepository.revokeAllByUserId.mockResolvedValue();
      refreshTokenRepository.create.mockResolvedValue(mock<IRefreshToken>());

      // Act
      const result = await useCase.testGenerateTokensForUser(user);

      // Assert
      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(user.id, expect.any(Date));
      expect(authTokenService.generateTokens).toHaveBeenCalledWith(user);
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(expect.any(RefreshToken));
      expect(result.user).toBe(user);
      expect(result.tokens).toBe(mockTokens);
      expect(user.password).toBe(''); // Password should be hidden
    });
  });

  describe('generateTokensForUserWithoutRevoke', () => {
    it('should generate tokens without revoking existing ones', async () => {
      // Arrange

      const mockTokens: GeneratedAuthTokens = {
        accessToken: faker.string.uuid(),
        accessTokenExpiresAt: new Date() as GeneratedAuthTokens['accessTokenExpiresAt'],
        refreshToken: faker.string.uuid(),
        refreshTokenHash: faker.string.uuid() as GeneratedAuthTokens['refreshTokenHash'],
        refreshTokenExpiresAt: new Date() as GeneratedAuthTokens['refreshTokenExpiresAt'],
        jti: faker.string.uuid() as GeneratedAuthTokens['jti'],
      };

      authTokenService.generateTokens.mockResolvedValue(mockTokens);
      refreshTokenRepository.create.mockResolvedValue(mock<IRefreshToken>());

      // Act
      const result = await useCase.testGenerateTokensForUserWithoutRevoke(user);

      // Assert
      expect(refreshTokenRepository.revokeAllByUserId).not.toHaveBeenCalled();
      expect(authTokenService.generateTokens).toHaveBeenCalledWith(user);
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(expect.any(RefreshToken));
      expect(result.user).toBe(user);
      expect(result.tokens).toBe(mockTokens);
      expect(user.password).toBe(''); // Password should be hidden
    });
  });

  describe('revokeRefreshTokenByJti', () => {
    it('should call refreshTokenRepository.revokeByJti with correct parameters', async () => {
      // Arrange
      const jti = faker.string.uuid() as RefreshTokenJti;
      const mockDate = new Date('2023-01-01T00:00:00.000Z');

      // Mock Date constructor to return predictable date
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // Act
      await useCase.testRevokeRefreshTokenByJti(jti);

      // Assert
      expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledWith(jti, mockDate as RefreshTokenRevokedAt);
      expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledTimes(1);

      // Cleanup
      vi.restoreAllMocks();
    });
  });

  describe('validateRefreshTokenFormat', () => {
    it('should throw UnauthorizedError when refresh token has no dot separator', () => {
      // Arrange
      const invalidRefreshToken = faker.string.uuid() as RefreshTokenPlain;

      // Act & Assert
      expect(() => useCase.testValidateRefreshTokenFormat(invalidRefreshToken)).toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError when refresh token has multiple dots', () => {
      // Arrange
      const invalidRefreshToken = 'jti.secret.extra' as RefreshTokenPlain;

      // Act & Assert
      expect(() => useCase.testValidateRefreshTokenFormat(invalidRefreshToken)).toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError when JTI is empty', () => {
      // Arrange
      const invalidRefreshToken = '.secret' as RefreshTokenPlain;

      // Act & Assert
      expect(() => useCase.testValidateRefreshTokenFormat(invalidRefreshToken)).toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError when secret is empty', () => {
      // Arrange
      const invalidRefreshToken = 'jti.' as RefreshTokenPlain;

      // Act & Assert
      expect(() => useCase.testValidateRefreshTokenFormat(invalidRefreshToken)).toThrow('Invalid refresh token');
    });

    it('should return JTI when refresh token format is valid', () => {
      // Arrange
      const validRefreshToken = 'valid-jti.secret' as RefreshTokenPlain;
      const expectedJti = 'valid-jti' as RefreshTokenJti;

      // Act
      const result = useCase.testValidateRefreshTokenFormat(validRefreshToken);

      // Assert
      expect(result).toBe(expectedJti);
    });
  });

  describe('validateAndRetrieveRefreshToken', () => {
    it('should throw UnauthorizedError when token is not found in database', async () => {
      // Arrange
      const refreshToken = 'jti.secret' as RefreshTokenPlain;
      refreshTokenRepository.findByJti.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.testValidateAndRetrieveRefreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError when token is revoked', async () => {
      // Arrange
      const refreshToken = 'jti.secret' as RefreshTokenPlain;
      const storedToken = mock<IRefreshToken>();
      storedToken.isRevoked.mockReturnValue(true);
      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

      // Act & Assert
      await expect(useCase.testValidateAndRetrieveRefreshToken(refreshToken)).rejects.toThrow(
        'Refresh token has been revoked'
      );
    });

    it('should throw UnauthorizedError when token is expired', async () => {
      // Arrange
      const refreshToken = 'jti.secret' as RefreshTokenPlain;
      const storedToken = mock<IRefreshToken>();
      storedToken.isRevoked.mockReturnValue(false);
      storedToken.isExpired.mockReturnValue(true);
      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

      // Act & Assert
      await expect(useCase.testValidateAndRetrieveRefreshToken(refreshToken)).rejects.toThrow(
        'Refresh token has expired'
      );
    });

    it('should throw UnauthorizedError when token comparison fails', async () => {
      // Arrange
      const refreshToken = 'jti.secret' as RefreshTokenPlain;
      const storedToken = mock<IRefreshToken>();
      storedToken.isRevoked.mockReturnValue(false);
      storedToken.isExpired.mockReturnValue(false);
      storedToken.compareToken.mockResolvedValue(false);
      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

      // Act & Assert
      await expect(useCase.testValidateAndRetrieveRefreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should return stored token and JTI when validation passes', async () => {
      // Arrange
      const refreshToken = 'jti.secret' as RefreshTokenPlain;
      const storedToken = mock<IRefreshToken>();
      storedToken.isRevoked.mockReturnValue(false);
      storedToken.isExpired.mockReturnValue(false);
      storedToken.compareToken.mockResolvedValue(true);
      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);

      // Act
      const result = await useCase.testValidateAndRetrieveRefreshToken(refreshToken);

      // Assert
      expect(result.storedToken).toBe(storedToken);
      expect(result.jti).toBe('jti' as RefreshTokenJti);
      expect(storedToken.compareToken).toHaveBeenCalledWith(refreshToken);
    });
  });
});
