import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { getAllPackagesForAdmin, getAllAddOnsForAdmin } from "@/lib/actions";
import AdminSettingsClient from "./AdminSettingsClient";

export const metadata = {
  title: "Admin Settings | HaruViru Celebration House",
};

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN"]);

  const { packages } = await getAllPackagesForAdmin();
  const { addOns } = await getAllAddOnsForAdmin();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header navigation bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs font-bold text-rose-600 hover:underline">
                ← Admin Dashboard
              </Link>
              <span className="text-gray-400 text-xs">/</span>
              <span className="text-xs text-gray-500 font-semibold">Settings</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              ⚙️ Admin System Settings
            </h1>
            <p className="text-sm text-gray-500">
              Manage default celebration packages and global celebration add-ons.
            </p>
          </div>
        </div>

        <AdminSettingsClient
          initialPackages={packages || []}
          initialAddOns={addOns || []}
        />
      </div>
    </main>
  );
}
