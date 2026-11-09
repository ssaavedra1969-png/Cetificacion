"use client";

import { useMemo, useState } from "react";
import type { Documento, PuntoSGC } from "@/types/models";
import PuntoModal from "@/components/PuntoModal";

interface AgendaTableProps {
  puntos: PuntoSGC[];
  documentos?: Documento[];
}

function statusClasses(estado?: string): string {
  switch (estado) {
    case "En curso":
      return "border-sky-400/25 bg-sky-400/10 text-sky-300";
    case "Bloqueado":
      return "border-rose-400/25 bg-rose-400/10 text-rose-300";
    case "Completado":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    case "Pendiente":
    default:
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
}

export default function AgendaTable({
  puntos,
  documentos = [],
}: AgendaTableProps) {
  const [view, setView] = useState<"table" | "cards">("table");
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
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-400">
            <i className="fa-solid fa-list-check text-xs" aria-hidden="true" />
          </span>
          <h2 className="font-display text-lg font-bold text-slate-50">
            Agenda de Trabajo
          </h2>
        </div>

        <select
          value={view}
          onChange={(e) => setView(e.target.value as "table" | "cards")}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none transition focus:border-amber-400/60"
          aria-label="Cambiar vista"
        >
          <option value="table">Tabla</option>
          <option value="cards">Tarjetas</option>
        </select>
      </div>

      <div className="relative mb-2">
        <i
          className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Buscar título, descripción, planta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 md:w-80"
        />
      </div>

      <p className="mb-4 flex items-center gap-1.5 text-[11px] text-slate-500">
        <i
          className="fa-solid fa-circle-info text-amber-400/80"
          aria-hidden="true"
        />
        Los temas compartidos por ambas plantas aparecen en las dos solapas.
      </p>

      {filteredPuntos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
            <i
              className="fa-solid fa-magnifying-glass text-lg"
              aria-hidden="true"
            />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-200">
            No hay temas que coincidan con la búsqueda.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Probá con otro término o ajustá los filtros laterales.
          </p>
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {[
                  "Título",
                  "Categoría",
                  "Planta(s)",
                  "Estado",
                  "Responsable",
                  "",
                ].map((label, index) => (
                  <th
                    key={`${label}-${index}`}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPuntos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-800/70 transition-colors hover:bg-slate-800/40"
                >
                  <td className="px-3 py-3 font-medium text-slate-100">
                    <button
                      type="button"
                      onClick={() => setDetalleId(p.id)}
                      className="text-left transition-colors hover:text-amber-300"
                    >
                      {p.titulo}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    {p.categoria ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    <span>{(p.plantas ?? []).join(", ") || "-"}</span>
                    {(p.plantas?.length ?? 0) > 1 && (
                      <span className="ml-1.5 whitespace-nowrap rounded-full border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                        Compartido
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(
                        p.estado,
                      )}`}
                    >
                      {p.estado ?? "Pendiente"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    {p.responsable || "A definir"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetalleId(p.id)}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-amber-400 transition-colors hover:text-amber-300"
                    >
                      Ver detalle
                      <i
                        className="fa-solid fa-arrow-up-right-from-square text-[10px]"
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredPuntos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setDetalleId(p.id)}
              className="block rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-slate-800/60"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="block font-semibold text-slate-100">
                  {p.titulo}
                </span>
                <span
                  className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(
                    p.estado,
                  )}`}
                >
                  {p.estado ?? "Pendiente"}
                </span>
              </span>
              {p.descripcion && (
                <span className="mt-2 block line-clamp-2 text-sm leading-relaxed text-slate-400">
                  {p.descripcion}
                </span>
              )}
              <span className="mt-3 block space-y-1 text-[11px] text-slate-400">
                <span className="block">
                  <i className="fa-solid fa-tag mr-1.5 text-amber-400/80" />
                  {p.categoria ?? "-"}
                </span>
                <span className="block">
                  <i className="fa-solid fa-industry mr-1.5 text-amber-400/80" />
                  {(p.plantas ?? []).join(", ") || "-"}
                  {(p.plantas?.length ?? 0) > 1 && (
                    <span className="ml-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                      Compartido
                    </span>
                  )}
                </span>
                <span className="block">
                  <i className="fa-solid fa-user-tie mr-1.5 text-amber-400/80" />
                  {p.responsable || "A definir"}
                </span>
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                Ver detalle
                <i
                  className="fa-solid fa-arrow-up-right-from-square text-[10px]"
                  aria-hidden="true"
                />
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Mostrando {filteredPuntos.length} de {puntos.length} puntos
      </p>

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
