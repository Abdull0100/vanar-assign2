// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

import 'dotenv/config';


export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5433/local",
  },
  verbose: true,
  strict: true,
});
