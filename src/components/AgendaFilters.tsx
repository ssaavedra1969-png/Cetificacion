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
}

const initialFilters: AgendaFiltersValue = {
  estado: "",
  responsable: "",
  planta: "",
  categoria: "",
};

const selectClass =
  "w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20";

export default function AgendaFilters({ onFilterChange }: AgendaFiltersProps) {
  const [filtros, setFiltros] = useState<AgendaFiltersValue>(initialFilters);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const next = { ...filtros, [name]: value };
    setFiltros(next);
    onFilterChange?.(next);
  };

  const fields = [
    {
      name: "estado",
      label: "Estado",
      icon: "fa-signal",
      options: ["Pendiente", "En curso", "Bloqueado", "Completado"],
      allLabel: "Todos",
    },
    {
      name: "responsable",
      label: "Responsable",
      icon: "fa-user-tie",
      options: ["Responsable A", "Responsable B", "A definir"],
      allLabel: "Todos",
    },
    {
      name: "planta",
      label: "Planta",
      icon: "fa-industry",
      options: ["Campana", "Luján", "General"],
      allLabel: "Todas",
    },
    {
      name: "categoria",
      label: "Categoría",
      icon: "fa-tags",
      options: [
        "Resguardo de información",
        "Muestras de Campana",
        "Certificados de calibración",
        "Layout",
        "Seguridad vial",
        "Administración",
        "Muestreo",
        "Control de calidad",
        "Documentación del laboratorio",
      ],
      allLabel: "Todas",
    },
  ] as const;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <i className="fa-solid fa-sliders text-gold" aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb0c9]">
          Filtros
        </h3>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#9fb0c9]">
              <i
                className={`fa-solid ${field.icon} text-[10px] text-gold/70`}
                aria-hidden="true"
              />
              {field.label}
            </label>
            <select
              name={field.name}
              value={filtros[field.name]}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">{field.allLabel}</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
