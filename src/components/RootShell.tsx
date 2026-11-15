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
    <div className="flex min-h-screen">
      <Sidebar />
      {!sinAcceso && (
        <div className="pointer-events-none fixed right-4 top-4 z-30 hidden md:flex">
          <div className="pointer-events-auto">
            <SessionAccess />
          </div>
        </div>
      )}
      <main className="flex-1 min-w-0 pt-14 md:pt-4">{children}</main>
    </div>
  );
}
