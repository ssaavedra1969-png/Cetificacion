"use client";

import { useEffect, useMemo, useState } from "react";

interface Tarea {
  id: string;
  codigo: string;
  tarea: string;
  responsable: string;
  inicio: string;
  semanas: number | null;
  fin: string;
  estado: string;
  avance: number;
  observaciones: string;
  esGrupo: boolean;
  hito: boolean;
}

interface Plan {
  titulo: string;
  nota: string;
  avanceGeneral: number;
  semanas: string[];
  meses: { col: number; label: string }[];
  tareas: Tarea[];
  referencias: string[];
  fuente: string;
}

const MS_DIA = 86400000;

const ESTADO_UI: Record<
  string,
  { bar: string; track: string; text: string; dot: string; chip: string }
> = {
  Terminado: {
    bar: "bg-emerald-500",
    track: "bg-emerald-500/15 border border-emerald-400/50",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  "En curso": {
    bar: "bg-sky-500",
    track: "bg-sky-500/15 border border-sky-400/50",
    text: "text-sky-300",
    dot: "bg-sky-400",
    chip: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  },
  Pendiente: {
    bar: "bg-slate-400",
    track: "bg-slate-500/15 border border-slate-400/50",
    text: "text-slate-300",
    dot: "bg-slate-400",
    chip: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  },
  Bloqueado: {
    bar: "bg-rose-500",
    track: "bg-rose-500/15 border border-rose-400/50",
    text: "text-rose-300",
    dot: "bg-rose-400",
    chip: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
};

const GRUPO_UI = {
  bar: "bg-gold",
  track: "bg-gold/15 border border-gold/50",
  text: "text-gold",
  dot: "bg-gold",
  chip: "border-gold/30 bg-gold/10 text-gold",
};

const uiDe = (t: Tarea) => (t.esGrupo ? GRUPO_UI : ESTADO_UI[t.estado] ?? ESTADO_UI.Pendiente);

function posicion(inicio: string, fin: string, first: string, totalSemanas: number) {
  const totalDias = totalSemanas * 7;
  const desde = (new Date(inicio).getTime() - new Date(first).getTime()) / MS_DIA;
  const hasta = (new Date(fin).getTime() - new Date(first).getTime()) / MS_DIA + 1;
  const left = Math.max(0, (desde / totalDias) * 100);
  const right = Math.min(100, (hasta / totalDias) * 100);
  return { left: `${left}%`, width: `${Math.max(0.8, right - left)}%` };
}

const fmtFecha = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

export default function PlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("Todas");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch("/api/plan")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setPlan(data))
      .catch((e) => setError(e.message));
  }, []);

  const tareas = plan?.tareas ?? [];

  const conteo = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const t of tareas) {
      if (t.esGrupo) continue;
      acc[t.estado || "Pendiente"] = (acc[t.estado || "Pendiente"] ?? 0) + 1;
    }
    return acc;
  }, [tareas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tareas.filter((t) => {
      if (filtro !== "Todas" && !t.esGrupo && t.estado !== filtro) return false;
      if (q) {
        const texto = `${t.codigo} ${t.tarea} ${t.responsable} ${t.observaciones}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [tareas, filtro, busqueda]);

  const estados = ["Todas", "En curso", "Pendiente", "Terminado", "Bloqueado"].filter(
    (e) => e === "Todas" || conteo[e],
  );

  if (error) {
    return (
      <div className="glass rounded-xl border border-rose-400/30 p-6 text-rose-300">
        No se pudo cargar el plan: {error}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="glass animate-pulse rounded-xl p-10 text-center text-[#94a3b8]">
        Cargando plan de trabajo…
      </div>
    );
  }

  const totalSemanas = plan.semanas.length;
  const first = plan.semanas[0];
  const hoy = new Date();
  let semanaActual = -1;
  plan.semanas.forEach((s, i) => {
    if (new Date(s).getTime() <= hoy.getTime()) semanaActual = i;
  });

  const avancePct = Math.round(plan.avanceGeneral * 1000) / 10;

  return (
    <div className="space-y-6">
      <header className="glass rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Plan de Trabajo
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">{plan.titulo}</h1>
            <p className="mt-2 text-sm text-[#94a3b8]">{plan.nota}</p>
          </div>
          <div className="min-w-[220px]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                Avance general
              </span>
              <span className="text-2xl font-bold text-gold">{avancePct}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                style={{ width: `${avancePct}%` }}
              />
            </div>
            <p className="mt-2 text-right text-[11px] text-[#64748b]">
              {totalSemanas} semanas · {fmtFecha(first)} → {fmtFecha(plan.semanas[totalSemanas - 1])}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {["En curso", "Pendiente", "Terminado", "Bloqueado"].map((e) => (
            <span
              key={e}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                ESTADO_UI[e].chip
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${ESTADO_UI[e].dot}`} />
              {e}
              <span className="font-bold">{conteo[e] ?? 0}</span>
            </span>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {estados.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setFiltro(e)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === e
                  ? "border-gold/50 bg-gold/15 text-gold"
                  : "border-white/10 bg-white/5 text-[#94a3b8] hover:text-white"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <i
            className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b]"
            aria-hidden="true"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tarea o responsable…"
            className="w-64 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-[#64748b] focus:border-gold/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-xl border border-white/10 bg-[#070b16]">
        <div className="min-w-[1080px]">
          <div className="sticky top-0 z-20 flex border-b border-white/10 bg-[#0a0f1e]">
            <div className="sticky left-0 z-30 w-[340px] shrink-0 border-r border-white/10 bg-[#0a0f1e] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              Tarea / Responsable
            </div>
            <div className="relative flex-1">
              <div className="flex h-7 items-end">
                {plan.meses.map((m) => (
                  <div
                    key={m.label}
                    className="border-l border-white/10 px-2 pb-0.5 text-[11px] font-semibold text-gold/90"
                    style={{
                      width: `${
                        ((plan.meses.find((x) => x.col > m.col)?.col ?? totalSemanas) - m.col) /
                        totalSemanas *
                        100
                      }%`,
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div
                className="grid h-5"
                style={{ gridTemplateColumns: `repeat(${totalSemanas}, minmax(0, 1fr))` }}
              >
                {plan.semanas.map((s, i) => (
                  <div
                    key={s}
                    className={`flex items-center justify-center border-l border-white/[0.06] text-[9px] ${
                      i === semanaActual ? "bg-gold/15 text-gold" : "text-[#475569]"
                    }`}
                  >
                    {s.split("-")[2]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {visibles.map((t) => {
            const ui = uiDe(t);
            const pos = posicion(t.inicio, t.fin, first, totalSemanas);
            const avance = Math.round(t.avance * 100);
            return (
              <div
                key={t.id}
                className={`flex border-b border-white/[0.06] ${
                  t.esGrupo ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                }`}
              >
                <div
                  className={`sticky left-0 z-10 flex w-[340px] shrink-0 items-center gap-2 border-r border-white/10 px-4 py-2 ${
                    t.esGrupo ? "bg-[#0c1222]" : "bg-[#070b16]"
                  }`}
                >
                  {t.codigo && (
                    <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-[#c7d2e3]">
                      {t.codigo}
                    </span>
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      t.esGrupo
                        ? "text-xs font-bold uppercase tracking-wide text-gold"
                        : "text-[13px] text-white"
                    }`}
                    title={`${t.tarea}${t.observaciones ? " — " + t.observaciones : ""}`}
                  >
                    {t.tarea}
                  </span>
                  {!t.esGrupo && (
                    <span className="shrink-0 text-[10px] text-[#64748b]">{t.responsable}</span>
                  )}
                  {!t.esGrupo && (
                    <span className={`shrink-0 text-[10px] font-semibold ${ui.text}`}>{avance}%</span>
                  )}
                </div>

                <div className="relative flex-1 py-1.5">
                  <div
                    className="absolute inset-0 grid"
                    style={{ gridTemplateColumns: `repeat(${totalSemanas}, minmax(0, 1fr))` }}
                  >
                    {plan.semanas.map((s, i) => (
                      <div
                        key={s}
                        className={`border-l border-white/[0.06] ${
                          i === semanaActual ? "bg-gold/[0.06]" : ""
                        }`}
                      />
                    ))}
                  </div>

                  {t.hito ? (
                    <div
                      className="absolute top-1/2 z-[5] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-gold shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                      style={{ left: pos.left }}
                      title={`Hito · ${t.tarea}`}
                    />
                  ) : (
                    <div
                      className={`absolute top-1/2 z-[5] flex -translate-y-1/2 items-center overflow-hidden rounded-full ${
                        ui.track
                      } ${t.esGrupo ? "h-3.5" : "h-5"}`}
                      style={{ left: pos.left, width: pos.width }}
                      title={`${t.tarea} · ${fmtFecha(t.inicio)} → ${fmtFecha(t.fin)}${
                        t.esGrupo ? "" : ` · ${t.estado} ${avance}%`
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${ui.bar}`}
                        style={{ width: `${t.esGrupo ? 100 : avance}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
          Referencias
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#c7d2e3]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Terminado
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> En curso
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Pendiente
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Bloqueado
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rotate-45 rounded-[2px] bg-gold" /> Hito
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-6 rounded-full bg-gold/60" /> Bloque (resumen)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-3 rounded-sm bg-gold/20" /> Semana actual
          </span>
        </div>
        <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-[#64748b]">
          {plan.referencias[plan.referencias.length - 1]}
        </p>
        <p className="mt-2 text-[11px] text-[#64748b]">
          Fuente: <span className="text-[#94a3b8]">{plan.fuente}</span>
        </p>
      </div>
    </div>
  );
}
