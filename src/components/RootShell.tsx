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
        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 hidden justify-end p-4 md:flex">
          <div className="pointer-events-auto">
            <SessionAccess />
          </div>
        </div>
      )}
      <div className="min-h-screen pt-14 md:pl-64 md:pt-0">{children}</div>
    </div>
  );
}
