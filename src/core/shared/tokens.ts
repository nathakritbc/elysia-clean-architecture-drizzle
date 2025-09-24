export const TOKENS = {
  IUserRepository: Symbol('IUserRepository'),
  IPostRepository: Symbol('IPostRepository'),
  Logger: Symbol('Logger'),
  AppConfig: Symbol('AppConfig'),
  RefreshTokenRepository: Symbol('RefreshTokenRepository'),
  AuthTokenService: Symbol('AuthTokenService'),
  AuthConfig: Symbol('AuthConfig'),
  HealthCheckService: Symbol('HealthCheckService'),
} as const;
