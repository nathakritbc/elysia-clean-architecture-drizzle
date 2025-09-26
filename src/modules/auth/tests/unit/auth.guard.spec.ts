import { Context } from 'elysia';
import { afterEach, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { faker } from '@faker-js/faker';

import { UnauthorizedError } from '@shared/errors/error-mapper';
import { JwtPayload, validatePayload, validateToken, validateUserId } from '@modules/auth/interface/http/guards/auth.guard';

describe('Auth Guard', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateToken', () => {
    it('should be throw error unauthorized when token is missing', () => {
      const ctx = mock<Context & { request: { headers: { authorization: string } } }>({
        request: {
          headers: {
            authorization: 'bearer ',
          },
        },
      });

      const errorExpected = new UnauthorizedError('Missing access token');

      const promise = validateToken(ctx);

      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be return token when token is present', () => {
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

      const actual = validateToken(ctx);

      expect(actual).resolves.toBe(expected);
    });
  });

  describe('validatePayload', () => {
    it('should be throw error unauthorized when payload is missing', () => {
      const payload = null as unknown as JwtPayload;

      const errorExpected = new UnauthorizedError('Invalid access token');

      const promise = validatePayload(payload);

      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be pass when payload is an object', () => {
      const payload = mock<JwtPayload>({
        sub: faker.string.uuid(),
        email: faker.internet.email(),
        jti: faker.string.uuid(),
        type: faker.string.uuid(),
      });

      const actual = validatePayload(payload);

      expect(actual).resolves.toBeUndefined();
    });
  });

  describe('validateUserId', () => {
    it('should be throw error unauthorized when userId is missing', () => {
      const payload = mock<JwtPayload>({
        sub: undefined,
      });

      const errorExpected = new UnauthorizedError('Invalid access token');

      const promise = validateUserId(payload);

      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be throw error unauthorized when payload has no sub property', () => {
      const payload = {} as unknown as JwtPayload;

      const errorExpected = new UnauthorizedError('Invalid access token');

      const promise = validateUserId(payload);

      expect(promise).rejects.toThrowError(errorExpected);
    });

    it('should be return userId when userId is present', () => {
      const userId = faker.string.uuid();
      const payload = mock<JwtPayload>({
        sub: userId,
      });

      const actual = validateUserId(payload);

      expect(actual).resolves.toBe(userId);
    });
  });
});
