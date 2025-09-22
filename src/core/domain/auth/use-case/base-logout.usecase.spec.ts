import { mock } from 'vitest-mock-extended';
import { vi } from 'vitest';
import { BaseLogoutUseCase, LogoutOutput } from './base-logout.usecase';
import { RefreshTokenJti, RefreshTokenPlain, RefreshTokenRevokedAt } from '../entity/refresh-token.entity';
import { LogoutInput } from './logout.usecase';
import { RefreshTokenRepository } from '../service/refresh-token.repository';

describe('BaseLogoutUseCase', () => {
  class BaseLogoutUseCaseMock extends BaseLogoutUseCase<LogoutInput, LogoutOutput> {
    public async execute(_input: LogoutInput): Promise<LogoutOutput> {
      return { success: true };
    }

    // Expose protected methods for testing
    public async testValidateRefreshToken(refreshToken: RefreshTokenPlain): Promise<RefreshTokenJti> {
      return this.validateRefreshToken(refreshToken);
    }

    public async testRevokeRefreshTokenByJti(jti: RefreshTokenJti): Promise<void> {
      return this.revokeRefreshTokenByJti(jti);
    }
  }

  const refreshTokenRepository = mock<RefreshTokenRepository>();
  let useCase: BaseLogoutUseCaseMock;

  beforeEach(() => {
    useCase = new BaseLogoutUseCaseMock(refreshTokenRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateRefreshToken', () => {
    it('should throw UnauthorizedError when refresh token has no dot separator', async () => {
      // Arrange
      const invalidRefreshToken = '' as RefreshTokenPlain;

      // Act
      const promise = useCase.testValidateRefreshToken(invalidRefreshToken);

      // Assert
      await expect(promise).rejects.toThrow('Invalid refresh token');
      expect(refreshTokenRepository.revokeByJti).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when JTI is empty after split', async () => {
      // Arrange
      const invalidRefreshToken = '.some-value' as RefreshTokenPlain;

      // Act
      const promise = useCase.testValidateRefreshToken(invalidRefreshToken);

      // Assert
      await expect(promise).rejects.toThrow('Invalid refresh token');
      expect(refreshTokenRepository.revokeByJti).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when refresh token is empty string', async () => {
      // Arrange
      const invalidRefreshToken = '' as RefreshTokenPlain;

      // Act
      const promise = useCase.testValidateRefreshToken(invalidRefreshToken);

      // Assert
      await expect(promise).rejects.toThrow('Invalid refresh token');
      expect(refreshTokenRepository.revokeByJti).not.toHaveBeenCalled();
    });

    it('should return JTI when refresh token format is valid', async () => {
      // Arrange
      const validRefreshToken = 'valid-jti.some-value' as RefreshTokenPlain;
      const expectedJti = 'valid-jti' as RefreshTokenJti;

      // Act
      const result = await useCase.testValidateRefreshToken(validRefreshToken);

      // Assert
      expect(result).toBe(expectedJti);
    });
  });

  describe('revokeRefreshTokenByJti', () => {
    it('should call refreshTokenRepository.revokeByJti with correct parameters', async () => {
      // Arrange
      const jti = 'test-jti' as RefreshTokenJti;
      const mockDate = new Date('2023-01-01T00:00:00.000Z');

      // Mock Date constructor to return predictable date
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // Act
      await useCase.testRevokeRefreshTokenByJti(jti);

      // Assert
      expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledWith(jti, mockDate as RefreshTokenRevokedAt);
      expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledTimes(1);
    });
  });
});
