import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import AdminBranchesClient from "./AdminBranchesClient";

export const metadata = {
  title: "Franchise Management | Admin Portal",
};

export default async function AdminBranchesPage() {
  await requireRole(["ADMIN"]);

  const branches = await db.branch.findMany({
    include: {
      managers: true,
      _count: { select: { bookings: true, slots: true } }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        
        <Link href="/admin" className="text-xs font-semibold text-rose-600 hover:underline mb-4 inline-block">
          ← Back to Admin Control
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Franchise Branches Directory
            </h1>
            <p className="text-sm text-gray-500">Create & manage celebration house franchise locations across India.</p>
          </div>
        </div>

        <AdminBranchesClient initialBranches={branches} />

      </div>
    </main>
  );
}
