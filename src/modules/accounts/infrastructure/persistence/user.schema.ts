import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { EStatus } from '@shared/kernel/status.enum';

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
    nameIdx: index('users_name_idx').on(table.name),
    emailIdx: index('users_email_idx').on(table.email),
    statusIdx: index('users_status_idx').on(table.status),
    nameStatusIdx: index('users_name_status_idx').on(table.name, table.status),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
