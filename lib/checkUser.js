import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest User";
    const email = user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      console.error("User does not have an email address");
      return null;
    }

    let existingUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
      include: { managedBranch: true },
    });

    // Determine initial role: Check env or fallback
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@haruviru.com";
    const isSuperAdmin = email.toLowerCase() === superAdminEmail.toLowerCase();

    let targetRole = existingUser?.role || (isSuperAdmin ? "ADMIN" : "USER");

    const dbUser = await db.user.upsert({
      where: { clerkUserId: user.id },
      update: {
        name,
        email,
        imageUrl: user.imageUrl,
        role: existingUser ? existingUser.role : targetRole,
      },
      create: {
        clerkUserId: user.id,
        name,
        email,
        imageUrl: user.imageUrl,
        role: targetRole,
      },
      include: {
        managedBranch: true,
      },
    });

    // Sync publicMetadata to Clerk if missing or updated
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
