"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#090d1f] border-r border-slate-900/60 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
      {/* Cabecera del menú izquierdo - Distribución horizontal fluida */}
      <div className="flex items-center gap-3 w-full border-b border-slate-900/60 pb-5 mb-4 shrink-0">
        <Link href="/" className="shrink-0">
          <img
            src="https://grupofalpat.com.ar"
            alt="Grupo Falpat"
            className="h-9 w-auto object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://grupofalpat.com.ar";
            }}
          />
        </Link>
        <div className="flex flex-col justify-center shrink-0">
          <span className="text-[11px] font-bold tracking-wide text-orange-500 uppercase">
            GESTIÓN DE LA CALIDAD
          </span>
          <span className="text-[11px] text-slate-400">Certificación</span>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800/50 transition-colors"
        >
          <i className="fa-solid fa-house text-sm" aria-hidden="true" />
          <span className="text-xs font-medium">Inicio</span>
        </Link>
        <Link
          href="/documentoteca"
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800/50 transition-colors"
        >
          <i className="fa-solid fa-folder-open text-sm" aria-hidden="true" />
          <span className="text-xs font-medium">Documentoteca</span>
        </Link>
      </nav>

      {/* Pie de perfil */}
      <div className="mt-auto pt-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-900/30">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs">
            A
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              Administrador
            </p>
            <p className="text-[10px] text-slate-500 truncate">ADMIN</p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar sesión"
          >
            <i
              className="fa-solid fa-right-from-bracket text-[10px]"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
