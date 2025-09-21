import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { TOKENS } from '../../../shared/tokens';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { RefreshTokenJti, RefreshTokenPlain, RefreshTokenRevokedAt } from '../entity/refresh-token.entity';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';

export interface LogoutInput {
  refreshToken: RefreshTokenPlain;
}

export interface LogoutOutput {
  success: boolean;
}

@injectable()
export class LogoutUseCase implements IUseCase<LogoutInput, LogoutOutput> {
  constructor(
    @inject(TOKENS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    if (!input?.refreshToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const refreshTokenString = input.refreshToken;
    const jti = await this.validateRefreshToken(refreshTokenString);
    await this.refreshTokenRepository.revokeByJti(jti, new Date() as RefreshTokenRevokedAt);

    return { success: true };
  }

  private async validateRefreshToken(refreshToken: RefreshTokenPlain): Promise<RefreshTokenJti> {
    const [jti] = refreshToken.split('.');

    if (!jti) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return jti as RefreshTokenJti;
  }
}
