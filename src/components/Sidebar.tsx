"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SessionAccess from "./SessionAccess";

interface SessionInfo {
  nombre: string;
  rol: string;
}

const NAV = [
  { href: "/", label: "Inicio", icon: "fa-house" },
  { href: "/mapa", label: "Mapa SGC", icon: "fa-sitemap" },
  { href: "/plan", label: "Plan de Trabajo", icon: "fa-chart-gantt" },
  { href: "/documentoteca", label: "Documentoteca", icon: "fa-folder-open" },
  { href: "/instructivo", label: "Instructivo", icon: "fa-book" },
];

const DRIVE_URL =
  "https://drive.google.com/drive/folders/1-KFqOdkE2knS6lYDoArJebB3M-qMkDgO";

const STORAGE_KEY = "sidebarCollapsed";

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? "76px" : "250px",
    );
  }, [collapsed, hydrated]);

  useEffect(() => {
    let activo = true;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!activo) return;
        setSession(data.authenticated ? data.user : null);
      })
      .catch(() => {
        if (activo) setSession(null);
      })
      .finally(() => {
        if (activo) setChecked(true);
      });
    return () => {
      activo = false;
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/login");
    router.refresh();
  };

  const toggle = () => setCollapsed((v) => !v);

  const renderBrand = (compact: boolean) => (
    <Link
      href="/"
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 border-b border-white/10 px-4 py-4 pr-10 ${
        compact ? "justify-center px-2 pr-2" : ""
      }`}
    >
      <Image
        src="/images/logo-falpat.png"
        alt="Grupo Falpat Hormigones"
        width={150}
        height={78}
        className={compact ? "h-7 w-auto" : "h-8 w-auto"}
        priority
      />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-gold">
            Gestión de la Calidad
          </span>
          <span className="block text-[9px] text-[#64748b]">Certificación</span>
        </span>
      )}
    </Link>
  );

  const renderNav = (compact: boolean) => (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                compact ? "justify-center px-2" : ""
              } ${
                active
                  ? "bg-amber-500/10 text-gold border border-amber-400/20"
                  : "text-[#94a3b8] hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              )}
              <i
                className={`fa-solid ${item.icon} w-4 text-center text-[13px]`}
                aria-hidden="true"
              />
              {!compact && item.label}
            </Link>
            {compact && (
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a0f1e]/95 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );

  const renderFooter = (compact: boolean) => (
    <div className="border-t border-white/10 p-2">
      <a
        href={DRIVE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpen(false)}
        className={`mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#c7d2e3] transition-colors hover:border-emerald-400/30 hover:bg-white/10 hover:text-white ${
          compact ? "justify-center px-2" : ""
        }`}
        title="Abrir el Drive original del proyecto"
      >
        <i
          className="fa-brands fa-google-drive w-4 text-center text-[13px] text-emerald-300"
          aria-hidden="true"
        />
        {!compact && (
          <>
            Drive del proyecto
            <i
              className="fa-solid fa-arrow-up-right-from-square ml-auto text-[9px] text-[#64748b]"
              aria-hidden="true"
            />
          </>
        )}
      </a>
      {!checked ? null : session ? (
        <div className="space-y-2">
          <div
            className={`flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ${
              compact ? "justify-center px-2" : ""
            }`}
          >
            <i className="fa-solid fa-circle-user text-gold" aria-hidden="true" />
            {!compact && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {session.nombre}
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#64748b]">
                  {session.rol}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white ${
              compact ? "justify-center px-2" : ""
            }`}
            title="Cerrar sesión"
          >
            <i
              className="fa-solid fa-right-from-bracket w-4 text-center text-[13px]"
              aria-hidden="true"
            />
            {!compact && "Cerrar sesión"}
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className={`flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 ${
            compact ? "px-2" : ""
          }`}
          title="Iniciar sesión"
        >
          <i className="fa-solid fa-lock text-[13px]" aria-hidden="true" />
          {!compact && "Iniciar sesión"}
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar escritorio */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border border-white/10 bg-[rgba(15,23,42,0.72)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[16px] transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] md:flex`}
        style={{
          top: 12,
          left: 12,
          height: "calc(100vh - 24px)",
          width: collapsed ? 76 : 250,
          borderRadius: 18,
          margin: 0,
        }}
      >
        <div className="relative flex h-full flex-col">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-white"
          >
            <i
              className={`fa-solid fa-angles-left text-[11px] transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {renderBrand(collapsed)}
          {renderNav(collapsed)}
          {renderFooter(collapsed)}
        </div>
      </aside>

      {/* Barra superior móvil */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#020617]/95 px-4 py-2.5 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-falpat.png"
            alt="Grupo Falpat Hormigones"
            width={120}
            height={62}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          <SessionAccess compact />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#c7d2e3] transition-colors hover:bg-white/10"
          >
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-white/10 bg-[#050810]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">Menú</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#c7d2e3] transition-colors hover:bg-white/10"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            {renderNav(false)}
            {renderFooter(false)}
          </aside>
        </div>
      )}
    </>
  );
}
