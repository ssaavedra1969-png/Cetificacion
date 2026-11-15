"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ESTADOS,
  derivePlan,
  type PlanDerivado,
  type PlanEstado,
  type PlanRaw,
  type PlanTarea,
  type PlanTareaCalc,
} from "@/lib/plan";

const MS_DIA = 86400000;
const toUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const hoyISO = () => new Date().toISOString().slice(0, 10);

const ESTADO_UI: Record<string, { bar: string; track: string; text: string; dot: string; chip: string; next: string }> = {
  Terminado: { bar: "bg-emerald-500", track: "bg-emerald-500/15 border border-emerald-400/50", text: "text-emerald-300", dot: "bg-emerald-400", chip: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300", next: "Pendiente" },
  "En curso": { bar: "bg-sky-500", track: "bg-sky-500/15 border border-sky-400/50", text: "text-sky-300", dot: "bg-sky-400", chip: "border-sky-400/40 bg-sky-500/15 text-sky-300", next: "Terminado" },
  Pendiente: { bar: "bg-slate-400", track: "bg-slate-500/15 border border-slate-400/50", text: "text-slate-300", dot: "bg-slate-400", chip: "border-slate-400/40 bg-slate-500/15 text-slate-300", next: "En curso" },
  Bloqueado: { bar: "bg-rose-500", track: "bg-rose-500/15 border border-rose-400/50", text: "text-rose-300", dot: "bg-rose-400", chip: "border-rose-400/40 bg-rose-500/15 text-rose-300", next: "En curso" },
};

const uiDe = (t: PlanTarea) => ESTADO_UI[t.estado || "Pendiente"] ?? ESTADO_UI.Pendiente;

const fmtFecha = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

const INP = "w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-gold/50 focus:outline-none";

function posicion(inicio: string, fin: string, first: string, totalSemanas: number) {
  const totalDias = totalSemanas * 7;
  const desde = (toUTC(inicio) - toUTC(first)) / MS_DIA;
  const hasta = (toUTC(fin) - toUTC(first)) / MS_DIA + 1;
  const left = Math.max(0, (desde / totalDias) * 100);
  const right = Math.min(100, (hasta / totalDias) * 100);
  return { left: `${left}%`, width: `${Math.max(0.8, right - left)}%` };
}

export default function PlanPage() {
  const [raw, setRaw] = useState<PlanRaw | null>(null);
  const [draft, setDraft] = useState<PlanRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [editTask, setEditTask] = useState<PlanTareaCalc | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [ganttAbierto, setGanttAbierto] = useState(false);

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
  const plan: PlanDerivado | null = useMemo(() => (base ? derivePlan(base) : null), [base]);

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
      setMensaje("Plan guardado.");
    } catch (e) {
      setMensaje(`No se pudo guardar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSaving(false);
    }
  };

  const setTarea = (id: string, patch: Partial<PlanTarea>) =>
    setDraft((d) => (d ? { ...d, tareas: d.tareas.map((t) => (t.id === id ? { ...t, ...patch } : t)) } : d));
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

  const guardarTarea = async (patch: Partial<PlanTarea>) => {
    if (!raw || !editTask) return;
    setSavingTask(true);
    setMensaje(null);
    try {
      const nuevo: PlanRaw = {
        ...raw,
        tareas: raw.tareas.map((t) => (t.id === editTask.id ? { ...t, ...patch } : t)),
      };
      if (patch.estado === "Terminado") {
        nuevo.tareas = nuevo.tareas.map((t) => (t.id === editTask.id ? { ...t, avance: 1 } : t));
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

  const marcarTerminada = async (t: PlanTareaCalc) => {
    if (!raw) return;
    setSavingTask(true);
    setMensaje(null);
    try {
      const nuevo: PlanRaw = {
        ...raw,
        tareas: raw.tareas.map((x) => (x.id === t.id ? { ...x, estado: "Terminado", avance: 1 } : x)),
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

  const ciclarEstado = async (t: PlanTareaCalc) => {
    if (!raw || !canEdit) return;
    const orden = ["Pendiente", "En curso", "Terminado"];
    const idx = orden.indexOf(t.estado || "Pendiente");
    const nuevoEstado = orden[(idx + 1) % orden.length] as PlanEstado;
    setSavingTask(true);
    setMensaje(null);
    try {
      const nuevo: PlanRaw = {
        ...raw,
        tareas: raw.tareas.map((x) =>
          x.id === t.id
            ? { ...x, estado: nuevoEstado, avance: nuevoEstado === "Terminado" ? 1 : x.avance }
            : x,
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

  const grupos = plan.tareas.filter((t) => t.esGrupo);
  const hojas = plan.tareas.filter((t) => !t.esGrupo);
  const avancePct = Math.round(plan.avanceGeneral * 100);
  const atrasadas = hojas.filter((t) => t.atrasada);
  const hoy = plan.hoy;
  const estaSemana = hojas.filter((t) => {
    if (t.estado === "Terminado") return false;
    const fin = toUTC(t.fin);
    const h = toUTC(hoy);
    return fin >= h && fin <= h + 7 * MS_DIA;
  });
  const terminadas = hojas.filter((t) => t.estado === "Terminado").length;
  const enCurso = hojas.filter((t) => t.estado === "En curso").length;
  const pendientes = hojas.filter((t) => (t.estado || "Pendiente") === "Pendiente").length;
  const bloqueadas = hojas.filter((t) => t.estado === "Bloqueado").length;

  const q = busqueda.trim().toLowerCase();
  const filtrar = (t: PlanTareaCalc) => {
    if (!q) return true;
    return `${t.codigo} ${t.tarea} ${t.responsable} ${t.observaciones}`.toLowerCase().includes(q);
  };

  const toggleGrupo = (id: string) =>
    setExpandidos((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="glass rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Plan de Trabajo</p>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{plan.titulo}</h1>
            <p className="mt-1 text-sm text-[#94a3b8]">{plan.nota}</p>
          </div>
          <div className="min-w-[200px]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.12em] text-[#64748b]">Avance general</span>
              <span className="text-2xl font-bold text-gold">{avancePct}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold transition-all" style={{ width: `${avancePct}%` }} />
            </div>
            <p className="mt-2 text-right text-[11px] text-[#64748b]">
              {plan.semanas.length} semanas · {fmtFecha(plan.rango.inicio)} → {fmtFecha(plan.rango.fin)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Terminadas {terminadas}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> En curso {enCurso}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/40 bg-slate-500/15 px-2.5 py-1 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Pendientes {pendientes}
          </span>
          {bloqueadas > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Bloqueadas {bloqueadas}
            </span>
          )}
          {atrasadas.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-200">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {atrasadas.length} atrasada{atrasadas.length > 1 ? "s" : ""}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {canEdit && !editando && (
              <button
                type="button"
                onClick={iniciarEdicion}
                className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/25"
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden="true" /> Editar estructura
              </button>
            )}
            {editando && (
              <>
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={saving}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} aria-hidden="true" />
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </>
            )}
          </div>
        </div>

        {mensaje && (
          <p className={`mt-3 rounded-lg border px-3 py-2 text-xs ${mensaje.startsWith("No se pudo") ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"}`}>
            {mensaje}
          </p>
        )}
      </header>

      {/* Buscador */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b]" aria-hidden="true" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tarea, código o responsable…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-[#64748b] focus:border-gold/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Atención esta semana / atrasadas */}
      {(atrasadas.length > 0 || estaSemana.length > 0) && (
        <section className="glass rounded-xl p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Atención</h2>
          <div className="space-y-2">
            {atrasadas.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2">
                <i className="fa-solid fa-triangle-exclamation text-rose-400" aria-hidden="true" />
                <span className="font-mono text-xs text-gold/80">{t.codigo}</span>
                <span className="flex-1 text-sm text-white">{t.tarea}</span>
                <span className="text-[11px] text-rose-200">Venció {fmtFecha(t.fin)}</span>
                {canEdit && (
                  <button type="button" onClick={() => marcarTerminada(t)} disabled={savingTask} className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50">
                    <i className="fa-solid fa-check" aria-hidden="true" /> Terminar
                  </button>
                )}
              </div>
            ))}
            {estaSemana.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2">
                <i className="fa-solid fa-calendar-week text-sky-400" aria-hidden="true" />
                <span className="font-mono text-xs text-gold/80">{t.codigo}</span>
                <span className="flex-1 text-sm text-white">{t.tarea}</span>
                <span className="text-[11px] text-sky-200">Vence {fmtFecha(t.fin)}</span>
                {canEdit && (
                  <button type="button" onClick={() => marcarTerminada(t)} disabled={savingTask} className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50">
                    <i className="fa-solid fa-check" aria-hidden="true" /> Terminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bloques y tareas */}
      <div className="space-y-3">
        {grupos.map((g) => {
          const hijos = hojas.filter((t) => t.grupoId === g.id).filter(filtrar);
          const todosHijos = hojas.filter((t) => t.grupoId === g.id);
          const abierto = expandidos[g.id] ?? true;
          if (q && hijos.length === 0) return null;
          return (
            <section key={g.id} className="glass overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => toggleGrupo(g.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.02]"
              >
                <i className={`fa-solid ${abierto ? "fa-chevron-down" : "fa-chevron-right"} text-xs text-gold`} aria-hidden="true" />
                <span className="flex-1 text-sm font-bold uppercase tracking-wide text-gold">{g.tarea}</span>
                <span className="text-[11px] text-[#64748b]">
                  {todosHijos.filter((t) => t.estado === "Terminado").length}/{todosHijos.length} · {fmtFecha(g.inicio)} → {fmtFecha(g.fin)}
                </span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold" style={{ width: `${Math.round(g.avance * 100)}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-bold text-white">{Math.round(g.avance * 100)}%</span>
              </button>
              {abierto && (
                <div className="divide-y divide-white/[0.06] border-t border-white/10">
                  {(q ? hijos : todosHijos).map((t) => {
                    const ui = uiDe(t);
                    return (
                      <div key={t.id} className={`flex flex-wrap items-center gap-2 px-4 py-2.5 ${t.atrasada ? "bg-rose-500/5" : ""}`}>
                        <span className="w-14 shrink-0 font-mono text-[11px] font-bold text-gold/80">{t.codigo}</span>
                        <span className="min-w-0 flex-1 text-sm text-white">{t.tarea}</span>
                        <span className="hidden text-[11px] text-[#64748b] sm:block">{t.responsable}</span>
                        <span className="text-[11px] text-[#64748b]">{fmtFecha(t.inicio)}→{fmtFecha(t.fin)}</span>
                        <button
                          type="button"
                          onClick={() => canEdit && ciclarEstado(t)}
                          disabled={!canEdit || savingTask}
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${ui.chip} ${canEdit ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                          title={canEdit ? "Clic para cambiar estado" : t.estado}
                        >
                          {t.estado || "Pendiente"}
                        </button>
                        <span className={`w-10 shrink-0 text-right text-xs font-bold ${ui.text}`}>{Math.round(t.avance * 100)}%</span>
                        {t.atrasada && <i className="fa-solid fa-triangle-exclamation shrink-0 text-xs text-rose-400" aria-hidden="true" />}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditTask(t)}
                            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gold hover:bg-gold/15"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Gantt opcional */}
      <section className="glass rounded-xl">
        <button
          type="button"
          onClick={() => setGanttAbierto((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gold"
        >
          <i className={`fa-solid ${ganttAbierto ? "fa-chevron-down" : "fa-chevron-right"} text-xs`} aria-hidden="true" />
          Línea de tiempo (Gantt)
        </button>
        {ganttAbierto && (
          <div className="max-h-[60vh] overflow-auto border-t border-white/10 bg-[#070b16] p-2">
            <div className="min-w-[900px]">
              <div className="sticky top-0 z-20 flex border-b border-white/10 bg-[#0a0f1e]">
                <div className="sticky left-0 z-30 w-[260px] shrink-0 border-r border-white/10 bg-[#0a0f1e] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  Tarea
                </div>
                <div className="relative flex-1">
                  <div className="flex h-6 items-end">
                    {plan.meses.map((m) => (
                      <div
                        key={m.label}
                        className="border-l border-white/10 px-2 pb-0.5 text-[10px] font-semibold text-gold/90"
                        style={{
                          width: `${
                            ((plan.meses.find((x) => x.col > m.col)?.col ?? plan.semanas.length) - m.col) /
                            plan.semanas.length *
                            100
                          }%`,
                        }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {grupos.map((g) => {
                const hijos = hojas.filter((t) => t.grupoId === g.id);
                return (
                  <div key={g.id}>
                    <div className="flex border-b border-white/[0.06] bg-white/[0.03]">
                      <div className="sticky left-0 z-10 w-[260px] shrink-0 border-r border-white/10 bg-[#0c1222] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                        {g.tarea}
                      </div>
                      <div className="relative flex-1 py-1.5">
                        {(() => {
                          const pos = posicion(g.inicio, g.fin, plan.rango.inicio, plan.semanas.length);
                          return (
                            <div className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-gold/40" style={{ left: pos.left, width: pos.width }} />
                          );
                        })()}
                      </div>
                    </div>
                    {hijos.map((t) => {
                      const pos = posicion(t.inicio, t.fin, plan.rango.inicio, plan.semanas.length);
                      const ui = uiDe(t);
                      return (
                        <div key={t.id} className="flex border-b border-white/[0.06]">
                          <div className="sticky left-0 z-10 w-[260px] shrink-0 border-r border-white/10 bg-[#070b16] px-3 py-1.5">
                            <span className="text-[11px] text-white">{t.codigo} {t.tarea}</span>
                          </div>
                          <div className="relative flex-1 py-1.5">
                            {t.hito ? (
                              <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-gold" style={{ left: pos.left }} />
                            ) : (
                              <div className={`absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full ${ui.track}`} style={{ left: pos.left, width: pos.width }}>
                                <div className={`h-full rounded-full ${ui.bar}`} style={{ width: `${Math.round(t.avance * 100)}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Editor de estructura */}
      {editando && draft && (
        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">Editar tareas</h2>
            <button type="button" onClick={agregarGrupo} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c7d2e3] hover:border-gold/40 hover:text-gold">
              <i className="fa-solid fa-plus" aria-hidden="true" /> Agregar bloque
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-[#64748b]">
                  <th className="px-2 py-2">Código</th>
                  <th className="px-2 py-2">Tarea</th>
                  <th className="px-2 py-2">Responsable</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Avance</th>
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Sem.</th>
                  <th className="px-2 py-2">Hito</th>
                  <th className="px-2 py-2">Obs.</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {draft.tareas.map((t) => (
                  <tr key={t.id} className={`border-t border-white/[0.06] align-middle ${t.esGrupo ? "bg-white/[0.03]" : ""}`}>
                    {t.esGrupo ? (
                      <>
                        <td className="px-2 py-2 text-[10px] font-bold text-gold">#{t.id}</td>
                        <td className="px-2 py-2" colSpan={8}>
                          <input className={`${INP} font-semibold uppercase text-gold`} value={t.tarea} onChange={(e) => setTarea(t.id, { tarea: e.target.value })} />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => agregarTarea(t.id)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/15">
                              <i className="fa-solid fa-plus" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => quitarTarea(t.id)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/15">
                              <i className="fa-solid fa-trash" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2 w-20">
                          <input className={INP} value={t.codigo} placeholder="—" onChange={(e) => setTarea(t.id, { codigo: e.target.value })} />
                        </td>
                        <td className="px-2 py-2 min-w-[200px]">
                          <input className={INP} value={t.tarea} onChange={(e) => setTarea(t.id, { tarea: e.target.value })} />
                        </td>
                        <td className="px-2 py-2 w-28">
                          <input className={INP} value={t.responsable} placeholder="—" onChange={(e) => setTarea(t.id, { responsable: e.target.value })} />
                        </td>
                        <td className="px-2 py-2 w-24">
                          <select className={INP} value={t.estado || "Pendiente"} onChange={(e) => setTarea(t.id, { estado: e.target.value as PlanEstado })}>
                            {ESTADOS.map((e) => (<option key={e} value={e} className="bg-[#0a0f1e]">{e}</option>))}
                          </select>
                        </td>
                        <td className="px-2 py-2 w-16">
                          <input type="number" min={0} max={100} className={INP} value={Math.round(t.avance * 100)} onChange={(e) => setTarea(t.id, { avance: Math.min(1, Math.max(0, Number(e.target.value) / 100 || 0)) })} />
                        </td>
                        <td className="px-2 py-2 w-32">
                          <input type="date" className={INP} value={t.inicio} onChange={(e) => setTarea(t.id, { inicio: e.target.value })} />
                        </td>
                        <td className="px-2 py-2 w-16">
                          <input type="number" min={1} className={INP} disabled={t.hito} value={t.hito ? 0 : t.semanas ?? 1} onChange={(e) => setTarea(t.id, { semanas: Math.max(1, Number(e.target.value) || 1) })} />
                        </td>
                        <td className="px-2 py-2 w-12 text-center">
                          <input type="checkbox" checked={t.hito} onChange={(e) => setTarea(t.id, { hito: e.target.checked, semanas: e.target.checked ? 0 : 1 })} />
                        </td>
                        <td className="px-2 py-2 min-w-[160px]">
                          <input className={INP} value={t.observaciones} placeholder="—" onChange={(e) => setTarea(t.id, { observaciones: e.target.value })} />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => quitarTarea(t.id)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/15">
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
            <button type="button" onClick={cancelar} disabled={saving} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#94a3b8] hover:text-white disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={guardar} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50">
              <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} aria-hidden="true" />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </section>
      )}

      {/* Quick edit modal */}
      {editTask && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setEditTask(null)}>
          <div className="glass max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gold/30 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Editar tarea</h3>
              <button type="button" onClick={() => setEditTask(null)} className="text-slate-400 hover:text-white">
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
                    {ESTADOS.map((e) => (<option key={e} value={e} className="bg-[#0a0f1e]">{e}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Avance %</label>
                  <input name="avance" type="number" min={0} max={100} defaultValue={Math.round(editTask.avance * 100)} className={INP} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Inicio</label>
                  <input name="inicio" type="date" defaultValue={editTask.inicio} className={INP} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#c7d2e3]">Semanas</label>
                  <input name="semanas" type="number" min={1} defaultValue={editTask.hito ? 1 : editTask.semanas ?? 1} disabled={editTask.hito} className={INP} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#c7d2e3]">
                <input name="hito" type="checkbox" defaultChecked={editTask.hito} /> Hito (un solo día)
              </label>
              <div>
                <label className="mb-1 block text-xs text-[#c7d2e3]">Observaciones</label>
                <textarea name="observaciones" defaultValue={editTask.observaciones} rows={2} className={INP} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditTask(null)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white">Cancelar</button>
                <button type="submit" disabled={savingTask} className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50">
                  <i className={`fa-solid ${savingTask ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} aria-hidden="true" />
                  {savingTask ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Referencias</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#c7d2e3]">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Terminado</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> En curso</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Pendiente</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Bloqueado / atrasado</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rotate-45 rounded-[2px] bg-gold" /> Hito</span>
        </div>
        {plan.referencias.length > 0 && (
          <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-[#64748b]">{plan.referencias[plan.referencias.length - 1]}</p>
        )}
        {plan.fuente && (
          <p className="mt-2 text-[11px] text-[#64748b]">Fuente: <span className="text-[#94a3b8]">{plan.fuente}</span></p>
        )}
      </div>
    </div>
  );
}
