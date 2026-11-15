"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SessionAccess from "./SessionAccess";
import { AppProviders, useApp } from "./AppProviders";
import CommandPalette from "./CommandPalette";
import Notifications from "./Notifications";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const sinSidebar =
    pathname.startsWith("/login") || pathname.startsWith("/documentos/");
  const sinAcceso = pathname.startsWith("/administracion");

  if (sinSidebar) return <>{children}</>;

  return (
      <AppProviders>
        <CommandPalette />
        <div className="flex min-h-screen">
          <Sidebar />
          {!sinAcceso && <TopBarActions />}
          <main className="flex-1 min-w-0 pt-14 md:pt-4">{children}</main>
        </div>
      </AppProviders>
  );
}

function TopBarActions() {
  const { auditMode, setAuditMode } = useApp();
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-30 hidden items-center gap-2 md:flex">
      <div className="pointer-events-auto">
        {auditMode && (
          <span className="mr-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            Vista de Auditoría Activa
            <button
              type="button"
              onClick={() => setAuditMode(false)}
              className="ml-1 text-amber-200 hover:text-white"
              title="Salir del modo auditoría"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
            window.dispatchEvent(ev);
          }}
          className="mr-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-200"
          title="Buscar (Ctrl+K)"
        >
          <i className="fa-solid fa-magnifying-glass text-[11px]" aria-hidden="true" />
          Buscar...
          <kbd className="ml-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-[#64748b]">Ctrl K</kbd>
        </button>
        <button
          type="button"
          onClick={() => setAuditMode(!auditMode)}
          className={`mr-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            auditMode
              ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
              : "border-white/10 bg-slate-900/70 text-slate-200 hover:border-amber-400/40 hover:text-amber-200"
          }`}
          title="Modo Auditoría"
        >
          <i className="fa-solid fa-shield-halved text-[11px]" aria-hidden="true" />
          Modo Auditoría
        </button>
        <Notifications />
        <SessionAccess />
      </div>
    </div>
  );
}
