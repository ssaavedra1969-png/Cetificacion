import { useState, useEffect } from "react";
import { readDocumentos } from "@/lib/storage";

interface Documento {
  id: string;
  nombre: string;
  categoria: string;
  puntoId: string;
  planta: string;
  fecha: string;
  version: string;
  responsable: string;
  descripcion: string;
  archivoUrl: string;
  tipo: string;
}

export default function Documentoteca() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documentos")
      .then((res) => res.json())
      .then((data) => {
        setDocumentos(data.documentos || []);
        setCategorias(data.categorias || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar documentos:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <span className="text-gray-600">Cargando documentoteca...</span>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Documentoteca / Evidencias
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Repositorio de PDFs y documentos de soporte del SGC
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorias.map((categoria) => (
            <div
              key={categoria}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {categoria}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {documentos.filter((d) => d.categoria === categoria).length}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ver documentos
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Todos los documentos
          </h2>
          {documentos.length === 0
            ? <p className="text-gray-500 dark:text-gray-400 py-8">
                No hay documentos cargados aún.
                <br />
                Suba PDFs mediante la administración o agréguelos manualmente en
                <code className="font-medium text-blue-600 dark:text-blue-400">
                  /public/documentos
                </code> y actualice data/documentos.json.
              </p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Nombre
                      </th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Categoría
                      </th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Punto SGC
                      </th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Planta
                      </th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Fecha
                      </th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Version
                      </th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">
                        Descargar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((d: any) => (
                      <tr key={d.id} className="border-b dark:border-gray-700">
                        <td className="py-3 px-3">
                          <a
                            href={d.archivoUrl}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {d.nombre}
                          </a>
                        </td>
                        <td className="py-3 px-3">{d.categoria}</td>
                        <td className="py-3 px-3">{d.puntoId}</td>
                        <td className="py-3 px-3">{d.planta}</td>
                        <td className="py-3 px-3">{d.fecha}</td>
                        <td className="py-3 px-3">{d.version}</td>
                        <td className="py-3 px-3">
                          <a
                            href={d.archivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 dark:text-green-400 text-sm hover:underline"
                          >
                            Descargar
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}