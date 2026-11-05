import { useState, useEffect } from "react";
import { readAgenda } from "@/lib/storage";
import KPIs from "@/components/KPIs";
import AgendaTable from "@/components/AgendaTable";
import AgendaFilters from "@/components/AgendaFilters";

export default function Dashboard() {
  const [agenda, setAgenda] = useState<{
    puntos: any[];
    metadata: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agenda")
      .then((res) => res.json())
      .then((data) => {
        setAgenda(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar agenda:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <span className="text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  if (!agenda) {
    return <div className="min-h-screen p-4">Error cargando los datos.</div>;
  }

  const puntos = agenda.puntos;

  // KPIs calculations
  const total = puntos.length;
  const pendientes = puntos.filter(
    (p: any) => p.estado === "Pendiente"
  ).length;
  const enCurso = puntos.filter(
    (p: any) => p.estado === "En curso"
  ).length;
  const bloqueados = puntos.filter(
    (p: any) => p.estado === "Bloqueado"
  ).length;
  const completados = puntos.filter(
    (p: any) => p.estado === "Completado"
  ).length;
  const avance = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <KPIs
            total={total}
            pendientes={pendientes}
            enCurso={enCurso}
            bloqueados={bloqueados}
            completados={completados}
            avance={avance}
          />
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Últimos documentos
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              (Carga desde data/documentos.json pendiente)
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Próximos vencimientos
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              (Filtrar por fechaCompromiso)
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AgendaFilters />
          <AgendaTable puntos={puntos} />
        </div>
      </div>
    </main>
  );
}