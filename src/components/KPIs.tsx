interface KPIProps {
  total: number;
  pendientes: number;
  enCurso: number;
  bloqueados: number;
  completados: number;
  avance: number;
}

const estados = [
  {
    label: "Pendientes",
    hint: "En cola de inicio",
    icon: "fa-hourglass-half",
    card: "border-slate-800 bg-slate-900/55 hover:border-amber-400/40",
    iconBox:
      "bg-amber-400/10 text-amber-300 shadow-[0_0_20px_-6px_rgba(245,158,11,0.75)]",
    value: "text-amber-200 drop-shadow-[0_0_14px_rgba(245,158,11,0.35)]",
    hintTone: "text-amber-300/70",
    bar: "from-amber-300 via-amber-400 to-amber-600",
    barGlow: "shadow-[0_0_18px_rgba(245,158,11,0.65)]",
  },
  {
    label: "En curso",
    hint: "En ejecución",
    icon: "fa-person-running",
    card: "border-slate-800 bg-slate-900/55 hover:border-cyan-400/40",
    iconBox:
      "bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.75)]",
    value: "text-cyan-200 drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]",
    hintTone: "text-cyan-300/70",
    bar: "from-cyan-300 via-cyan-400 to-cyan-600",
    barGlow: "shadow-[0_0_18px_rgba(34,211,238,0.65)]",
  },
  {
    label: "Bloqueados",
    hint: "Requieren atención",
    icon: "fa-circle-exclamation",
    card: "border-slate-800 bg-slate-900/55 hover:border-rose-400/40",
    iconBox:
      "bg-rose-400/10 text-rose-300 shadow-[0_0_20px_-6px_rgba(244,63,94,0.75)]",
    value: "text-rose-200 drop-shadow-[0_0_14px_rgba(244,63,94,0.35)]",
    hintTone: "text-rose-300/70",
    bar: "from-rose-300 via-rose-400 to-rose-600",
    barGlow: "shadow-[0_0_18px_rgba(244,63,94,0.65)]",
  },
  {
    label: "Completados",
    hint: "Certificados",
    icon: "fa-circle-check",
    card: "border-slate-800 bg-slate-900/55 hover:border-emerald-400/40",
    iconBox:
      "bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_-6px_rgba(16,185,129,0.75)]",
    value: "text-emerald-200 drop-shadow-[0_0_14px_rgba(16,185,129,0.35)]",
    hintTone: "text-emerald-300/70",
    bar: "from-emerald-300 via-emerald-400 to-emerald-600",
    barGlow: "shadow-[0_0_18px_rgba(16,185,129,0.65)]",
  },
] as const;

export default function KPIs({
  total,
  pendientes,
  enCurso,
  bloqueados,
  completados,
  avance,
}: KPIProps) {
  const valores = [pendientes, enCurso, bloqueados, completados];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-400 shadow-[0_0_20px_-6px_rgba(245,158,11,0.6)]">
            <i
              className="fa-solid fa-chart-simple text-xs"
              aria-hidden="true"
            />
          </span>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              KPIs de calidad
            </h3>
            <p className="text-[10px] text-slate-500">Resumen de la planta</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-400 backdrop-blur">
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
          En vivo
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-400/10 via-slate-900/60 to-slate-900/40 p-4 pl-5">
        <span
          className="kpi-bar absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-orange-600 shadow-[0_0_18px_rgba(245,158,11,0.65)]"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
              Total de temas
            </p>
            <p className="font-display mt-1 text-3xl font-extrabold leading-none text-slate-50 drop-shadow-[0_0_18px_rgba(245,158,11,0.25)]">
              {total}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_-8px_rgba(245,158,11,0.8)]">
            <i className="fa-solid fa-layer-group" aria-hidden="true" />
          </span>
        </div>
        <p className="relative mt-2 text-[11px] text-slate-400">
          {completados} completados y {pendientes + enCurso + bloqueados} en
          proceso.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {estados.map((estado, index) => (
          <div
            key={estado.label}
            className={`group relative overflow-hidden rounded-xl border p-3.5 pl-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.95)] ${estado.card}`}
          >
            <span
              className={`kpi-bar absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b ${estado.bar} ${estado.barGlow}`}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${estado.iconBox}`}
              >
                <i
                  className={`fa-solid ${estado.icon} text-xs`}
                  aria-hidden="true"
                />
              </span>
              <span
                className={`font-display text-2xl font-bold ${estado.value}`}
              >
                {valores[index]}
              </span>
            </div>
            <p className="relative mt-2.5 text-xs font-semibold text-slate-200">
              {estado.label}
            </p>
            <p className={`relative text-[10px] ${estado.hintTone}`}>
              {estado.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/55 p-4 pl-5">
        <span
          className="kpi-bar absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-600 shadow-[0_0_18px_rgba(34,211,238,0.65)]"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <i
              className="fa-solid fa-arrow-trend-up text-amber-400"
              aria-hidden="true"
            />
            Avance general
          </span>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
            {avance}%
          </span>
        </div>

        <div
          className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-white/5"
          role="progressbar"
          aria-label="Avance general de la certificación"
          aria-valuenow={avance}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${avance} por ciento`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_14px_rgba(245,158,11,0.55)] transition-all duration-700 ease-out"
            style={{ width: `${avance}%` }}
          />
        </div>

        <div className="relative mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
          <span>0%</span>
          <span>
            {completados} de {total} completados
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
