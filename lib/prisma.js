import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis;

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    "postgresql://test:npg_r5etmd3pfkbR@ep-odd-boat-b50jhb6y.c-7.us-east-2.aws.neon.tech/test?sslmode=verify-full&schema=test_schema"
  );
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool, { schema: "test_schema" });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}