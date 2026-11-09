"use client";

import { Fragment } from "react";

export interface AgendaFiltersValue {
  estado: string;
  responsable: string;
  planta: string;
  categoria: string;
}

interface AgendaFiltersProps {
  value: AgendaFiltersValue;
  onChange: (filters: AgendaFiltersValue) => void;
}

const estados = [
  {
    value: "",
    label: "Todos",
    dot: "bg-slate-500",
    active: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  },
  {
    value: "Pendiente",
    label: "Pendientes",
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]",
    active: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  },
  {
    value: "En curso",
    label: "En curso",
    dot: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]",
    active: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  },
  {
    value: "Bloqueado",
    label: "Bloqueados",
    dot: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]",
    active: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  },
  {
    value: "Completado",
    label: "Completados",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]",
    active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
] as const;

export default function AgendaFilters({ value, onChange }: AgendaFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {estados.map((estado, index) => {
        const activo = value.estado === estado.value;

        return (
          <Fragment key={estado.value || "todos"}>
            {index > 0 && (
              <span
                className="hidden h-3 w-px bg-slate-800/50 lg:block"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={() => onChange({ ...value, estado: estado.value })}
              aria-pressed={activo}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-300 ${
                activo
                  ? estado.active
                  : "border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  activo ? estado.dot : "bg-slate-700"
                }`}
                aria-hidden="true"
              />
              {estado.label}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
