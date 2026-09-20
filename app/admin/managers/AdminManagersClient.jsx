"use client";

import { useState } from "react";
import { assignManagerToBranch, updateUserRole } from "@/lib/actions";

export default function AdminManagersClient({ initialUsers, branches }) {
  const [users, setUsers] = useState(initialUsers);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      alert("Role update failed: " + err.message);
    }
  };

  const handleBranchAssign = async (userId, branchId) => {
    try {
      const res = await assignManagerToBranch(userId, branchId);
      if (res.success) {
        const assignedBranch = branches.find((b) => b.id === branchId) || null;
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, role: "MANAGER", managedBranchId: branchId, managedBranch: assignedBranch } : u
          )
        );
      }
    } catch (err) {
      alert("Branch assignment failed: " + err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 uppercase">
              <th className="py-3 px-3">User</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Current Role</th>
              <th className="py-3 px-3">Assigned Franchise Branch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="py-4 px-3 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {u.imageUrl ? (
                    <img src={u.imageUrl} alt={u.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                      {u.name?.[0] || "U"}
                    </div>
                  )}
                  <div>
                    <div>{u.name || "User"}</div>
                    <div className="text-[11px] text-gray-400 font-mono">Clerk ID: {u.clerkUserId.substring(0, 12)}...</div>
                  </div>
                </td>

                <td className="py-4 px-3 text-gray-700 dark:text-gray-300 text-xs font-mono">
                  {u.email}
                </td>

                <td className="py-4 px-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                      u.role === "ADMIN"
                        ? "bg-purple-50 text-purple-800 border-purple-300"
                        : u.role === "MANAGER"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    <option value="USER">USER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>

                <td className="py-4 px-3">
                  <select
                    value={u.managedBranchId || ""}
                    onChange={(e) => handleBranchAssign(u.id, e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
