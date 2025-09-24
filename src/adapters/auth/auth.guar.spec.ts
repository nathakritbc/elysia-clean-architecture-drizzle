import { Context } from 'elysia';
import { afterEach, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { faker } from '@faker-js/faker';

import { UnauthorizedError } from '../../core/shared/errors/error-mapper';
import { JwtPayload, validatePayload, validateToken, validateUserId } from './auth.guard';

describe('Auth Guard', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateToken', () => {
    it('should be throw error unauthorized when token is missing', () => {
      //Arrange
      const ctx = mock<Context & { request: { headers: { authorization: string } } }>({
        request: {
          headers: {
            authorization: 'bearer ',
          },
        },
      });

      const errorExpected = new UnauthorizedError('Missing access token');

      //Act
      const promise = validateToken(ctx);

      //Assert
      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be return token when token is present', () => {
      //Arrange
      const mockToken = faker.string.uuid();
      const mockHeaders = {
        get: (key: string) => (key === 'authorization' ? `Bearer ${mockToken}` : ''),
      };
      const ctx = mock<Context & { request: { headers: { get: (key: string) => string } } }>({
        request: {
          headers: mockHeaders,
        },
      });
      const expected = mockToken;

      //Act
      const actual = validateToken(ctx);

      //Assert
      expect(actual).resolves.toBe(expected);
    });
  });

  describe('validatePayload', () => {
    it('should be throw error unauthorized when payload is missing', () => {
      //Arrange
      const payload = null as unknown as JwtPayload;

      const errorExpected = new UnauthorizedError('Invalid access token');

      //Act
      const promise = validatePayload(payload);

      //Assert
      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be pass when payload is an object', () => {
      //Arrange
      const payload = mock<JwtPayload>({
        sub: faker.string.uuid(),
        email: faker.internet.email(),
        jti: faker.string.uuid(),
        type: faker.string.uuid(),
      });

      //Act
      const actual = validatePayload(payload);

      //Assert
      expect(actual).resolves.toBeUndefined();
    });
  });

  describe('validateUserId', () => {
    it('should be throw error unauthorized when userId is missing', () => {
      //Arrange
      const payload = mock<JwtPayload>({
        sub: undefined,
      });

      const errorExpected = new UnauthorizedError('Invalid access token');

      //Act
      const promise = validateUserId(payload);

      //Assert
      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be throw error unauthorized when payload has no sub property', () => {
      //Arrange
      const payload = {} as unknown as JwtPayload;

      const errorExpected = new UnauthorizedError('Invalid access token');

      //Act
      const promise = validateUserId(payload);

      //Assert
      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be return userId when userId is present', () => {
      //Arrange
      const userId = faker.string.uuid();
      const payload = mock<JwtPayload>({
        sub: userId,
      });

      const expected = userId;

      //Act
      const actual = validateUserId(payload);

      //Assert
      expect(actual).resolves.toBe(expected);
    });
  });
});
