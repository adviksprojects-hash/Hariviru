import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL DB...");

    await client.query(`CREATE SCHEMA IF NOT EXISTS "test_schema";`);
    await client.query(`SET search_path TO "test_schema", public;`);

    // Alter Branch table if columns don't exist
    await client.query(`
      ALTER TABLE "test_schema"."Branch" ADD COLUMN IF NOT EXISTS "mapUrl" TEXT;
      ALTER TABLE "test_schema"."Branch" ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;
      ALTER TABLE "test_schema"."Branch" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
    `);
    console.log("Branch schema columns (mapUrl, instagramHandle, whatsapp) added/verified.");

  } catch (err) {
    console.error("DDL execution error:", err);
  } finally {
    await client.end();
  }
}

run();
