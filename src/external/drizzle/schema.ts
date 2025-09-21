import { users } from './users/user.schema';
import { posts } from './posts/post.schema';
import { refreshTokens } from './auth/refresh-token.schema';

// Export all tables for Drizzle
export { users, posts, refreshTokens };

// Export schema object
export const schema = { users, posts, refreshTokens };

export type Schema = typeof schema;
