import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { RefreshTokenPlain } from '../entity/refresh-token.entity';
import { BaseLogoutUseCase, type LogoutOutput } from './base-logout.usecase';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';

export interface LogoutInput {
  refreshToken: RefreshTokenPlain;
}

@injectable()
export class LogoutUseCase extends BaseLogoutUseCase<LogoutInput, LogoutOutput> {
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
