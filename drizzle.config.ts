// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

import 'dotenv/config';


export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});
