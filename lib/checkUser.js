import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const email = user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      console.error("User does not have an email address");
      return null;
    }

    const dbUser = await db.user.upsert({
      where: { clerkUserId: user.id },
      update: {
        name,
        email,
        imageUrl: user.imageUrl,
      },
      create: {
        clerkUserId: user.id,
        name,
        email,
        imageUrl: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("Error syncing Clerk user to db:", error);
    return null;
  }
};
