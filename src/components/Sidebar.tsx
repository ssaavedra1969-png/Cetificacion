"use client";

import Link from "next/link";

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <aside
      className={`w-${isOpen ? 64 : 20} h-screen bg-[#090d1f] border-r border-slate-900 transition-all duration-300 ease-in-out flex flex-col justify-between p-4 shrink-0`}
    >
      {/* Cabecera con logo y botón de toggle */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold font-bold text-lg">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
          </span>
          {!isOpen ? (
            <span className="text-xs font-bold text-white tracking-tight">
              SG
            </span>
          ) : (
            <span className="text-sm font-bold text-white tracking-tight">
              Gestión de la Calidad
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={isOpen ? "Contraer menú" : "Expandir menú"}
        >
          <i
            className={`fa-solid ${isOpen ? "fa-chevron-left" : "fa-chevron-right"} text-xs`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-2">
        <Link
          href="/"
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isOpen
              ? "text-white hover:bg-slate-800/50"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <i className="fa-solid fa-house text-sm" aria-hidden="true" />
          <span className={`hidden sm:block ${isOpen ? "block" : "hidden"}`}>
            Inicio
          </span>
        </Link>
        <Link
          href="/documentoteca"
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isOpen
              ? "text-white hover:bg-slate-800/50"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <i className="fa-solid fa-folder-open text-sm" aria-hidden="true" />
          <span className={`hidden sm:block ${isOpen ? "block" : "hidden"}`}>
            Documentoteca
          </span>
        </Link>
      </nav>

      {/* Pie de perfil */}
      <div className="mt-auto pt-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-900/30">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs">
            A
          </span>
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold text-white truncate ${isOpen ? "block" : "hidden"}`}
            >
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
