"use client";

import { usePathname } from "next/navigation";

export default function MainHeaderFooterWrapper({ children }) {
  const pathname = usePathname();
  const isAdminOrManager = pathname.startsWith("/admin") || pathname.startsWith("/manager");

  if (isAdminOrManager) return null;

  return <>{children}</>;
}
