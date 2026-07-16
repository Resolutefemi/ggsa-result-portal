import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

// Configure neon for serverless / HTTP queries
// (works on Vercel, Next.js edge, Node.js — anywhere)
declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Please set it in your .env file.');
  }

  // Detect Neon vs generic Postgres by host
  const isNeon = connectionString.includes('neon.tech');

  if (isNeon) {
    // Use Neon's serverless driver over HTTP (works in any runtime)
    neonConfig.webSocketConstructor = undefined as any;
    neonConfig.poolQueryViaFetch = true;

    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
    } as any);
  }

  // Generic Postgres fallback (e.g., local Postgres, other hosts)
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  } as any);
}

export const db = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.__prisma = db;
