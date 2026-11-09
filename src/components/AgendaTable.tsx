"use client";

import { useMemo, useState } from "react";
import type { Documento, PuntoSGC } from "@/types/models";
import PuntoModal from "@/components/PuntoModal";
import AgendaFilters, {
  type AgendaFiltersValue,
} from "@/components/AgendaFilters";

export type PlantaFiltro = "Luján" | "Campana" | "Todo";

interface AgendaTableProps {
  puntos: PuntoSGC[];
  documentos?: Documento[];
  filtros: AgendaFiltersValue;
  onFilterChange: (filtros: AgendaFiltersValue) => void;
  planta: PlantaFiltro;
  onPlantaChange: (planta: PlantaFiltro) => void;
}

interface EstadoVisual {
  text: string;
  border: string;
  background: string;
  dot: string;
  glow: string;
  pulse: boolean;
}

const estadosVisuales: Record<string, EstadoVisual> = {
  "En curso": {
    text: "text-sky-200",
    border: "border-sky-400/25",
    background: "bg-sky-400/[0.08]",
    dot: "bg-sky-400",
    glow: "shadow-[0_0_10px_rgba(56,189,248,0.8)]",
    pulse: true,
  },
  Bloqueado: {
    text: "text-rose-200",
    border: "border-rose-400/25",
    background: "bg-rose-400/[0.08]",
    dot: "bg-rose-400",
    glow: "shadow-[0_0_10px_rgba(251,113,133,0.8)]",
    pulse: true,
  },
  Completado: {
    text: "text-emerald-200",
    border: "border-emerald-400/25",
    background: "bg-emerald-400/[0.08]",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_10px_rgba(52,211,153,0.8)]",
    pulse: false,
  },
  Pendiente: {
    text: "text-amber-200",
    border: "border-amber-400/25",
    background: "bg-amber-400/[0.08]",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_10px_rgba(251,191,36,0.8)]",
    pulse: true,
  },
};

function getEstadoVisual(estado?: string): EstadoVisual {
  return estadosVisuales[estado ?? "Pendiente"] ?? estadosVisuales.Pendiente;
}

function avanceDeEstado(estado?: string): number {
  switch (estado) {
    case "Completado":
      return 100;
    case "En curso":
      return 50;
    case "Bloqueado":
      return 25;
    case "Pendiente":
    default:
      return 0;
  }
}

