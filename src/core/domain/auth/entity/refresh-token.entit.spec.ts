import * as argon2 from 'argon2';
import { Builder } from 'builder-pattern';
import { vi } from 'vitest';

import { faker } from '@faker-js/faker';

import {
  RefreshToken,
  RefreshTokenExpiresAt,
  RefreshTokenHash,
  RefreshTokenPlain,
  RefreshTokenRevokedAt,
} from './refresh-token.entity';

describe('RefreshToken', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('compareToken', () => {
    it('should return true when token matches hash', async () => {
      // Arrange
      const plainToken = faker.string.alphanumeric(32) as RefreshTokenPlain;
      const hashedToken = await argon2.hash(plainToken);

      const refreshToken = Builder(RefreshToken)
        .tokenHash(hashedToken as RefreshTokenHash)
        .build();

      // Act
      const actual = await refreshToken.compareToken(plainToken);

      // Assert
      expect(actual).toBe(true);
    });

    it('should return false when token does not match hash', async () => {
      // Arrange
      const plainToken = faker.string.alphanumeric(32) as RefreshTokenPlain;
      const differentToken = faker.string.alphanumeric(32) as RefreshTokenPlain;
      const hashedToken = await argon2.hash(differentToken);

      const refreshToken = Builder(RefreshToken)
        .tokenHash(hashedToken as RefreshTokenHash)
        .build();

      // Act
      const actual = await refreshToken.compareToken(plainToken);

      // Assert
      expect(actual).toBe(false);
    });

    it('should handle argon2 verification errors gracefully', async () => {
      // Arrange
      const plainToken = faker.string.alphanumeric(32) as RefreshTokenPlain;
      const invalidHash = 'invalid-hash' as RefreshTokenHash;

      const refreshToken = Builder(RefreshToken).tokenHash(invalidHash).build();

      // Act
      const promise = refreshToken.compareToken(plainToken);

      //Assert
      await expect(promise).rejects.toThrowError();
    });
  });

  describe('markRevoked', () => {
    it('should mark token as revoked with current date when no date provided', () => {
      // Arrange
      const refreshToken = Builder(RefreshToken).build();
      const mockDate = new Date('2023-01-01T00:00:00.000Z');

      // Mock Date constructor
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // Act
      refreshToken.markRevoked();

      // Assert
      expect(refreshToken.revokedAt).toBe(mockDate as RefreshTokenRevokedAt);
      expect(refreshToken.isRevoked()).toBe(true);

      // Cleanup
      vi.restoreAllMocks();
    });

    it('should mark token as revoked with provided date', () => {
      // Arrange
      const refreshToken = Builder(RefreshToken).build();
      const customRevokedAt = new Date('2023-06-01T12:00:00.000Z') as RefreshTokenRevokedAt;

      // Act
      refreshToken.markRevoked(customRevokedAt);

      // Assert
      expect(refreshToken.revokedAt).toBe(customRevokedAt);
      expect(refreshToken.isRevoked()).toBe(true);
    });

    it('should update revokedAt when called multiple times', () => {
      // Arrange
      const refreshToken = Builder(RefreshToken).build();
      const firstRevokedAt = new Date('2023-01-01T00:00:00.000Z') as RefreshTokenRevokedAt;
      const secondRevokedAt = new Date('2023-06-01T12:00:00.000Z') as RefreshTokenRevokedAt;

      // Act
      refreshToken.markRevoked(firstRevokedAt);
      refreshToken.markRevoked(secondRevokedAt);

      // Assert
      expect(refreshToken.revokedAt).toBe(secondRevokedAt);
      expect(refreshToken.isRevoked()).toBe(true);
    });
  });

  describe('isRevoked', () => {
    it('should return false when token is not revoked', () => {
      // Arrange
      const refreshToken = Builder(RefreshToken).build();

      // Act
      const result = refreshToken.isRevoked();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when token is revoked', () => {
      // Arrange
      const refreshToken = Builder(RefreshToken).build();
      const revokedAt = new Date() as RefreshTokenRevokedAt;
      refreshToken.markRevoked(revokedAt);

      // Act
      const result = refreshToken.isRevoked();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when revokedAt is set directly', () => {
      // Arrange
      const refreshToken = Builder(RefreshToken).build();
      refreshToken.revokedAt = new Date() as RefreshTokenRevokedAt;

      // Act
      const result = refreshToken.isRevoked();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return false when token is not expired', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const refreshToken = Builder(RefreshToken)
        .expiresAt(futureDate as RefreshTokenExpiresAt)
        .build();

      // Act
      const result = refreshToken.isExpired();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when token is expired', () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const refreshToken = Builder(RefreshToken)
        .expiresAt(pastDate as RefreshTokenExpiresAt)
        .build();

      // Act
      const result = refreshToken.isExpired();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when token expires exactly at reference date', () => {
      // Arrange
      const referenceDate = new Date('2023-01-01T12:00:00.000Z');

      const refreshToken = Builder(RefreshToken)
        .expiresAt(referenceDate as RefreshTokenExpiresAt)
        .build();

      // Act
      const result = refreshToken.isExpired(referenceDate);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token expires after reference date', () => {
      // Arrange
      const referenceDate = new Date('2023-01-01T12:00:00.000Z');
      const futureDate = new Date('2023-01-01T13:00:00.000Z');

      const refreshToken = Builder(RefreshToken)
        .expiresAt(futureDate as RefreshTokenExpiresAt)
        .build();

      // Act
      const result = refreshToken.isExpired(referenceDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should use current date as default reference date', () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setTime(pastDate.getTime() - 1000); // 1 second ago

      const refreshToken = Builder(RefreshToken)
        .expiresAt(pastDate as RefreshTokenExpiresAt)
        .build();

      // Act
      const result = refreshToken.isExpired();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should handle complete token lifecycle', async () => {
      // Arrange
      const plainToken = faker.string.alphanumeric(32) as RefreshTokenPlain;
      const hashedToken = await argon2.hash(plainToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const refreshToken = Builder(RefreshToken)
        .id(faker.string.uuid() as RefreshToken['id'])
        .userId(faker.string.uuid() as RefreshToken['userId'])
        .jti(faker.string.uuid() as RefreshToken['jti'])
        .tokenHash(hashedToken as RefreshTokenHash)
        .expiresAt(expiresAt as RefreshTokenExpiresAt)
        .build();

      // Act & Assert - Token should be valid initially
      const actual = await refreshToken.compareToken(plainToken);

      expect(actual).toBe(true);
      expect(refreshToken.isRevoked()).toBe(false);
      expect(refreshToken.isExpired()).toBe(false);

      // Revoke the token
      refreshToken.markRevoked();
      expect(refreshToken.isRevoked()).toBe(true);
      expect(actual).toBe(true); // Still verifies correctly
      expect(refreshToken.isExpired()).toBe(false); // Not expired yet

      // Simulate expiration
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() + 8); // 8 days from now
      expect(refreshToken.isExpired(expiredDate)).toBe(true);
    });

    it('should handle edge case with null/undefined values', () => {
      // Arrange
      const refreshToken = new RefreshToken();

      // Act
      const actual = refreshToken.isRevoked();

      // Assert
      expect(actual).toBeFalsy();
      expect(refreshToken.isExpired()).toBe(true); // Default expiresAt is current date
      expect(actual).toBeFalsy();
      expect(refreshToken.isExpired()).toBe(true); // Default expiresAt is current date
    });
  });
});
