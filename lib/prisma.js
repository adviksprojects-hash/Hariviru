import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export { db };