import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/HeaderComponents/Header";
import Footer from "@/components/FooterComponents/Footer";
import MainHeaderFooterWrapper from "@/components/Layout/MainHeaderFooterWrapper";

const inter = Inter({
  subsets: ['latin']
})

export const metadata = {
  title: "HaruViru Celebration House | Make Your Special Day Unforgettable",
  description: "Book 1hr private celebration packages with AC Hall, 4K Theater, Dolby Audio, custom cake & decorations across all HaruViru franchise branches.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={inter.className}
      >
        <body className="min-h-screen flex flex-col justify-between bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
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