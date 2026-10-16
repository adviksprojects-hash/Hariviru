import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/HeaderComponents/Header";
import Footer from "@/components/FooterComponents/Footer";
import MainHeaderFooterWrapper from "@/components/Layout/MainHeaderFooterWrapper";
import WhatsAppRealtimeNotifier from "@/components/WhatsApp/WhatsAppRealtimeNotifier";
import ServiceWorkerRegister from "@/components/PWA/ServiceWorkerRegister";

const inter = Inter({
  subsets: ['latin']
})

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://haruviru.com"),
  title: {
    default: "HaruViru Celebration House | Private Mini Theater & Party Place in Pune",
    template: "%s | HaruViru Celebration House",
  },
  description:
    "Book 1hr private celebration packages with AC Hall, 4K Theater, Dolby Audio, custom cake & decorations across HaruViru franchise branches in Pune, Shikrapur, Wagholi, Solapur, Baramati & Maharashtra.",
  keywords: [
    "Celebration House",
    "Celebration House Pune",
    "Celebration House near me",
    "Celebration House Wagholi",
    "Celebration House Shikrapur",
    "Celebration House Shirur",
    "Celebration House Baramati",
    "Celebration House Solapur",
    "Celebration House Pandharpur",
    "Private Theater Pune",
    "Private mini theater for birthday",
    "Anniversary surprise party hall",
    "Couple celebration room",
    "1 hour private celebration space",
    "HaruViru",
  ],
  authors: [{ name: "HaruViru Celebration House", url: "https://haruviru.com" }],
  creator: "HaruViru Celebration House",
  publisher: "HaruViru Celebration House",
  manifest: "/manifest.json",
  applicationName: "HaruViru",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HaruViru",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "HaruViru Celebration House | Private Mini Theaters & Celebration Lounges",
    description: "Book private 1hr celebration spaces with 4K Theater, Dolby Audio, ambient lights & custom decor.",
    url: "https://haruviru.com",
    siteName: "HaruViru Celebration House",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "HaruViru Celebration House",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HaruViru Celebration House | Private Mini Theaters",
    description: "Book private 1hr celebration spaces with 4K Theater, Dolby Audio, ambient lights & custom decor.",
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={inter.className}
      >
        <body className="min-h-screen flex flex-col justify-between bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
          <ServiceWorkerRegister />
          <WhatsAppRealtimeNotifier />
          <MainHeaderFooterWrapper>
            <Header />
          </MainHeaderFooterWrapper>
          <div className="flex-1">
            {children}
          </div>
          <MainHeaderFooterWrapper>
            <Footer />
          </MainHeaderFooterWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}