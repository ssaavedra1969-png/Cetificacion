interface KPIProps {
  total: number;
  pendientes: number;
  enCurso: number;
  bloqueados: number;
  completados: number;
  avance: number;
}

export default function KPIs({ total, pendientes, enCurso, bloqueados, completados, avance }: KPIProps) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">KPIs del SGC</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total de puntos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendientes}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pendientes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{enCurso}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">En curso</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{bloqueados}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Bloqueados</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Avance general</div>
        <div className="mt-2">
          <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden" style={{ width: `${avance}%` }}>
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-800 w-full"
              style={{ width: `${avance}%` }}
            ></div>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>{avance}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}