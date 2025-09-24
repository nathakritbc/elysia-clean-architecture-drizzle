import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import type { UserEmail, UserPassword } from '../../users/entity/user.entity';
import { UserRepository } from '../../users/service/user.repository';
import { AuthTokenService } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { type AuthenticatedUser, BaseAuthUseCase } from './base-auth.usecase';

export interface SignInInput {
  email: UserEmail;
  password: UserPassword;
}

@injectable()
export class SignInUseCase extends BaseAuthUseCase<SignInInput, AuthenticatedUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    protected readonly userRepository: UserRepository,
    @inject(TOKENS.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TOKENS.AuthTokenService)
    protected readonly authTokenService: AuthTokenService
  ) {
    super(userRepository, refreshTokenRepository, authTokenService);
  }
  async execute(input: SignInInput): Promise<AuthenticatedUser> {
    const user = await this.userRepository.getByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(input.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Use the common token generation method from base class
    return await this.generateTokensForUser(user);
  }
}
