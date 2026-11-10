"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Sidebar from "./Sidebar";
import SessionAccess from "./SessionAccess";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [isOpen, setIsOpen] = useState(true);
  const sinSidebar =
    pathname.startsWith("/login") || pathname.startsWith("/documentos/");
  const sinAcceso = pathname.startsWith("/administracion");

  if (sinSidebar) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-slate-950 overflow-x-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div
        className="flex-1 min-w-0 w-full overflow-y-auto p-6 md:p-8 transition-all duration-300 ease-in-out"
      >
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
  );
}
