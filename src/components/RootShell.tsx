"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SessionAccess from "./SessionAccess";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const sinSidebar =
    pathname.startsWith("/login") || pathname.startsWith("/documentos/");
  const sinAcceso = pathname.startsWith("/administracion");

  if (sinSidebar) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Sidebar />
    {!sinAcceso && (
      <div className="pointer-events-none fixed right-4 top-4 z-30 hidden md:flex">
        <div className="pointer-events-auto">
          <SessionAccess />
        </div>
      </div>
    )}
    <div className="min-h-screen pt-14 transition-[padding] duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] md:pl-[var(--sidebar-w,250px)] md:pt-4">{children}</div>
    </div>
  );
}
