import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL DB...");

    await client.query(`CREATE SCHEMA IF NOT EXISTS "test_schema";`);
    await client.query(`SET search_path TO "test_schema", public;`);

    // Create ENUMs safely in test_schema
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "test_schema"."Role" AS ENUM ('ADMIN', 'MANAGER', 'USER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "test_schema"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "test_schema"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "test_schema"."BookingType" AS ENUM ('ONLINE', 'OFFLINE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "test_schema"."InquiryStatus" AS ENUM ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    console.log("Enums created or verified.");

    // Create Branch table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "test_schema"."Branch" (
        "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
        "name"         TEXT NOT NULL,
        "slug"         TEXT NOT NULL,
        "city"         TEXT NOT NULL,
        "state"        TEXT NOT NULL,
        "address"      TEXT NOT NULL,
        "phone"        TEXT NOT NULL,
        "email"        TEXT NOT NULL,
        "description"  TEXT,
        "images"       TEXT[] DEFAULT ARRAY[]::TEXT[],
        "amenities"    TEXT[] DEFAULT ARRAY[]::TEXT[],
        "pricePerSlot" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "isActive"     BOOLEAN NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Branch_slug_key" ON "test_schema"."Branch"("slug");
    `);
    console.log("Branch table created.");

    // Create User table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "test_schema"."User" (
        "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
        "clerkUserId"     TEXT NOT NULL,
        "email"           TEXT NOT NULL,
        "name"            TEXT,
        "imageUrl"        TEXT,
        "phone"           TEXT,
        "role"            "test_schema"."Role" NOT NULL DEFAULT 'USER',
        "managedBranchId" TEXT,
        "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "User_managedBranchId_fkey" FOREIGN KEY ("managedBranchId") REFERENCES "test_schema"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "test_schema"."User"("clerkUserId");
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "test_schema"."User"("email");
    `);
    console.log("User table created.");

    // Create Slot table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "test_schema"."Slot" (
        "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
        "branchId"  TEXT NOT NULL,
        "title"     TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime"   TEXT NOT NULL,
        "price"     DOUBLE PRECISION NOT NULL,
        "isActive"  BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Slot_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Slot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "test_schema"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log("Slot table created.");

    // Create Booking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "test_schema"."Booking" (
        "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
        "bookingNumber" TEXT NOT NULL,
        "userId"        TEXT,
        "branchId"      TEXT NOT NULL,
        "slotId"        TEXT,
        "slotTitle"     TEXT,
        "customerName"  TEXT NOT NULL,
        "customerEmail" TEXT NOT NULL,
        "customerPhone" TEXT NOT NULL,
        "bookingDate"   TIMESTAMP(3) NOT NULL,
        "totalAmount"   DOUBLE PRECISION NOT NULL,
        "paymentStatus" "test_schema"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "bookingStatus" "test_schema"."BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
        "bookingType"   "test_schema"."BookingType" NOT NULL DEFAULT 'ONLINE',
        "notes"         TEXT,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "test_schema"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Booking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "test_schema"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "test_schema"."Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Booking_bookingNumber_key" ON "test_schema"."Booking"("bookingNumber");
    `);
    console.log("Booking table created.");

    // Create FranchiseInquiry table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "test_schema"."FranchiseInquiry" (
        "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
        "name"             TEXT NOT NULL,
        "email"            TEXT NOT NULL,
        "phone"            TEXT NOT NULL,
        "city"             TEXT NOT NULL,
        "investmentBudget" TEXT NOT NULL,
        "message"          TEXT,
        "status"           "test_schema"."InquiryStatus" NOT NULL DEFAULT 'PENDING',
        "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FranchiseInquiry_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("FranchiseInquiry table created.");

    console.log("\nDatabase DDL synchronization completed successfully for test_schema!");
  } catch (err) {
    console.error("DDL execution error:", err);
  } finally {
    await client.end();
  }
}

run();
