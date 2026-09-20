import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import AdminManagersClient from "./AdminManagersClient";

export const metadata = {
  title: "Manager Role Assignment | Admin Portal",
};

export default async function AdminManagersPage() {
  await requireRole(["ADMIN"]);

  const users = await db.user.findMany({
    include: {
      managedBranch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const branches = await db.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        
        <Link href="/admin" className="text-xs font-semibold text-rose-600 hover:underline mb-4 inline-block">
          ← Back to Admin Control
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            User Roles & Branch Manager Assignment
          </h1>
          <p className="text-sm text-gray-500">Promote users to Branch Managers and assign them to specific celebration house franchises.</p>
        </div>

        <AdminManagersClient initialUsers={users} branches={branches} />

      </div>
    </main>
  );
}
