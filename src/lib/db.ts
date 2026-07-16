import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as PgPool } from 'pg';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Build-safe Prisma client.
 *
 * During `next build`, Next.js executes page modules to collect page data.
 * If DATABASE_URL isn't set at build time (e.g., on Vercel before you've
 * added the env var), we return a lazy proxy that only throws when a DB
 * query is actually made — not at module load. This lets the build succeed
 * even without the env var. At runtime, the env var must be set or queries
 * will throw.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Return a proxy that throws on actual use, not on import.
    // This allows `next build` to succeed without DATABASE_URL set.
    console.warn('[db] DATABASE_URL is not set. DB queries will fail at runtime.');
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          'DATABASE_URL is not set. Please add it to your environment variables (Vercel → Settings → Environment Variables, or your local .env file).'
        );
      },
    });
  }

  const isNeon = connectionString.includes('neon.tech');
  const pool = new PgPool({ connectionString });
  const adapter = new PrismaPg(pool as any);
  console.log(`[db] Using PrismaPg adapter (${isNeon ? 'Neon' : 'Postgres'})`);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  } as any);
}

export const db = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.__prisma = db;
