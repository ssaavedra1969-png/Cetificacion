"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function RootShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const sinSidebar =
    pathname.startsWith("/login") || pathname.startsWith("/documentos/");

  if (sinSidebar) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="min-h-screen pt-14 md:pl-64 md:pt-0">{children}</div>
    </div>
  );
}
