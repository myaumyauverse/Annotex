// Prisma 7 Configuration - Using environment variables
import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use direct Neon connection for CLI operations like migrate/db push.
    url: env('DIRECT_URL'),
  },
});

