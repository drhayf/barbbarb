import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load .env for CLI tools like drizzle-kit when run locally
dotenv.config();

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
