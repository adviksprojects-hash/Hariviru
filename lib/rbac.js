import { checkUser } from "./checkUser";
import { redirect } from "next/navigation";

export async function getAuthenticatedUser() {
  return await checkUser();
}

export async function requireAuth() {
  const user = await checkUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireRole(allowedRoles = []) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }
  
  return user;
}

export async function requireBranchManager(branchId) {
  const user = await requireAuth();
  
  if (user.role === "ADMIN") {
    return user;
  }
  
  if (user.role === "MANAGER" && user.managedBranchId === branchId) {
    return user;
  }
  
  redirect("/");
}
