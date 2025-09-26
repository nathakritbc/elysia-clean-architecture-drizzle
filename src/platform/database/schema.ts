import { refreshTokens } from '@modules/auth/infrastructure/persistence/refresh-token.schema';
import { posts } from '@modules/content/infrastructure/persistence/post.schema';
import { users } from '@modules/accounts/infrastructure/persistence/user.schema';

export { users, posts, refreshTokens };

export const schema = { users, posts, refreshTokens };

export type Schema = typeof schema;
