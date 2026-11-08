"use client";

import { useEffect, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documentos")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la documentoteca");
        return res.json();
      })
      .then((data) => {
        setDocumentos(data.documentos || []);
        setCategorias(data.categorias || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <i className="fa-solid fa-folder-open" aria-hidden="true" />
            Evidencias de calidad
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Documentoteca
          </h1>
          <p className="mt-2 max-w-2xl text-[#9fb0c9]">
            Repositorio de PDFs, certificados y documentos de soporte del
            Sistema de Gestión de Calidad.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <i
              className="fa-solid fa-triangle-exclamation"
              aria-hidden="true"
            />
            {error}
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb0c9]">
            Categorías
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria) => {
              const count = documentos.filter(
                (d) => d.categoria === categoria,
              ).length;
              return (
                <div
                  key={categoria}
                  className="glass glass-hover flex items-center justify-between rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <i className="fa-solid fa-folder" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-white">
                      {categoria}
                    </span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[#9fb0c9]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb0c9]">
            Todos los documentos
          </h2>

          {loading ? (
            <div className="glass flex items-center justify-center rounded-2xl p-12 text-sm text-[#9fb0c9]">
              <i
                className="fa-solid fa-spinner fa-spin mr-2 text-gold"
                aria-hidden="true"
              />
              Cargando documentoteca...
            </div>
          ) : documentos.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <i
                className="fa-solid fa-inbox mb-3 text-3xl text-gold/60"
                aria-hidden="true"
              />
              <p className="text-sm text-[#9fb0c9]">
                No hay documentos cargados aún.
              </p>
              <p className="mt-1 text-xs text-[#6f7f99]">
                Podés subir PDFs desde la administración.
              </p>
            </div>
          ) : (
            <div className="glass overflow-x-auto rounded-2xl">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {[
                      "Nombre",
                      "Categoría",
                      "Tema",
                      "Planta",
                      "Fecha",
                      "Versión",
                      "Abrir",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={`/documentos/${d.id}`}
                          className="font-medium text-gold hover:text-amber-200"
                        >
                          {d.nombre}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-[#9fb0c9]">
                        {d.categoria}
                      </td>
                      <td className="px-4 py-3 text-[#9fb0c9]">{d.puntoId}</td>
                      <td className="px-4 py-3 text-[#9fb0c9]">{d.planta}</td>
                      <td className="px-4 py-3 text-[#9fb0c9]">{d.fecha}</td>
                      <td className="px-4 py-3 text-[#9fb0c9]">{d.version}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/documentos/${d.id}`}
                          className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200"
                        >
                          <i
                            className="fa-solid fa-up-right-from-square"
                            aria-hidden="true"
                          />
                          Abrir
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
