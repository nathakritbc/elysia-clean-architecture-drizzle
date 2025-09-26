import 'dotenv/config';

export interface DatabaseConfig {
  url: string;
}

export const databaseUrl = process.env.DATABASE_URL ?? '';
