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
  title: "HaruViru Celebration House | Make Your Special Day Unforgettable",
  description: "Book 1hr private celebration packages with AC Hall, 4K Theater, Dolby Audio, custom cake & decorations across all HaruViru franchise branches.",
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