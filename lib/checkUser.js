import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest User";
    const primaryEmail = user.emailAddresses?.[0]?.emailAddress;

    if (!primaryEmail) {
      console.error("User does not have an email address");
      return null;
    }

    const cleanEmail = primaryEmail.trim().toLowerCase();
    const allUserEmails = (user.emailAddresses || [])
      .map((e) => e.emailAddress?.trim().toLowerCase())
      .filter(Boolean);

    // Determine if this user is configured as super admin in environment
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@haruviru.com").trim().toLowerCase();
    const isSuperAdmin = allUserEmails.includes(superAdminEmail);

    // 1. Try finding existing user by Clerk ID first
    let dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
      include: { managedBranch: true },
    });

    // 2. If not found by clerkUserId, look up by email (handles pre-assigned managers added by Admin!)
    if (!dbUser && allUserEmails.length > 0) {
      const userByEmail = await db.user.findFirst({
        where: {
          email: { in: allUserEmails, mode: "insensitive" },
        },
        include: { managedBranch: true },
      });

      if (userByEmail) {
        // Found pre-assigned manager or existing user by email!
        // Link real Clerk user.id, preserve their MANAGER role & branch assignment
        const effectiveRole = isSuperAdmin ? "ADMIN" : (userByEmail.role || "USER");
        const resolvedName =
          userByEmail.name &&
          !userByEmail.name.toLowerCase().startsWith("pending") &&
          userByEmail.name !== "Guest User"
            ? userByEmail.name
            : name;

        dbUser = await db.user.update({
          where: { id: userByEmail.id },
          data: {
            clerkUserId: user.id,
            email: cleanEmail,
            name: resolvedName,
            imageUrl: user.imageUrl || userByEmail.imageUrl,
            role: effectiveRole,
          },
          include: { managedBranch: true },
        });
      }
    }

    // 3. If still not found, create a brand-new user record
    if (!dbUser) {
      const initialRole = isSuperAdmin ? "ADMIN" : "USER";
      dbUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          name,
          email: cleanEmail,
          imageUrl: user.imageUrl,
          role: initialRole,
        },
        include: { managedBranch: true },
      });
    } else {
      // Check if there was also a separate pending manager record created for this email
      if (dbUser.role !== "MANAGER" && !isSuperAdmin && allUserEmails.length > 0) {
        const pendingManager = await db.user.findFirst({
          where: {
            email: { in: allUserEmails, mode: "insensitive" },
            role: "MANAGER",
            id: { not: dbUser.id },
          },
        });

        if (pendingManager) {
          dbUser = await db.user.update({
            where: { id: dbUser.id },
            data: {
              role: "MANAGER",
              managedBranchId: pendingManager.managedBranchId,
            },
            include: { managedBranch: true },
          });
          await db.user.delete({ where: { id: pendingManager.id } });
        }
      }

      // User was found. Ensure email, image, and superAdmin role are synced
      const effectiveRole = isSuperAdmin ? "ADMIN" : dbUser.role;
      const needsUpdate =
        dbUser.email.toLowerCase() !== cleanEmail ||
        (isSuperAdmin && dbUser.role !== "ADMIN") ||
        (!dbUser.imageUrl && user.imageUrl);

      if (needsUpdate) {
        dbUser = await db.user.update({
          where: { id: dbUser.id },
          data: {
            email: cleanEmail,
            imageUrl: user.imageUrl || dbUser.imageUrl,
            role: effectiveRole,
          },
          include: { managedBranch: true },
        });
      }
    }

    // 4. Sync publicMetadata to Clerk so client sessions & Clerk tokens have current role & branch
    if (
      user.publicMetadata?.role !== dbUser.role ||
      user.publicMetadata?.managedBranchId !== dbUser.managedBranchId
    ) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: {
            role: dbUser.role,
            managedBranchId: dbUser.managedBranchId || null,
          },
        });
      } catch (clerkErr) {
        console.warn("Notice: Clerk publicMetadata sync skipped/failed:", clerkErr?.message);
      }
    }

    return dbUser;
  } catch (error) {
    console.error("Error syncing Clerk user to db:", error);
    return null;
  }
};
