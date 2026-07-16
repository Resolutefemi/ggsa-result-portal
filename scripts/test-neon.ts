// Quick connectivity test to Neon using the serverless driver.
// This will tell us exactly what credentials we need.
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL!;
console.log('Testing connection with:', connectionString.replace(/:[^:@]+@/, ':***@'));

async function main() {
  const sql = neon(connectionString);
  try {
    const r = await sql`SELECT current_user, current_database()`;
    console.log('✅ Connected!', r);
  } catch (e: any) {
    console.log('❌ Error:', e.message);
    console.log('Code:', e.code);
  }
}
main();
