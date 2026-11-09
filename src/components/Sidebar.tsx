"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionInfo {
  nombre: string;
  rol: string;
}

const NAV = [
  { href: "/", label: "Inicio", icon: "fa-house" },
  { href: "/documentoteca", label: "Documentoteca", icon: "fa-folder-open" },
  { href: "/administracion", label: "Administración", icon: "fa-sliders" },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checked, setChecked] = useState(false);

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

  const renderBrand = () => (
    <Link
      href="/"
      onClick={() => setOpen(false)}
      className="flex items-center gap-3 border-b border-white/10 px-4 py-4"
    >
      <Image
        src="/images/logo-falpat.png"
        alt="Grupo Falpat Hormigones"
        width={150}
        height={78}
        className="h-8 w-auto"
        priority
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-gold">
          Gestión de la Calidad
        </span>
        <span className="block text-[9px] text-[#64748b]">Certificación</span>
      </span>
    </Link>
  );

  const renderNav = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-gold/15 text-gold"
                : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
            }`}
          >
            <i
              className={`fa-solid ${item.icon} w-4 text-center text-[13px]`}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = () => (
    <div className="border-t border-white/10 p-3">
      {!checked ? null : session ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <i
              className="fa-solid fa-circle-user text-gold"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {session.nombre}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#64748b]">
                {session.rol}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
          >
            <i
              className="fa-solid fa-right-from-bracket w-4 text-center text-[13px]"
              aria-hidden="true"
            />
            Cerrar sesión
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          <i className="fa-solid fa-lock text-[13px]" aria-hidden="true" />
          Iniciar sesión
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#050810] md:flex">
        {renderBrand()}
        {renderNav()}
        {renderFooter()}
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#c7d2e3] transition-colors hover:bg-white/10"
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
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
            {renderNav()}
            {renderFooter()}
          </aside>
        </div>
      )}
    </>
  );
}
