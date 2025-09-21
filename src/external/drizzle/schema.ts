import { users } from './users/user.schema';
import { posts } from './posts/post.schema';

// Export all tables for Drizzle
export { users, posts };

// Export schema object
export const schema = { users, posts };

export type Schema = typeof schema;
