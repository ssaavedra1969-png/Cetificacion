"use client";

import { useState } from "react";

export interface AgendaFiltersValue {
  estado: string;
  responsable: string;
  planta: string;
  categoria: string;
}

interface AgendaFiltersProps {
  onFilterChange?: (filters: AgendaFiltersValue) => void;
  showPlanta?: boolean;
}

const initialFilters: AgendaFiltersValue = {
  estado: "",
  responsable: "",
  planta: "",
  categoria: "",
};

const estados = [
  {
    value: "Pendiente",
    icon: "fa-hourglass-half",
    active:
      "border-amber-400/40 bg-amber-400/15 text-amber-200 shadow-[0_0_22px_-8px_rgba(245,158,11,0.85)]",
  },
  {
    value: "En curso",
    icon: "fa-person-running",
    active:
      "border-cyan-400/40 bg-cyan-400/15 text-cyan-200 shadow-[0_0_22px_-8px_rgba(34,211,238,0.85)]",
  },
  {
    value: "Bloqueado",
    icon: "fa-circle-exclamation",
    active:
      "border-rose-400/40 bg-rose-400/15 text-rose-200 shadow-[0_0_22px_-8px_rgba(244,63,94,0.85)]",
  },
  {
    value: "Completado",
    icon: "fa-circle-check",
    active:
      "border-emerald-400/40 bg-emerald-400/15 text-emerald-200 shadow-[0_0_22px_-8px_rgba(16,185,129,0.85)]",
  },
] as const;

const categorias = [
  "Resguardo de información",
  "Muestras de Campana",
  "Certificados de calibración",
  "Layout",
  "Seguridad vial",
  "Administración",
  "Muestreo",
  "Control de calidad",
  "Documentación del laboratorio",
];

const responsables = ["A definir"];

const pillBase =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40";
const pillIdle =
  "border-white/10 bg-white/[0.04] text-slate-400 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-slate-100";
const selectPill =
  "appearance-none whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-7 pr-8 text-[11px] font-semibold text-slate-300 outline-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-white/[0.07] hover:text-slate-100 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20";
const chipBase =
  "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-200";
const chipIdle =
  "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-slate-200";

export default function AgendaFilters({
  onFilterChange,
  showPlanta = true,
}: AgendaFiltersProps) {
  const [filtros, setFiltros] = useState<AgendaFiltersValue>(initialFilters);

  const aplicar = (next: AgendaFiltersValue) => {
    setFiltros(next);
    onFilterChange?.(next);
  };

  const setField = (name: keyof AgendaFiltersValue, value: string) => {
    aplicar({ ...filtros, [name]: value });
  };

  const activos = [
    filtros.estado,
    filtros.responsable,
    filtros.categoria,
    showPlanta ? filtros.planta : "",
  ].filter(Boolean).length;

  return (
    <div className="sticky top-3 z-30 rounded-2xl border border-white/10 bg-slate-900/50 p-2.5 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
          <i className="fa-solid fa-sliders text-[10px]" aria-hidden="true" />
          Filtros
          {activos > 0 && (
            <span className="rounded-full bg-amber-400/20 px-1.5 text-[10px] font-bold text-amber-100">
              {activos}
            </span>
          )}
        </span>

        <span
          className="hidden h-6 w-px bg-white/10 sm:block"
          aria-hidden="true"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setField("estado", "")}
            aria-pressed={filtros.estado === ""}
            className={`${pillBase} ${
              filtros.estado === ""
                ? "border-slate-400/40 bg-slate-400/15 text-slate-100"
                : pillIdle
            }`}
          >
            Todos
          </button>
          {estados.map((estado) => {
            const activo = filtros.estado === estado.value;
            return (
              <button
                key={estado.value}
                type="button"
                onClick={() => setField("estado", estado.value)}
                aria-pressed={activo}
                className={`${pillBase} ${activo ? estado.active : pillIdle}`}
              >
                <i
                  className={`fa-solid ${estado.icon} text-[9px]`}
                  aria-hidden="true"
                />
                {estado.value}
              </button>
            );
          })}
        </div>

        <span
          className="hidden h-6 w-px bg-white/10 sm:block"
          aria-hidden="true"
        />

        <div className="relative">
          <i
            className="fa-solid fa-user-tie pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400/70"
            aria-hidden="true"
          />
          <select
            value={filtros.responsable}
            onChange={(e) => setField("responsable", e.target.value)}
            aria-label="Filtrar por responsable"
            className={selectPill}
          >
            <option value="">Responsable: todos</option>
            {responsables.map((responsable) => (
              <option key={responsable} value={responsable}>
                {responsable}
              </option>
            ))}
          </select>
          <i
            className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500"
            aria-hidden="true"
          />
        </div>

        {showPlanta && (
          <div className="relative">
            <i
              className="fa-solid fa-industry pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400/70"
              aria-hidden="true"
            />
            <select
              value={filtros.planta}
              onChange={(e) => setField("planta", e.target.value)}
              aria-label="Filtrar por planta"
              className={selectPill}
            >
              <option value="">Planta: todas</option>
              <option value="Campana">Campana</option>
              <option value="Luján">Luján</option>
              <option value="General">General</option>
            </select>
            <i
              className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500"
              aria-hidden="true"
            />
          </div>
        )}

        <details className="group relative">
          <summary
            className={`${pillBase} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
              filtros.categoria
                ? "border-amber-400/40 bg-amber-400/15 text-amber-200 shadow-[0_0_22px_-8px_rgba(245,158,11,0.85)]"
                : pillIdle
            }`}
          >
            <i
              className="fa-solid fa-tags text-[10px] text-amber-400/80"
              aria-hidden="true"
            />
            Categoría
            <span className="max-w-[9rem] truncate text-slate-200">
              {filtros.categoria || "Todas"}
            </span>
            <i
              className="fa-solid fa-chevron-down text-[9px] text-slate-500 transition-transform duration-300 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)] backdrop-blur-2xl">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Categorías
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setField("categoria", "")}
                className={`${chipBase} ${
                  filtros.categoria === ""
                    ? "border-amber-400/40 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-8px_rgba(245,158,11,0.85)]"
                    : chipIdle
                }`}
              >
                Todas
              </button>
              {categorias.map((categoria) => {
                const activa = filtros.categoria === categoria;
                return (
                  <button
                    key={categoria}
                    type="button"
                    onClick={() => setField("categoria", categoria)}
                    className={`${chipBase} ${
                      activa
                        ? "border-amber-400/40 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-8px_rgba(245,158,11,0.85)]"
                        : chipIdle
                    }`}
                  >
                    {categoria}
                  </button>
                );
              })}
            </div>
          </div>
        </details>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[10px] text-slate-500 md:inline">
            {activos > 0 ? `${activos} activos` : "Sin filtros activos"}
          </span>
          {activos > 0 && (
            <button
              type="button"
              onClick={() => aplicar(initialFilters)}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-slate-300 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-400/40 hover:text-rose-200"
            >
              <i
                className="fa-solid fa-rotate-left text-[9px]"
                aria-hidden="true"
              />
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
