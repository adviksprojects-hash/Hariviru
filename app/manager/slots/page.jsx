import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import ManagerSlotsClient from "./ManagerSlotsClient";

export const metadata = {
  title: "Slot Configuration | Manager Portal",
};

export default async function ManagerSlotsPage() {
  const user = await requireRole(["MANAGER", "ADMIN"]);

  let branchId = user.managedBranchId;

  if (!branchId) {
    const firstBranch = await db.branch.findFirst({ where: { isActive: true } });
    if (!firstBranch) return <div className="p-8">No branch found.</div>;
    branchId = firstBranch.id;
  }

  const branch = await db.branch.findUnique({
    where: { id: branchId },
    include: {
      slots: { orderBy: { startTime: "asc" } },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-4xl">
        
        <Link href="/manager" className="text-xs font-semibold text-rose-600 hover:underline mb-4 inline-block">
          ← Back to Manager Overview
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {branch.name} — Time Slots
            </h1>
            <p className="text-sm text-gray-500">Configure daily celebration slots & pricing for this branch.</p>
          </div>
        </div>

        <ManagerSlotsClient branch={branch} initialSlots={branch.slots} />

      </div>
    </main>
  );
}
