import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './schema';
import { appConfig } from '../config/app-config';

const { url } = appConfig.database;

if (!url) {
  throw new Error('DATABASE_URL environment variable is required to initialize the database connection.');
}

// Clean the connection string by removing invalid schema parameter
const connectionString = url.replace(/\?schema=.*$/, '');
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
