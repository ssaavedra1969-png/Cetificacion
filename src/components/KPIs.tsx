interface KPIProps {
  total: number;
  pendientes: number;
  enCurso: number;
  bloqueados: number;
  completados: number;
  avance: number;
}

export default function KPIs({
  total,
  pendientes,
  enCurso,
  bloqueados,
  completados,
  avance,
}: KPIProps) {
  const estados = [
    {
      label: "Pendientes",
      value: pendientes,
      icon: "fa-hourglass-start",
      tone: "text-amber-300",
      border: "border-amber-400/20",
      background: "bg-amber-400/[0.06]",
      dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.85)]",
      pulse: true,
    },
    {
      label: "En curso",
      value: enCurso,
      icon: "fa-running",
      tone: "text-sky-300",
      border: "border-sky-400/20",
      background: "bg-sky-400/[0.06]",
      dot: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.85)]",
      pulse: true,
    },
    {
      label: "Bloqueados",
      value: bloqueados,
      icon: "fa-exclamation-circle",
      tone: "text-rose-300",
      border: "border-rose-400/20",
      background: "bg-rose-400/[0.06]",
      dot: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.85)]",
      pulse: true,
    },
    {
      label: "Completados",
      value: completados,
      icon: "fa-check-circle",
      tone: "text-emerald-300",
      border: "border-emerald-400/20",
      background: "bg-emerald-400/[0.06]",
      dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]",
      pulse: false,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 shadow-[0_24px_60px_-42px_rgba(0,0,0,1)] backdrop-blur-md">
      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-amber-400/[0.06] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              KPIs de calidad
            </span>
            <span
              className="hidden h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] sm:inline-block"
              aria-hidden="true"
            />
          </div>

          <p className="font-display text-2xl font-extrabold leading-none text-slate-50">
            <span className="text-amber-300">{total}</span> Temas Activos
          </p>

          <div className="min-w-[140px] flex-1 lg:w-52 lg:flex-none">
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>Avance general</span>
              <span className="font-mono font-bold text-cyan-300">
                {avance}%
              </span>
            </div>
            <div
              className="mt-1 h-0.5 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-label="Avance general de la certificación"
              aria-valuenow={avance}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${avance} por ciento`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 transition-all duration-700 ease-out"
                style={{ width: `${avance}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {estados.map((estado) => (
            <div
              key={estado.label}
              className="inline-flex items-center gap-2 text-xs"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md border ${estado.border} ${estado.background} ${estado.tone}`}
              >
                <i
                  className={`fa-solid ${estado.icon} text-[10px]`}
                  aria-hidden="true"
                />
              </span>
              <span className="text-slate-400">{estado.label}</span>
              <span className={`font-display text-sm font-bold ${estado.tone}`}>
                {estado.value}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${estado.dot} ${
                  estado.pulse ? "animate-pulse-dot" : ""
                }`}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
