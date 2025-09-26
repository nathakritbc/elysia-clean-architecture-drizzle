import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { UnauthorizedError } from '@shared/errors/error-mapper';
import { RefreshTokenPlain } from '@modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { LogoutInput, LogoutUseCase } from '@modules/auth/application/use-cases/logout.usecase';

describe('LogoutUseCase', () => {
  const refreshTokenRepository = mock<RefreshTokenRepository>();

  let useCase: LogoutUseCase;

  beforeEach(() => {
    useCase = new LogoutUseCase(refreshTokenRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should be throw error unauthorized when refresh token not found', async () => {
    //Arrange
    const input = mock<LogoutInput>({
      refreshToken: undefined,
    });
    refreshTokenRepository.revokeByJti.mockResolvedValue(undefined);

    const errorExpected = new UnauthorizedError('Refresh token not found');

    //Act
    const promise = useCase.execute(input);
    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(refreshTokenRepository.revokeByJti).not.toHaveBeenCalled();
  });

  it('should be throw error unauthorized when jti not found', async () => {
    //Arrange
    const input = mock<LogoutInput>({
      refreshToken: '.invalid.token' as RefreshTokenPlain,
    });

    const errorExpected = new UnauthorizedError('Invalid refresh token');

    //Act
    const promise = useCase.execute(input);

    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(refreshTokenRepository.revokeByJti).not.toHaveBeenCalled();
  });

  it('should be return success when refresh token is valid', async () => {
    //Arrange
    const input = mock<LogoutInput>({
      refreshToken: 'valid-jti.token.signature' as RefreshTokenPlain,
    });
    refreshTokenRepository.revokeByJti.mockResolvedValue(undefined);

    const expected = { success: true };
    //Act
    const actual = await useCase.execute(input);

    //Assert
    expect(actual).toEqual(expected);
    expect(refreshTokenRepository.revokeByJti).toHaveBeenCalledWith('valid-jti', expect.any(Date));
  });
});
