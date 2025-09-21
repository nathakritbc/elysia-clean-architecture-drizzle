import { randomBytes } from 'crypto';
import 'dotenv/config';

export const jwtConfig = {
  secret: process.env.JWT_SECRET ?? 'mySecret',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
};

export const argon2Config = {
  memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 19456),
  timeCost: Number(process.env.ARGON2_TIME_COST ?? 2),
  parallelism: Number(process.env.ARGON2_PARALLELISM ?? 1),
  saltBuffer: Buffer.from(randomBytes(16)),
};