function EstadoBadge({ estado }: { estado?: string }) {
  const nombre = estado ?? "Pendiente";
  const visual = getEstadoVisual(nombre);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium ${visual.border} ${visual.background} ${visual.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${visual.dot} ${visual.glow} ${
          visual.pulse ? "animate-pulse-dot" : ""
        }`}
        aria-hidden="true"
      />
      {nombre}
    </span>
  );
}

const rowCell =
  "px-3 py-4 align-middle transition-all duration-300 first:rounded-l-xl first:pl-4 last:rounded-r-xl last:pr-4 last:text-right group-hover:scale-[1.005] group-hover:bg-slate-900/50 will-change-transform";

export default function AgendaTable({
  puntos,
  documentos = [],
  filtros,
  onFilterChange,
  planta,
  onPlantaChange,
}: AgendaTableProps) {
  const [search, setSearch] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const filteredPuntos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return puntos;
    return puntos.filter((p) => {
      const texto = `${p.titulo ?? ""} ${p.descripcion ?? ""} ${
        p.categoria ?? ""
      } ${(p.plantas ?? []).join(" ")} ${p.responsable ?? ""}`.toLowerCase();
      return texto.includes(term);
    });
  }, [puntos, search]);

  const detalle = detalleId
    ? (puntos.find((p) => p.id === detalleId) ?? null)
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-[0_30px_90px_-50px_rgba(0,0,0,1)] backdrop-blur-md">
      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-3 border-b border-white/5 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-300 shadow-[0_0_22px_-8px_rgba(245,158,11,0.6)]">
            <i className="fa-solid fa-list-check text-xs" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-50">
            Agenda de Trabajo
          </h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-72">
            <i
              className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Buscar tema, categoría o responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar temas de la agenda"
              className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-2 pl-9 pr-9 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-amber-400/60 focus:shadow-[0_0_24px_-8px_rgba(245,158,11,0.45)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-800 hover:text-amber-200"
              >
                <i
                  className="fa-solid fa-xmark text-[10px]"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <div className="relative">
            <i
              className="fa-solid fa-industry pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400/70"
              aria-hidden="true"
            />
            <select
              value={planta}
              onChange={(e) => onPlantaChange(e.target.value as PlantaFiltro)}
              aria-label="Filtrar por planta"
              className="w-full appearance-none rounded-full border border-slate-800 bg-slate-900/50 py-2 pl-9 pr-9 text-xs font-medium text-slate-300 outline-none transition-all duration-300 hover:border-white/20 focus:border-amber-400/60 focus:shadow-[0_0_24px_-8px_rgba(245,158,11,0.45)] sm:w-auto"
            >
              <option value="Luján">Luján</option>
              <option value="Campana">Campana</option>
              <option value="Todo">Ver Todo</option>
            </select>
            <i
              className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="relative border-b border-white/5 px-4 py-2.5">
        <AgendaFilters value={filtros} onChange={onFilterChange} />
      </div>

      {filteredPuntos.length === 0 ? (
        <div className="mx-3 my-3 rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400 shadow-[0_0_30px_-10px_rgba(245,158,11,0.6)]">
            <i
              className="fa-solid fa-magnifying-glass text-lg"
              aria-hidden="true"
            />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-200">
            No hay temas que coincidan con la búsqueda.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Probá con otro término o ajustá los filtros.
          </p>
        </div>
      ) : (
        <div className="relative overflow-x-auto px-2 py-2 sm:px-3">
          <table className="w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr>
                {[
                  "Título",
                  "Planta",
                  "Avance",
                  "Estado",
                  "Responsable",
                  "",
                ].map((label, index) => (
                  <th
                    key={`${label}-${index}`}
                    className="border-b border-white/5 px-3 pb-2 pt-1 text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 first:pl-4 last:pr-4 last:text-right"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPuntos.map((p) => {
                const avance = avanceDeEstado(p.estado);
                const plantas = p.plantas?.length ? p.plantas : ["General"];
                const rowAccent =
                  p.estado === "En curso"
                    ? "bg-sky-400/[0.03]"
                    : p.estado === "Completado"
                      ? "bg-emerald-400/[0.03]"
                      : "";

                return (
                  <tr key={p.id} className={`group ${rowAccent}`}>
                    <td className={rowCell}>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setDetalleId(p.id)}
                          className="text-left font-semibold text-slate-100 transition-colors group-hover:text-amber-200"
                        >
                          {p.titulo}
                        </button>
                        <span className="mt-0.5 text-[10px] text-slate-500">
                          {p.categoria ?? "Sin categoría"}
                        </span>
                      </div>
                    </td>
                    <td className={rowCell}>
                      <div className="flex flex-wrap gap-1">
                        {plantas.map((nombrePlanta) => (
                          <span
                            key={nombrePlanta}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300"
                          >
                            <span
                              className="h-1 w-1 rounded-full bg-slate-500"
                              aria-hidden="true"
                            />
                            {nombrePlanta}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={rowCell}>
                      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-slate-300">
                        <span className="h-1 w-10 overflow-hidden rounded-full bg-slate-800">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            style={{ width: `${avance}%` }}
                          />
                        </span>
                        {avance}%
                      </span>
                    </td>
                    <td className={rowCell}>
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className={rowCell}>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-400">
                        <i
                          className="fa-solid fa-user-tie text-[9px] text-slate-500"
                          aria-hidden="true"
                        />
                        {p.responsable || "A definir"}
                      </span>
                    </td>
                    <td className={rowCell}>
                      <button
                        type="button"
                        onClick={() => setDetalleId(p.id)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-2 py-1 text-[10px] font-medium text-slate-500 transition-all duration-300 group-hover:border-amber-400/20 group-hover:bg-amber-400/10 group-hover:text-amber-200"
                      >
                        Ver detalle
                        <i
                          className="fa-solid fa-arrow-up-right-from-square text-[9px]"
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/5 px-4 py-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.65)]"
            aria-hidden="true"
          />
          Mostrando {filteredPuntos.length} de {puntos.length} puntos
        </span>
      </div>

      {detalle && (
        <PuntoModal
          punto={detalle}
          documentos={documentos}
          onClose={() => setDetalleId(null)}
        />
      )}
    </div>
  );
}
