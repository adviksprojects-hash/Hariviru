import { db } from "@/lib/prisma";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://haruviru.com";

  // Static marketing & public pages
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/branches`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/franchise`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic branch & booking pages
  let branchRoutes = [];
  try {
    const branches = await db.branch.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    branchRoutes = branches.flatMap((branch) => [
      {
        url: `${baseUrl}/branches/${branch.slug}`,
        lastModified: branch.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/book/${branch.slug}`,
        lastModified: branch.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      },
    ]);
  } catch (err) {
    console.error("[Sitemap Generation Error]:", err);
  }

  return [...staticRoutes, ...branchRoutes];
}
