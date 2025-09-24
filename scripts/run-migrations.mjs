import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'src/external/drizzle/migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

if (!fs.existsSync(JOURNAL_PATH)) {
  console.error(`❌ Cannot find migration journal at ${JOURNAL_PATH}`);
  process.exit(1);
}

const cleanDatabaseUrl = process.env.DATABASE_URL.replace(/\?schema=.*$/, '');
const client = postgres(cleanDatabaseUrl, { max: 1 });
const db = drizzle(client);

const loadMigrationMeta = () => {
  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));

  return journal.entries
    .map(entry => {
      const fileName = `${entry.tag}.sql`;
      const filePath = path.join(MIGRATIONS_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Missing migration file for tag ${entry.tag}`);
        return undefined;
      }

      const fileContents = fs.readFileSync(filePath, 'utf8');
      const hash = crypto.createHash('sha256').update(fileContents).digest('hex');

      return {
        hash,
        tag: entry.tag,
        generatedAt: new Date(Number(entry.when)),
      };
    })
    .filter(Boolean);
};

const ensureMetadataColumns = async () => {
  await db.execute(sql`
    ALTER TABLE "drizzle"."__drizzle_migrations"
    ADD COLUMN IF NOT EXISTS "name" text;
  `);

  await db.execute(sql`
    ALTER TABLE "drizzle"."__drizzle_migrations"
    ADD COLUMN IF NOT EXISTS "generated_at" timestamptz;
  `);

  await db.execute(sql`
    ALTER TABLE "drizzle"."__drizzle_migrations"
    ADD COLUMN IF NOT EXISTS "applied_at" timestamptz;
  `);

  await db.execute(sql`
    ALTER TABLE "drizzle"."__drizzle_migrations"
    ALTER COLUMN "applied_at" SET DEFAULT NOW();
  `);
};

const syncMetadata = async () => {
  const meta = loadMigrationMeta();

  for (const migration of meta) {
    await db.execute(sql`
      UPDATE "drizzle"."__drizzle_migrations"
      SET
        "name" = CASE
          WHEN "name" IS NULL OR LENGTH(TRIM("name")) = 0 THEN ${migration.tag}
          ELSE "name"
        END,
        "generated_at" = COALESCE("generated_at", ${migration.generatedAt.toISOString()}),
        "applied_at" = COALESCE("applied_at", NOW())
      WHERE "hash" = ${migration.hash};
    `);
  }
};

const run = async () => {
  console.info('🚀 Applying migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });

  console.info('🔧 Ensuring migration metadata columns...');
  await ensureMetadataColumns();

  console.info('🔄 Syncing migration metadata...');
  await syncMetadata();

  console.info('✅ Migrations completed.');
};

run()
  .catch(error => {
    console.error('💥', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
