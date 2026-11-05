"use client";

import { useMemo, useState } from "react";

interface Punto {
  id: string;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  plantas?: string[];
  estado?: string;
  responsable?: string;
  prioridad?: string;
  fechaCompromiso?: string;
}

interface AgendaTableProps {
  puntos: Punto[];
}

function statusClasses(estado?: string): string {
  switch (estado) {
    case "En curso":
      return "border-blue-400/25 bg-blue-400/10 text-blue-300";
    case "Bloqueado":
      return "border-red-400/25 bg-red-400/10 text-red-300";
    case "Completado":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    case "Pendiente":
    default:
      return "border-white/15 bg-white/5 text-gray-300";
  }
}

export default function AgendaTable({ puntos }: AgendaTableProps) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");

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

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-list-check text-gold" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-white">
            Agenda de Trabajo SGC
          </h2>
        </div>

        <select
          value={view}
          onChange={(e) => setView(e.target.value as "table" | "cards")}
          className="rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-1.5 text-xs text-white outline-none transition focus:border-gold/60"
          aria-label="Cambiar vista"
        >
          <option value="table">Tabla</option>
          <option value="cards">Tarjetas</option>
        </select>
      </div>

      <div className="relative mb-4">
        <i
          className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6f7f99]"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Buscar título, descripción, planta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#0a0e17] py-2 pl-9 pr-3 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20 md:w-80"
        />
      </div>

      {filteredPuntos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#7f8ea8]">
          No hay puntos que coincidan con la búsqueda.
        </p>
      ) : view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  "Título",
                  "Categoría",
                  "Planta(s)",
                  "Estado",
                  "Responsable",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]"
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
                  className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                >
                  <td className="px-3 py-3 font-medium text-white">
                    {p.titulo}
                  </td>
                  <td className="px-3 py-3 text-[#9fb0c9]">
                    {p.categoria ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-[#9fb0c9]">
                    {(p.plantas ?? []).join(", ") || "-"}
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
                  <td className="px-3 py-3 text-[#9fb0c9]">
                    {p.responsable || "A definir"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredPuntos.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{p.titulo}</h3>
                <span
                  className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(
                    p.estado,
                  )}`}
                >
                  {p.estado ?? "Pendiente"}
                </span>
              </div>
              {p.descripcion && (
                <p className="mt-2 text-sm leading-relaxed text-[#9fb0c9]">
                  {p.descripcion}
                </p>
              )}
              <div className="mt-3 space-y-1 text-[11px] text-[#7f8ea8]">
                <div>
                  <i className="fa-solid fa-tag mr-1.5 text-gold/70" />
                  {p.categoria ?? "-"}
                </div>
                <div>
                  <i className="fa-solid fa-industry mr-1.5 text-gold/70" />
                  {(p.plantas ?? []).join(", ") || "-"}
                </div>
                <div>
                  <i className="fa-solid fa-user-tie mr-1.5 text-gold/70" />
                  {p.responsable || "A definir"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-[#6f7f99]">
        Mostrando {filteredPuntos.length} de {puntos.length} puntos
      </p>
    </div>
  );
}
