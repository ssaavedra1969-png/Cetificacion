"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ESTADOS,
  derivePlan,
  type PlanDerivado,
  type PlanRaw,
  type PlanEstado,
  type PlanTarea,
  type PlanTareaCalc,
} from "@/lib/plan";

const MS_DIA = 86400000;
const toUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const hoyISO = () => new Date().toISOString().slice(0, 10);

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

const uiDe = (t: PlanTarea) =>
  t.esGrupo ? GRUPO_UI : ESTADO_UI[t.estado] ?? ESTADO_UI.Pendiente;

function posicion(inicio: string, fin: string, first: string, totalSemanas: number) {
  const totalDias = totalSemanas * 7;
  const desde = (toUTC(inicio) - toUTC(first)) / MS_DIA;
  const hasta = (toUTC(fin) - toUTC(first)) / MS_DIA + 1;
  const left = Math.max(0, (desde / totalDias) * 100);
  const right = Math.min(100, (hasta / totalDias) * 100);
  return { left: `${left}%`, width: `${Math.max(0.8, right - left)}%` };
}

const fmtFecha = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

const INP =
  "w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-gold/50 focus:outline-none";

export default function PlanPage() {
  const [raw, setRaw] = useState<PlanRaw | null>(null);
  const [draft, setDraft] = useState<PlanRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"resumen" | "gantt" | "lista">("resumen");
  const [editTask, setEditTask] = useState<PlanTareaCalc | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    fetch("/api/plan")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PlanRaw) => {
        setRaw(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((d) => setCanEdit(Boolean(d.authenticated) && d.user?.rol !== "lector"))
      .catch(() => setCanEdit(false));
  }, [cargar]);

  const base = editando && draft ? draft : raw;

  const plan: PlanDerivado | null = useMemo(
    () => (base ? derivePlan(base) : null),
    [base],
  );

  const conteo = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const t of plan?.tareas ?? []) {
      if (t.esGrupo) continue;
      acc[t.estado || "Pendiente"] = (acc[t.estado || "Pendiente"] ?? 0) + 1;
    }
    return acc;
  }, [plan]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (plan?.tareas ?? []).filter((t) => {
      if (filtro !== "Todas" && !t.esGrupo && t.estado !== filtro) return false;
      if (q) {
        const texto = `${t.codigo} ${t.tarea} ${t.responsable} ${t.observaciones}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [plan, filtro, busqueda]);

  const estados = ["Todas", "En curso", "Pendiente", "Terminado", "Bloqueado"].filter(
    (e) => e === "Todas" || conteo[e],
  );

  const iniciarEdicion = () => {
    if (!raw) return;
    setDraft(JSON.parse(JSON.stringify(raw)) as PlanRaw);
    setMensaje(null);
    setEditando(true);
  };

  const cancelar = () => {
    setDraft(null);
    setEditando(false);
    setMensaje(null);
  };

  const setTarea = (id: string, patch: Partial<PlanTarea>) =>
    setDraft((d) =>
      d ? { ...d, tareas: d.tareas.map((t) => (t.id === id ? { ...t, ...patch } : t)) } : d,
    );

  const quitarTarea = (id: string) =>
    setDraft((d) => (d ? { ...d, tareas: d.tareas.filter((t) => t.id !== id) } : d));

  const agregarTarea = (grupoId: string) =>
    setDraft((d) => {
      if (!d) return d;
      const hijos = d.tareas.filter((t) => t.id.startsWith(`${grupoId}.`));
      const mayor = hijos.reduce((max, t) => {
        const n = Number(t.id.split(".").pop());
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
      const nueva: PlanTarea = {
        id: `${grupoId}.${mayor + 1}`,
        codigo: "",
        tarea: "Nueva tarea",
        responsable: "",
        inicio: hoyISO(),
        semanas: 1,
        estado: "Pendiente",
        avance: 0,
        observaciones: "",
        esGrupo: false,
        hito: false,
      };
      return { ...d, tareas: [...d.tareas, nueva] };
    });

  const agregarGrupo = () =>
    setDraft((d) => {
      if (!d) return d;
      const mayor = d.tareas.reduce((max, t) => {
        if (!t.esGrupo) return max;
        const n = Number(t.id);
        return Number.isFinite(n) && n > max ? n : max;
      }, -1);
      const nuevo: PlanTarea = {
        id: String(mayor + 1),
        codigo: "",
        tarea: "NUEVO BLOQUE",
        responsable: "",
        inicio: hoyISO(),
        semanas: null,
        estado: "",
        avance: 0,
        observaciones: "",
        esGrupo: true,
        hito: false,
      };
      return { ...d, tareas: [...d.tareas, nuevo] };
    });

  const guardar = async () => {
    if (!draft) return;
    setSaving(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRaw(draft);
      setDraft(null);
      setEditando(false);
      setMensaje("Plan guardado. Los cambios ya están publicados.");
    } catch (e) {
      setMensaje(`No se pudo guardar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSaving(false);
    }
  };

  const marcarTerminada = async (t: PlanTareaCalc) => {
    if (!raw) return;
    setSavingTask(true);
    setMensaje(null);
    try {
      const nuevo: PlanRaw = {
        ...raw,
        tareas: raw.tareas.map((x) =>
          x.id === t.id ? { ...x, estado: "Terminado", avance: 1 } : x,
        ),
      };
      const res = await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRaw(nuevo);
      setMensaje("Tarea marcada como terminada.");
    } catch (e) {
      setMensaje(`No se pudo guardar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSavingTask(false);
    }
  };

  const guardarTarea = async (patch: Partial<PlanTarea>) => {
    if (!raw || !editTask) return;
    setSavingTask(true);
    setMensaje(null);
    try {
      const nuevo: PlanRaw = {
        ...raw,
        tareas: raw.tareas.map((t) =>
          t.id === editTask.id ? { ...t, ...patch } : t,
        ),
      };
      // auto: si estado Terminado -> avance 100%
      if (patch.estado === "Terminado") {
        nuevo.tareas = nuevo.tareas.map((t) =>
          t.id === editTask.id ? { ...t, avance: 1 } : t,
        );
      }
      const res = await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRaw(nuevo);
      setEditTask(null);
      setMensaje("Tarea actualizada.");
    } catch (e) {
      setMensaje(`No se pudo guardar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="glass animate-pulse rounded-xl p-10 text-center text-[#94a3b8]">
        Cargando plan de trabajo…
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="glass rounded-xl border border-rose-400/30 p-6 text-rose-300">
        No se pudo cargar el plan: {error}
      </div>
    );
  }

  const totalSemanas = plan.semanas.length;
  const first = plan.semanas[0];
  const finPlan = plan.tareas.reduce((max, t) => (t.fin > max ? t.fin : max), first);
  const avancePct = Math.round(plan.avanceGeneral * 1000) / 10;
  const todayPct =
    ((toUTC(plan.hoy) - toUTC(first)) / MS_DIA) / (totalSemanas * 7) * 100;
  const mostrarHoy = todayPct >= 0 && todayPct <= 100;
  const atrasadas = plan.tareas.filter((t) => t.atrasada).length;

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
                className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold transition-all"
                style={{ width: `${avancePct}%` }}
              />
            </div>
            <p className="mt-2 text-right text-[11px] text-[#64748b]">
              {totalSemanas} semanas · {fmtFecha(first)} → {fmtFecha(finPlan)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {["En curso", "Pendiente", "Terminado", "Bloqueado"].map((e) => (
            <span
              key={e}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${ESTADO_UI[e].chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${ESTADO_UI[e].dot}`} />
              {e}
              <span className="font-bold">{conteo[e] ?? 0}</span>
            </span>
          ))}
          {atrasadas > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-200">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              {atrasadas} atrasada{atrasadas > 1 ? "s" : ""}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {canEdit && !editando && (
              <button
                type="button"
                onClick={iniciarEdicion}
                className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/25"
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                Editar plan
              </button>
            )}
            {editando && (
              <>
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={saving}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#94a3b8] transition-colors hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <i
                    className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`}
                    aria-hidden="true"
                  />
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </>
            )}
          </div>
        </div>

        {mensaje && (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
              mensaje.startsWith("No se pudo")
                ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {mensaje}
          </p>
        )}
        {editando && (
          <p className="mt-4 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
            <i className="fa-solid fa-circle-info mr-1" aria-hidden="true" />
            El avance de cada bloque y el avance general se recalculan solos a partir de las
            tareas. Las fechas de fin y el rango del Gantt se ajustan automáticamente.
          </p>
        )}
      </header>

      {/* Vista */}
  <div className="flex flex-wrap items-center gap-2">
    {(["resumen", "gantt", "lista"] as const).map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => setVista(v)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          vista === v
            ? "border-gold/50 bg-gold/15 text-gold"
            : "border-white/10 bg-white/5 text-[#94a3b8] hover:text-white"
        }`}
      >
        {v === "resumen" ? "Resumen" : v === "gantt" ? "Gantt" : "Tareas"}
      </button>
    ))}
    <span className="ml-auto text-xs text-[#64748b]">
      {plan.tareas.filter((t) => !t.esGrupo).length} tareas · {plan.tareas.filter((t) => t.esGrupo).length} bloques
    </span>
  </div>

  {!editando && (
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
      )}

      {vista === "gantt" && (
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
                      i === plan.semanaActual ? "bg-gold/15 text-gold" : "text-[#475569]"
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
                  {t.atrasada && (
                    <i
                      className="fa-solid fa-triangle-exclamation shrink-0 text-[10px] text-rose-400"
                      title="Tarea atrasada"
                      aria-hidden="true"
                    />
                  )}
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
                          i === plan.semanaActual ? "bg-gold/[0.06]" : ""
                        }`}
                      />
                    ))}
                  </div>

                  {mostrarHoy && (
                    <div
                      className="absolute inset-y-0 z-[3] w-px bg-gold/60"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}

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
                      } ${t.esGrupo ? "h-3.5" : "h-5"} ${
                        t.atrasada ? "ring-1 ring-rose-400/70" : ""
                      }`}
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
  )}


  {vista === "resumen" && (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plan.tareas
          .filter((t) => t.esGrupo)
          .map((g) => {
            const hijos = plan.tareas.filter((t) => !t.esGrupo && t.grupoId === g.id);
            const term = hijos.filter((t) => t.estado === "Terminado").length;
            const av = Math.round(g.avance * 100);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setFiltro("Todas");
                  setBusqueda(g.codigo || g.tarea);
                  setVista("lista");
                }}
                className="glass rounded-xl p-4 text-left transition hover:border-gold/40 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gold">{g.tarea}</span>
                  <span className="text-xs font-bold text-white">{av}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                    style={{ width: `${av}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#94a3b8]">
                  <span>{hijos.length} tareas</span>
                  <span className="text-emerald-300">{term} terminadas</span>
                  <span>{fmtFecha(g.inicio)} → {fmtFecha(g.fin)}</span>
                </div>
              </button>
            );
          })}
      </div>
      {plan.tareas.some((t) => t.atrasada) && (
        <div className="glass rounded-xl border border-rose-400/30 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-300">
            Tareas atrasadas
          </h3>
          <ul className="space-y-1.5">
            {plan.tareas
              .filter((t) => t.atrasada)
              .map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <i className="fa-solid fa-triangle-exclamation text-rose-400" aria-hidden="true" />
                  <span className="font-mono text-xs text-gold/80">{t.codigo}</span>
                  <span className="text-white">{t.tarea}</span>
                  <span className="ml-auto text-[11px] text-[#64748b]">
                    {fmtFecha(t.fin)} · {t.responsable}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )}


  {vista === "lista" && (
    <div className="space-y-4">
      {plan.tareas
        .filter((t) => t.esGrupo)
        .map((g) => {
          const hijos = visibles.filter((t) => !t.esGrupo && t.grupoId === g.id);
          if (visibles.length !== plan.tareas.length && hijos.length === 0 && filtro !== "Todas") {
            // still show group if any child matches filter via visibles? visibles already filtered
          }
          return (
            <details key={g.id} open className="glass rounded-xl">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-sm font-bold uppercase tracking-wide text-gold">
                    {g.tarea}
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    {fmtFecha(g.inicio)} → {fmtFecha(g.fin)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                      style={{ width: `${Math.round(g.avance * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {Math.round(g.avance * 100)}%
                  </span>
                </div>
              </summary>
              <div className="divide-y divide-white/[0.06] border-t border-white/10">
                {plan.tareas
                  .filter((t) => !t.esGrupo && t.grupoId === g.id)
                  .filter((t) => (filtro === "Todas" || t.estado === filtro))
                  .filter((t) =>
                    !busqueda.trim() ||
                    `${t.codigo} ${t.tarea} ${t.responsable} ${t.observaciones}`
                      .toLowerCase()
                      .includes(busqueda.trim().toLowerCase()),
                  )
                  .map((t) => {
                    const ui = uiDe(t);
                    const avance = Math.round(t.avance * 100);
                    return (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-white/[0.02]"
                      >
                        {t.codigo && (
                          <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-[#c7d2e3]">
                            {t.codigo}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{t.tarea}</p>
                          <p className="text-[11px] text-[#64748b]">
                            {t.responsable} · {fmtFecha(t.inicio)} → {fmtFecha(t.fin)}
                            {t.observaciones ? ` · ${t.observaciones}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ui.chip}`}
                        >
                          {t.estado || "Pendiente"} {avance}%
                        </span>
                        {t.atrasada && (
                          <i
                            className="fa-solid fa-triangle-exclamation text-rose-400"
                            title="Atrasada"
                            aria-hidden="true"
                          />
                        )}
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            {t.estado !== "Terminado" && (
                              <button
                                type="button"
                                onClick={() => marcarTerminada(t)}
                                disabled={savingTask}
                                className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50"
                                title="Marcar como terminada"
                              >
                                <i className="fa-solid fa-check" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditTask(t)}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gold hover:bg-gold/15"
                              title="Editar tarea"
                            >
                              <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </details>
          );
        })}
    </div>
  )}

  {editando && draft && (
        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">
              Editar tareas
            </h2>
            <button
              type="button"
              onClick={agregarGrupo}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c7d2e3] transition-colors hover:border-gold/40 hover:text-gold"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Agregar bloque
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-[#64748b]">
                  <th className="px-2 py-2">Código</th>
                  <th className="px-2 py-2">Tarea</th>
                  <th className="px-2 py-2">Responsable</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Avance %</th>
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Semanas</th>
                  <th className="px-2 py-2">Hito</th>
                  <th className="px-2 py-2">Observaciones</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {draft.tareas.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-t border-white/[0.06] align-middle ${
                      t.esGrupo ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    {t.esGrupo ? (
                      <>
                        <td className="px-2 py-2 text-[10px] font-bold text-gold">#{t.id}</td>
                        <td className="px-2 py-2" colSpan={8}>
                          <input
                            className={`${INP} font-semibold uppercase text-gold`}
                            value={t.tarea}
                            onChange={(e) => setTarea(t.id, { tarea: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => agregarTarea(t.id)}
                              title="Agregar tarea al bloque"
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/15"
                            >
                              <i className="fa-solid fa-plus" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => quitarTarea(t.id)}
                              title="Eliminar bloque"
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/15"
                            >
                              <i className="fa-solid fa-trash" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2 w-20">
                          <input
                            className={INP}
                            value={t.codigo}
                            placeholder="—"
                            onChange={(e) => setTarea(t.id, { codigo: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2 min-w-[220px]">
                          <input
                            className={INP}
                            value={t.tarea}
                            onChange={(e) => setTarea(t.id, { tarea: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2 w-32">
                          <input
                            className={INP}
                            value={t.responsable}
                            placeholder="—"
                            onChange={(e) => setTarea(t.id, { responsable: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2 w-28">
                          <select
                            className={INP}
                            value={t.estado || "Pendiente"}
                            onChange={(e) =>
                              setTarea(t.id, { estado: e.target.value as PlanEstado })
                            }
                          >
                            {ESTADOS.map((e) => (
                              <option key={e} value={e} className="bg-[#0a0f1e]">
                                {e}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 w-20">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className={INP}
                            value={Math.round(t.avance * 100)}
                            onChange={(e) =>
                              setTarea(t.id, {
                                avance: Math.min(1, Math.max(0, Number(e.target.value) / 100 || 0)),
                              })
                            }
                          />
                        </td>
                        <td className="px-2 py-2 w-36">
                          <input
                            type="date"
                            className={INP}
                            value={t.inicio}
                            onChange={(e) => setTarea(t.id, { inicio: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2 w-20">
                          <input
                            type="number"
                            min={1}
                            className={INP}
                            disabled={t.hito}
                            value={t.hito ? 0 : t.semanas ?? 1}
                            onChange={(e) =>
                              setTarea(t.id, { semanas: Math.max(1, Number(e.target.value) || 1) })
                            }
                          />
                        </td>
                        <td className="px-2 py-2 w-14 text-center">
                          <input
                            type="checkbox"
                            checked={t.hito}
                            onChange={(e) =>
                              setTarea(t.id, {
                                hito: e.target.checked,
                                semanas: e.target.checked ? 0 : 1,
                              })
                            }
                          />
                        </td>
                        <td className="px-2 py-2 min-w-[200px]">
                          <input
                            className={INP}
                            value={t.observaciones}
                            placeholder="—"
                            onChange={(e) => setTarea(t.id, { observaciones: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => quitarTarea(t.id)}
                            title="Eliminar tarea"
                            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/15"
                          >
                            <i className="fa-solid fa-trash" aria-hidden="true" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelar}
              disabled={saving}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#94a3b8] transition-colors hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
            >
              <i
                className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`}
                aria-hidden="true"
              />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </section>
      )}

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
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Bloqueado / atrasado
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rotate-45 rounded-[2px] bg-gold" /> Hito
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-6 rounded-full bg-gold/60" /> Bloque (resumen)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-0.5 bg-gold/60" /> Hoy
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-3 rounded-sm bg-gold/20" /> Semana actual
          </span>
        </div>
        {plan.referencias.length > 0 && (
          <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-[#64748b]">
            {plan.referencias[plan.referencias.length - 1]}
          </p>
        )}
        {plan.fuente && (
          <p className="mt-2 text-[11px] text-[#64748b]">
            Fuente: <span className="text-[#94a3b8]">{plan.fuente}</span>
          </p>
        )}
      </div>

      {editTask && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setEditTask(null)}
        >
          <div
            className="glass max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/30 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Editar tarea</h3>
              <button
                type="button"
                onClick={() => setEditTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const patch: Partial<PlanTarea> = {
                  codigo: String(fd.get("codigo") || ""),
                  tarea: String(fd.get("tarea") || ""),
                  responsable: String(fd.get("responsable") || ""),
                  estado: String(fd.get("estado") || "Pendiente") as PlanEstado,
                  avance: Math.min(1, Math.max(0, Number(fd.get("avance")) / 100 || 0)),
                  inicio: String(fd.get("inicio") || editTask.inicio),
                  semanas: fd.get("hito") === "on" ? 0 : Math.max(1, Number(fd.get("semanas")) || 1),
                  hito: fd.get("hito") === "on",
                  observaciones: String(fd.get("observaciones") || ""),
                };
                guardarTarea(patch);
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs text-[#c7d2e3]">Código</label>
                <input name="codigo" defaultValue={editTask.codigo} className={INP} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#c7d2e3]">Tarea</label>
                <input name="tarea" defaultValue={editTask.tarea} className={INP} required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#c7d2e3]">Responsable</label>
                <input name="responsable" defaultValue={editTask.responsable} className={INP} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Estado</label>
                  <select name="estado" defaultValue={editTask.estado || "Pendiente"} className={INP}>
                    {ESTADOS.map((e) => (
                      <option key={e} value={e} className="bg-[#0a0f1e]">
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Avance %</label>
                  <input
                    name="avance"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={Math.round(editTask.avance * 100)}
                    className={INP}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Inicio</label>
                  <input name="inicio" type="date" defaultValue={editTask.inicio} className={INP} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Semanas</label>
                  <input
                    name="semanas"
                    type="number"
                    min={1}
                    defaultValue={editTask.hito ? 1 : editTask.semanas ?? 1}
                    disabled={editTask.hito}
                    className={INP}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#c7d2e3]">
                <input name="hito" type="checkbox" defaultChecked={editTask.hito} />
                Hito (un solo día)
              </label>
              <div>
                <label className="mb-1 block text-xs text-[#c7d2e3]">Observaciones</label>
                <textarea
                  name="observaciones"
                  defaultValue={editTask.observaciones}
                  rows={2}
                  className={INP}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTask(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <i className={`fa-solid ${savingTask ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} aria-hidden="true" />
                  {savingTask ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
