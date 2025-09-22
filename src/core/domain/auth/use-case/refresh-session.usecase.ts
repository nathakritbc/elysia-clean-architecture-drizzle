import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { RefreshTokenPlain } from '../entity/refresh-token.entity';
import { BaseAuthUseCase, type AuthenticatedUser } from './base-auth.usecase';

export interface RefreshSessionInput {
  refreshToken: RefreshTokenPlain;
}

@injectable()
export class RefreshSessionUseCase extends BaseAuthUseCase<RefreshSessionInput, AuthenticatedUser> {
  async execute(input: RefreshSessionInput): Promise<AuthenticatedUser> {
    // Validate and retrieve the refresh token using common method
    const { storedToken } = await this.validateAndRetrieveRefreshToken(input.refreshToken);

    // Revoke the old token
    await this.revokeRefreshTokenByJti(storedToken.jti);

    // Get the user
    const user = await this.userRepository.getById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedError('Associated user not found');
    }

    // Generate new tokens (without revoking since we already revoked above)
    return await this.generateTokensForUserWithoutRevoke(user);
  }
}
