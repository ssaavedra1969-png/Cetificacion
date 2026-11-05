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
  const cards = [
    { label: "Total", value: total, tone: "text-white" },
    { label: "Pendientes", value: pendientes, tone: "text-amber-300" },
    { label: "En curso", value: enCurso, tone: "text-blue-300" },
    { label: "Bloqueados", value: bloqueados, tone: "text-red-300" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <i className="fa-solid fa-chart-simple text-gold" aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb0c9]">
          KPIs del SGC
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className={`font-display text-2xl font-bold ${card.tone}`}>
              {card.value}
            </div>
            <div className="mt-0.5 text-xs text-[#7f8ea8]">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-[#9fb0c9]">
          <span>
            <i
              className="fa-solid fa-arrow-trend-up mr-1.5 text-emerald-400"
              aria-hidden="true"
            />
            Avance general
          </span>
          <span className="font-semibold text-white">{avance}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-700"
            style={{ width: `${avance}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#6f7f99]">
          <span>0%</span>
          <span>
            {completados} de {total} completados
          </span>
        </div>
      </div>
    </div>
  );
}
