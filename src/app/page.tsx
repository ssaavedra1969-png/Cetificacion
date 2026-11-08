"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Hero from "@/components/Hero";
import KPIs from "@/components/KPIs";
import AgendaTable from "@/components/AgendaTable";
import AgendaFilters, {
  type AgendaFiltersValue,
} from "@/components/AgendaFilters";
import type { Documento, PuntoSGC } from "@/types/models";

const PLANTAS = ["Luján", "Campana"] as const;
type Planta = (typeof PLANTAS)[number];

function perteneceAPlanta(punto: PuntoSGC, planta: Planta): boolean {
  const plantas = punto.plantas ?? [];
  if (plantas.length === 0) return true;
  return plantas.includes(planta) || plantas.includes("General");
}

const initialFilters: AgendaFiltersValue = {
  estado: "",
  responsable: "",
  planta: "",
  categoria: "",
};

interface AgendaCargada {
  puntos: PuntoSGC[];
  documentos: Documento[];
}

export default function Dashboard() {
  const [puntos, setPuntos] = useState<PuntoSGC[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<AgendaFiltersValue>(initialFilters);
  const [plantaActiva, setPlantaActiva] = useState<Planta>("Luján");

  const cargarTodo = useCallback(async (): Promise<AgendaCargada> => {
    const [agendaRes, docsRes] = await Promise.all([
      fetch("/api/agenda"),
      fetch("/api/documentos"),
    ]);

    if (!agendaRes.ok) throw new Error("No se pudo cargar la agenda");

    const agendaData = await agendaRes.json();
    const docsData = docsRes.ok
      ? await docsRes.json()
      : { documentos: [] };

    return {
      puntos: (Array.isArray(agendaData.puntos)
        ? agendaData.puntos
        : []) as PuntoSGC[],
      documentos: (Array.isArray(docsData.documentos)
        ? docsData.documentos
        : []) as Documento[],
    };
  }, []);

  const aplicarDatos = useCallback((data: AgendaCargada) => {
    setPuntos(data.puntos);
    setDocumentos(data.documentos);
  }, []);

  useEffect(() => {
    let activo = true;
    cargarTodo()
      .then((data) => {
        if (activo) aplicarDatos(data);
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error al cargar agenda:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [cargarTodo, aplicarDatos]);

  const puntosDe = useCallback(
    (planta: Planta) => puntos.filter((p) => perteneceAPlanta(p, planta)),
    [puntos],
  );

  const puntosPlanta = useMemo(
    () => puntosDe(plantaActiva),
    [puntosDe, plantaActiva],
  );

  const filteredPuntos = useMemo(() => {
    return puntosPlanta.filter((p) => {
      if (filtros.estado && p.estado !== filtros.estado) return false;
      if (filtros.responsable && p.responsable !== filtros.responsable)
        return false;
      if (filtros.categoria && p.categoria !== filtros.categoria) return false;
      return true;
    });
  }, [puntosPlanta, filtros]);

  const total = puntosPlanta.length;
  const pendientes = puntosPlanta.filter((p) => p.estado === "Pendiente").length;
  const enCurso = puntosPlanta.filter((p) => p.estado === "En curso").length;
  const bloqueados = puntosPlanta.filter((p) => p.estado === "Bloqueado").length;
  const completados = puntosPlanta.filter(
    (p) => p.estado === "Completado",
  ).length;
  const avance = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <main className="min-h-screen">
      {/* ===== Hero ===== */}
      <Hero />

      {/* ===== Dashboard ===== */}
      <section
        id="agenda"
        className="relative mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Panel de control
            </h2>
            <p className="mt-1 text-sm text-[#9fb0c9]">
              Agenda de certificación por planta
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#9fb0c9]">
            <i className="fa-solid fa-clock-rotate-left text-gold/70" aria-hidden="true" />
            Actualizado al abrir
          </span>
        </div>

        <div
          className="mb-6 inline-flex w-full rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:w-auto"
          role="group"
          aria-label="Seleccionar planta"
        >
          {PLANTAS.map((planta) => {
            const activa = plantaActiva === planta;
            return (
              <button
                key={planta}
                type="button"
                onClick={() => setPlantaActiva(planta)}
                aria-pressed={activa}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none ${
                  activa
                    ? "bg-gradient-to-r from-gold to-gold-dark text-[#1a1405] shadow-[0_10px_30px_-10px_rgba(212,175,55,0.7)]"
                    : "text-[#9fb0c9] hover:bg-white/5 hover:text-white"
                }`}
              >
                <i className="fa-solid fa-industry" aria-hidden="true" />
                {planta}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activa ? "bg-black/15" : "bg-white/10"
                  }`}
                >
                  {puntosDe(planta).length}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <i
              className="fa-solid fa-triangle-exclamation"
              aria-hidden="true"
            />
            Error cargando los datos: {error}
          </div>
        )}

        <div
          id="agenda-tabla"
          className="grid grid-cols-1 gap-5 lg:grid-cols-4"
        >
          <div className="space-y-5 lg:col-span-1">
            <div className="glass rounded-2xl p-5">
              <KPIs
                total={total}
                pendientes={pendientes}
                enCurso={enCurso}
                bloqueados={bloqueados}
                completados={completados}
                avance={avance}
              />
            </div>
            <AgendaFilters onFilterChange={setFiltros} showPlanta={false} />
          </div>
          <div className="lg:col-span-3">
            {loading ? (
              <div className="glass flex items-center justify-center rounded-2xl p-12 text-sm text-[#9fb0c9]">
                <i
                  className="fa-solid fa-spinner fa-spin mr-2 text-gold"
                  aria-hidden="true"
                />
                Cargando agenda...
              </div>
            ) : (
              <AgendaTable
                puntos={filteredPuntos}
                documentos={documentos}
              />
            )}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-[#6f7f99] sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Grupo Falpat SRL · Sistema de Gestión de la Calidad</p>
          <p className="flex items-center gap-1.5">
            <i
              className="fa-solid fa-shield-halved text-gold/70"
              aria-hidden="true"
            />
            Certificación y trazabilidad de calidad
          </p>
        </div>
      </footer>
    </main>
  );
}
