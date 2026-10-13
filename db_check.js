import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();

    // Create User table in public schema (matching Prisma schema exactly)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "public"."User" (
        "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
        "clerkUserId" TEXT NOT NULL,
        "email"       TEXT NOT NULL,
        "name"        TEXT,
        "imageUrl"    TEXT,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Created public.User table.");

    // Create unique indexes
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "public"."User"("clerkUserId");
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");
    `);
    console.log("Created unique indexes.");

    // Verify
    const check = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'User' AND table_schema NOT IN ('pg_catalog', 'information_schema')
    `);
    console.log("\nUser table locations:");
    check.rows.forEach(r => console.log(`  ${r.table_schema}.${r.table_name}`));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
