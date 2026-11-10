"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Hero from "@/components/Hero";
import KPIs from "@/components/KPIs";
import AgendaTable, { type PlantaFiltro } from "@/components/AgendaTable";
import RepositorioPanel from "@/components/RepositorioPanel";
import type { AgendaFiltersValue } from "@/components/AgendaFilters";
import type { Documento, PuntoSGC } from "@/types/models";

type Planta = "Luján" | "Campana";

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
  const [plantaActiva, setPlantaActiva] = useState<PlantaFiltro>("Todo");

  const cargarTodo = useCallback(async (): Promise<AgendaCargada> => {
    const [agendaRes, docsRes] = await Promise.all([
      fetch("/api/agenda"),
      fetch("/api/documentos"),
    ]);

    if (!agendaRes.ok) throw new Error("No se pudo cargar la agenda");

    const agendaData = await agendaRes.json();
    const docsData = docsRes.ok ? await docsRes.json() : { documentos: [] };

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
    () => (plantaActiva === "Todo" ? puntos : puntosDe(plantaActiva)),
    [puntos, puntosDe, plantaActiva],
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
  const pendientes = puntosPlanta.filter(
    (p) => p.estado === "Pendiente",
  ).length;
  const enCurso = puntosPlanta.filter((p) => p.estado === "En curso").length;
  const bloqueados = puntosPlanta.filter(
    (p) => p.estado === "Bloqueado",
  ).length;
  const completados = puntosPlanta.filter(
    (p) => p.estado === "Completado",
  ).length;
  const avance = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <>
      <div className="space-y-0 pb-10 mt-0 w-full text-left">
        <section className="relative isolate overflow-hidden pt-2 md:pt-4 pb-10 w-full text-left">
          <div
            className="hero-glow pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.05),transparent_40%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Hero />
            <div className="mt-8">
              <KPIs
                total={total}
                pendientes={pendientes}
                enCurso={enCurso}
                bloqueados={bloqueados}
                completados={completados}
                avance={avance}
              />
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <RepositorioPanel documentos={documentos} />
        </div>

        <section
          id="agenda"
          className="relative mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              <i
                className="fa-solid fa-triangle-exclamation"
                aria-hidden="true"
              />
              Error cargando los datos: {error}
            </div>
          )}

          <div id="agenda-tabla">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-12 text-sm text-slate-400 backdrop-blur-md">
                <i
                  className="fa-solid fa-spinner fa-spin mr-2 text-amber-400"
                  aria-hidden="true"
                />
                Cargando agenda...
              </div>
            ) : (
              <AgendaTable
                puntos={filteredPuntos}
                documentos={documentos}
                filtros={filtros}
                onFilterChange={setFiltros}
                planta={plantaActiva}
                onPlantaChange={setPlantaActiva}
              />
            )}
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Grupo Falpat SRL · Sistema de Gestión de la Calidad</p>
          <p className="flex items-center gap-1.5">
            <i
              className="fa-solid fa-shield-halved text-amber-400/80"
              aria-hidden="true"
            />
            Certificación y trazabilidad de calidad
          </p>
        </div>
      </footer>
    </>
  );
}
