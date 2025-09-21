import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { EStatus } from '../../../core/shared/status.enum';

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    status: varchar('status', { length: 30 }).default(EStatus.active).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    titleIdx: index('posts_title_idx').on(table.title),
    statusIdx: index('posts_status_idx').on(table.status),
  })
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
