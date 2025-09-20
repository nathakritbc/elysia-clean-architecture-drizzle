import { pgTable, varchar, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { EStatus } from '../../../core/shared/status.enum';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  status: varchar('status', { length: 30 }).default(EStatus.active).notNull(),
});

// Indexes
export const nameIdx = index('users_name_idx').on(users.name);
export const emailIdx = index('users_email_idx').on(users.email);
export const statusIdx = index('users_status_idx').on(users.status);
export const nameStatusIdx = index('users_name_status_idx').on(users.name, users.status);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
