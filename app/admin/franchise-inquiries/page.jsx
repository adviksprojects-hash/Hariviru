import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import AdminInquiriesClient from "./AdminInquiriesClient";

export const metadata = {
  title: "Franchise Leads | Admin Portal",
};

export default async function AdminInquiriesPage() {
  await requireRole(["ADMIN"]);

  const inquiries = await db.franchiseInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        
        <Link href="/admin" className="text-xs font-semibold text-rose-600 hover:underline mb-4 inline-block">
          ← Back to Admin Control
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Franchise Application Leads
          </h1>
          <p className="text-sm text-gray-500">Review business inquiry submissions from prospective franchise partners.</p>
        </div>

        <AdminInquiriesClient initialInquiries={inquiries} />

      </div>
    </main>
  );
}
