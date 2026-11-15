"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PlanTask { id: string; codigo: string; tarea: string; fin: string; atrasada: boolean; estado: string; esGrupo: boolean; }
interface Doc { id: string; nombre: string; fecha: string; categoria: string; }

const MS_DIA = 86400000;

export default function Notifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    if (loaded) return;
    fetch("/api/plan")
      .then((r) => r.json())
      .then((d) => {
        // derive fin from /api/plan? plan raw doesn't have fin. Use derivePlan client-side? Instead fetch derived via page? We'll compute fin approx: use raw inicio+semanas. Simpler: fetch not enough. Let's just store raw and compute.
        setTasks([]);
      })
      .catch(() => {});
    // Instead, fetch the plan page's derived data is not available via API. We'll compute from raw.
    fetch("/api/plan")
      .then((r) => r.json())
      .then((raw) => {
        const tareas = Array.isArray(raw.tareas) ? raw.tareas : [];
        const hoy = new Date().toISOString().slice(0, 10);
        const calc = tareas
          .filter((t: any) => !t.esGrupo)
          .map((t: any) => {
            const s = typeof t.semanas === "number" && t.semanas > 0 ? t.semanas : t.hito ? 0 : 1;
            let fin = t.inicio;
            if (!t.hito && s > 0) {
              const d = new Date(t.inicio + "T00:00:00Z");
              d.setUTCDate(d.getUTCDate() + Math.round(s * 7) - 3);
              fin = d.toISOString().slice(0, 10);
            }
            const atrasada = !t.hito && t.estado !== "Terminado" && fin < hoy;
            return { id: t.id, codigo: t.codigo, tarea: t.tarea, fin, atrasada, estado: t.estado, esGrupo: false };
          });
        setTasks(calc);
      })
      .catch(() => {});
    fetch("/api/documentos")
      .then((r) => r.json())
      .then((d) => setDocs(d.documentos || []))
      .catch(() => {});
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    load();
  }, [load]);

  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = tasks.filter((t) => {
    if (t.estado === "Terminado") return false;
    const fin = new Date(t.fin + "T00:00:00Z").getTime();
    const h = new Date(hoy + "T00:00:00Z").getTime();
    return fin >= h && fin <= h + 7 * MS_DIA;
  });
  const atrasadas = tasks.filter((t) => t.atrasada);
  const pendientes = atrasadas.length + proximas.length;

  const docsRecientes = docs
    .slice()
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
    .slice(0, 5);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          load();
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-slate-200 transition hover:border-amber-400/40 hover:text-amber-200"
        title="Notificaciones"
      >
        <i className="fa-solid fa-bell text-[13px]" aria-hidden="true" />
        {pendientes > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-[#0f172a]">
            {pendientes > 9 ? "9+" : pendientes}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e]/95 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-bold text-white">Centro de alertas</p>
              <p className="text-[11px] text-[#64748b]">Tareas y documentos recientes</p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {atrasadas.length === 0 && proximas.length === 0 && (
                <p className="p-4 text-center text-sm text-[#64748b]">Sin alertas pendientes.</p>
              )}
              {atrasadas.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300">Atrasadas</p>
                  {atrasadas.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push("/plan");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
                    >
                      <i className="fa-solid fa-triangle-exclamation text-rose-400" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">{t.codigo} {t.tarea}</span>
                        <span className="block text-[10px] text-[#64748b]">Venció {t.fin}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {proximas.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">Vencen esta semana</p>
                  {proximas.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push("/plan");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
                    >
                      <i className="fa-solid fa-calendar-week text-amber-400" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">{t.codigo} {t.tarea}</span>
                        <span className="block text-[10px] text-[#64748b]">Vence {t.fin}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {docsRecientes.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Documentos recientes</p>
                  {docsRecientes.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push("/documentoteca");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
                    >
                      <i className="fa-solid fa-file text-slate-400" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">{d.nombre}</span>
                        <span className="block text-[10px] text-[#64748b]">{d.categoria} · {d.fecha}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
