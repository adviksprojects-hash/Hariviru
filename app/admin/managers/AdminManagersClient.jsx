"use client";

import { useState } from "react";
import { assignManagerToBranch, assignManagerByEmail, updateUserRole } from "@/lib/actions";

export default function AdminManagersClient({ initialUsers, branches }) {
  const [users, setUsers] = useState(initialUsers);

  // Form state for assigning manager by email ID
  const [emailInput, setEmailInput] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

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

  const handleAssignByEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !selectedBranchId) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await assignManagerByEmail(emailInput, selectedBranchId);
      if (res.success) {
        const assignedBranch = branches.find((b) => b.id === selectedBranchId) || null;
        // Update user if already in state, or prepend new user
        const existingUserIndex = users.findIndex((u) => u.email.toLowerCase() === emailInput.toLowerCase());
        if (existingUserIndex >= 0) {
          setUsers(
            users.map((u, idx) =>
              idx === existingUserIndex ? { ...u, role: "MANAGER", managedBranchId: selectedBranchId, managedBranch: assignedBranch } : u
            )
          );
        } else {
          setUsers([{ ...res.user, managedBranch: assignedBranch }, ...users]);
        }
        setMessage({ type: "success", text: `Manager request & role granted to ${emailInput}!` });
        setEmailInput("");
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to assign manager." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Assign Manager by Email Form */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
          ✉️ Assign Manager Role by Email ID
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Admin can enter any manager's email address to assign them as the owner/manager of a specific franchise.
        </p>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
            message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            {message.type === "success" ? "✅ " : "⚠️ "}{message.text}
          </div>
        )}

        <form onSubmit={handleAssignByEmailSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Manager Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. manager.pune@haruviru.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Franchise Branch *</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm font-semibold"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 transition-colors"
          >
            {loading ? "Sending..." : "Assign Manager Role →"}
          </button>
        </form>
      </div>

      {/* Users & Roles List Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">All User Accounts & Role Permissions</h2>
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
    </div>
  );
}
