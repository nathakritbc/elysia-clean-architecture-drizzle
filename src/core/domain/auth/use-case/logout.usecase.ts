import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { RefreshTokenPlain } from '../entity/refresh-token.entity';
import { BaseLogoutUseCase, type LogoutOutput } from './base-logout.usecase';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { TOKENS } from '../../../shared/tokens';

export interface LogoutInput {
  refreshToken: RefreshTokenPlain;
}

@injectable()
export class LogoutUseCase extends BaseLogoutUseCase<LogoutInput, LogoutOutput> {
  constructor(
    @inject(TOKENS.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository
  ) {
    super(refreshTokenRepository);
  }

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    if (!input?.refreshToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const refreshTokenString = input.refreshToken;
    const jti = await this.validateRefreshToken(refreshTokenString);
    await this.revokeRefreshTokenByJti(jti);

    return { success: true };
  }
}
