import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as PgPool } from 'pg';

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Please set it in your .env file.');
  }

  // For Neon, prefer the regular `pg` driver through the pooler endpoint
  // (the pooler supports TCP/5432 with PgBouncer, so PrismaPg works).
  // This avoids edge-runtime fetch issues in some Next.js setups.
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
