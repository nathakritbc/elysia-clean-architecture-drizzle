import { pgTable, varchar, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { EStatus } from '../../../core/shared/status.enum';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    status: varchar('status', { length: 30 }).default(EStatus.active).notNull(),
  },
  table => ({
    // Index for name column
    nameIdx: index('users_name_idx').on(table.name),
    // Index for email column (already has unique constraint, but adding explicit index for performance)
    emailIdx: index('users_email_idx').on(table.email),
    // Index for status column
    statusIdx: index('users_status_idx').on(table.status),
    // Composite index for name and status (useful for queries filtering by both)
    nameStatusIdx: index('users_name_status_idx').on(table.name, table.status),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
