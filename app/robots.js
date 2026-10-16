export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://haruviru.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/branches", "/branches/*", "/book/*", "/about-us", "/contact", "/franchise", "/privacy-policy", "/terms"],
        disallow: ["/admin/", "/manager/", "/api/", "/sign-in/", "/sign-up/", "/bookings/"],
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended"],
        allow: ["/", "/branches", "/branches/*", "/book/*", "/about-us", "/contact", "/franchise", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin/", "/manager/", "/api/", "/sign-in/", "/sign-up/", "/bookings/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
