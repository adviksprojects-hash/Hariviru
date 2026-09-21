import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = globalThis;

function getSanitizedConnectionString() {
  let url = process.env.DATABASE_URL || "";
  // Ensure sslmode is set to verify-full to eliminate Node pg SSL mode security warning
  if (url.includes("sslmode=require")) {
    url = url.replace("sslmode=require", "sslmode=verify-full");
  } else if (url.includes("sslmode=prefer")) {
    url = url.replace("sslmode=prefer", "sslmode=verify-full");
  }
  return url;
}

function createPrismaClient() {
  const connectionString = getSanitizedConnectionString();
  const pool = new pg.Pool({
    connectionString,
  });
  
  const adapter = new PrismaPg(pool, { schema: "test_schema" });
  return new PrismaClient({ adapter });
}

const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export { db };