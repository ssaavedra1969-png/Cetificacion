import { useState, useMemo } from "react";

interface AgendaTableProps {
  puntos: any[];
}

export default function AgendaTable({ puntos }: AgendaTableProps) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");

  const filteredPuntos = useMemo(() => {
    return puntos.filter((p: any) => {
      const matchSearch =
        search === "" ||
        p.titulo.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [search]);

  const columns = [
    { key: "titulo", label: "Título", width: "40%" },
    { key: "categoria", label: "Categoría", width: "15%" },
    { key: "plantas", label: "Planta(s)", width: "15%" },
    { key: "estado", label: "Estado", width: "15%" },
    { key: "responsable", label: "Responsable", width: "30%" },
  ];

  const statusClasses = {
    Pendiente: "bg-gray-100 text-gray-800",
    "En curso": "bg-blue-100 text-blue-800",
    Bloqueado: "bg-red-100 text-red-800",
    Completado: "bg-green-100 text-green-800",
  };

  const statusLabels = {
    Pendiente: "Pendiente",
    "En curso": "En curso",
    Bloqueado: "Bloqueado",
    Completado: "Completado",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Agenda de Trabajo SGC
        </h2>

        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange:e => setView(e.target.value as "table" | "cards")
            className="px-3 py-1 border border-gray-300 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="table">Tabla</option>
            <option value="cards">Tarjetas</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar título o descripción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-64 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          className="flex-1"
        />
      </div>

      {filteredPuntos.length === 0
        ? <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay puntos que coincidan con la búsqueda.
          </p>
        : view === "table"
          ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-border mb-4">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPuntos.map((p: any) => (
                      <tr key={p.id} className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="py-3 px-3">
                          <a
                            href={`/punto/${p.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {p.titulo}
                          </a>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[p.estado]}`
                          >
                            {statusLabels[p.estado]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {p.plantas.join(", ")}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[p.estado]}`
                          >
                            {statusLabels[p.estado]}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {p.responsable || "A definir"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPuntos.map((p: any) => (
                  <div
                    key={p.id}
                    className="group bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {p.titulo}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {p.categoria}
                        </p>
                      </div>
                      <span
        className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[p.estado]}`}
      >
        {statusLabels[p.estado]}
      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">
                      {p.descripcion}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Plantas:</span>
                      {p.plantas.map((planta: string) => (
                        <span
                          key={planta}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full"
                        >
                          {planta}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Responsable: {p.responsable || "A definir"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Fecha compromiso: {p.fechaCompromiso || "A definir"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
    </div>
  );
}