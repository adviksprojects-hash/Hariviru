import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import { getBranchHalls, getAllPackagesForManager, getAllAddOnsForManager } from "@/lib/actions";
import { enrichBranchWithDepositSettings } from "@/lib/deposit-settings";
import ManagerSettingsClient from "./ManagerSettingsClient";

export const metadata = {
  title: "Manager Settings & Halls | HaruViru Celebration House",
};

export default async function ManagerSettingsPage() {
  const user = await requireRole(["MANAGER", "ADMIN"]);

  let branchId = user.managedBranchId;
  if (!branchId) {
    const firstBranch = await db.branch.findFirst({ where: { isActive: true } });
    if (firstBranch) {
      branchId = firstBranch.id;
    }
  }

  if (!branchId) {
    return (
      <main className="min-h-screen p-12 text-center">
        <h1 className="text-2xl font-bold">No Active Branch Found</h1>
        <p className="mt-2 text-gray-500">Please assign a manager to a branch first.</p>
      </main>
    );
  }

  const rawBranch = await db.branch.findUnique({ where: { id: branchId } });
  const branch = enrichBranchWithDepositSettings(rawBranch);

  const { halls } = await getBranchHalls(branchId);
  const { globalPackages, branchPackages } = await getAllPackagesForManager(branchId);
  const { globalAddOns, branchAddOns } = await getAllAddOnsForManager(branchId);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/manager" className="text-xs font-bold text-rose-600 hover:underline">
                ← Manager Dashboard
              </Link>
              <span className="text-gray-400 text-xs">/</span>
              <span className="text-xs text-gray-500 font-semibold">Branch Settings</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              ⚙️ Franchise Settings ({branch.name})
            </h1>
            <p className="text-sm text-gray-500">
              Manage halls (Hall 1, Hall 2), location celebration packages, and celebration add-ons.
            </p>
          </div>
        </div>

        <ManagerSettingsClient
          branch={branch}
          initialHalls={halls || []}
          globalPackages={globalPackages || []}
          initialBranchPackages={branchPackages || []}
          globalAddOns={globalAddOns || []}
          initialBranchAddOns={branchAddOns || []}
        />
      </div>
    </main>
  );
}
