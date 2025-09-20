import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/external/drizzle/Schema.ts",
  out: "./src/external/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
