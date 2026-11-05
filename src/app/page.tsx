"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Hero from "@/components/Hero";
import KPIs from "@/components/KPIs";
import AgendaTable from "@/components/AgendaTable";
import AgendaFilters, {
  type AgendaFiltersValue,
} from "@/components/AgendaFilters";

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

const initialFilters: AgendaFiltersValue = {
  estado: "",
  responsable: "",
  planta: "",
  categoria: "",
};

export default function Dashboard() {
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<AgendaFiltersValue>(initialFilters);

  useEffect(() => {
    fetch("/api/agenda")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la agenda");
        return res.json();
      })
      .then((data) => setPuntos(Array.isArray(data.puntos) ? data.puntos : []))
      .catch((err) => {
        console.error("Error al cargar agenda:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPuntos = useMemo(() => {
    return puntos.filter((p) => {
      if (filtros.estado && p.estado !== filtros.estado) return false;
      if (filtros.responsable && p.responsable !== filtros.responsable)
        return false;
      if (filtros.categoria && p.categoria !== filtros.categoria) return false;
      if (filtros.planta && !(p.plantas ?? []).includes(filtros.planta))
        return false;
      return true;
    });
  }, [puntos, filtros]);

  const total = puntos.length;
  const pendientes = puntos.filter((p) => p.estado === "Pendiente").length;
  const enCurso = puntos.filter((p) => p.estado === "En curso").length;
  const bloqueados = puntos.filter((p) => p.estado === "Bloqueado").length;
  const completados = puntos.filter((p) => p.estado === "Completado").length;
  const avance = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <main className="min-h-screen">
      {/* ===== Barra superior ===== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#02040a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/logo-falpat.png"
              alt="Grupo Falpat Hormigones"
              width={160}
              height={83}
              className="h-8 w-auto"
              priority
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              SGC
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#agenda"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:bg-white/5 hover:text-white"
            >
              Agenda
            </a>
            <a
              href="/documentoteca"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:bg-white/5 hover:text-white"
            >
              Documentoteca
            </a>
            <a
              href="/administracion"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:bg-white/5 hover:text-white"
            >
              Administración
            </a>
          </nav>

          <a
            href="/administracion"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3.5 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            <i className="fa-solid fa-lock" aria-hidden="true" />
            <span className="hidden sm:inline">Acceso admin</span>
          </a>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <Hero />

      {/* ===== Dashboard ===== */}
      <section
        id="agenda"
        className="relative mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Panel de control
            </h2>
            <p className="mt-1 text-sm text-[#9fb0c9]">
              Estado general de la agenda de certificación
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#9fb0c9]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            Datos en tiempo real
          </span>
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
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

          <div className="glass glass-hover rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <i
                className="fa-solid fa-folder-open text-gold"
                aria-hidden="true"
              />
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb0c9]">
                Últimos documentos
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[#9fb0c9]">
              Consultá la Documentoteca para ver las evidencias y certificados
              cargados del SGC.
            </p>
            <a
              href="/documentoteca"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-amber-200"
            >
              Ir a la documentoteca
              <i
                className="fa-solid fa-arrow-right text-xs"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="glass glass-hover rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <i
                className="fa-solid fa-calendar-days text-gold"
                aria-hidden="true"
              />
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb0c9]">
                Próximos vencimientos
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[#9fb0c9]">
              {puntos.filter((p) => p.fechaCompromiso).length > 0
                ? "Revisá las fechas compromiso cargadas en la agenda."
                : "Sin fechas compromiso cargadas por el momento."}
            </p>
            <a
              href="#agenda-tabla"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-amber-200"
            >
              Ver agenda
              <i
                className="fa-solid fa-arrow-right text-xs"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>

        <div
          id="agenda-tabla"
          className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-4"
        >
          <div className="lg:col-span-1">
            <AgendaFilters onFilterChange={setFiltros} />
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
              <AgendaTable puntos={filteredPuntos} />
            )}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-[#6f7f99] sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Grupo Falpat SRL · Portal SGC</p>
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
