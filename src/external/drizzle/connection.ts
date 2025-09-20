import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./users/user.schema";

// Clean the connection string by removing invalid schema parameter
const connectionString = process.env.DATABASE_URL!.replace(/\?schema=.*$/, "");
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
