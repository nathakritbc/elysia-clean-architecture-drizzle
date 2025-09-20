import { users } from './users/user.schema';

// Export all tables for Drizzle
export { users };

// Export schema object
export const schema = { users };

export type Schema = typeof schema;
