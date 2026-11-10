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
    <div className="flex min-h-screen w-full bg-[#030712] overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 bg-[#030712] p-6 md:p-8">
        <div className="max-w-6xl w-full mx-auto space-y-8 flex flex-col items-center">
          {!sinAcceso && (
            <div className="pointer-events-none fixed inset-x-0 top-0 z-30 hidden justify-end p-4 md:flex">
              <div className="pointer-events-auto">
                <SessionAccess />
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
