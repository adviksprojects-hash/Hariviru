import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = globalThis;

function getSanitizedConnectionString() {
  let url = process.env.DATABASE_URL || "";
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

let db = globalForPrisma.prisma;

if (!db || !db.slotDisabledDate) {
  db = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
  }
}

export { db };