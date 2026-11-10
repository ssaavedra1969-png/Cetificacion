"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Documento } from "@/types/models";
import DocumentoModal from "@/components/DocumentoModal";
import { useSession } from "@/components/useSession";
import { downloadUrl } from "@/lib/urls";
import { isOfficeTipo } from "@/lib/files";

const ORDEN_CATEGORIAS: string[] = [
  "Resguardo de información",
  "Muestras de Campana",
  "Certificados de calibración",
  "Layout",
  "Seguridad vial",
  "Administración",
  "Muestreo",
  "Control de calidad de áridos de cantera propia",
  "Control de calidad del agua",
  "Documentación del laboratorio",
  "Control de calidad",
];

function ordenarCategorias(lista: string[]): string[] {
  return [...lista].sort(
    (a, b) =>
      (ORDEN_CATEGORIAS.indexOf(a) ?? 99) - (ORDEN_CATEGORIAS.indexOf(b) ?? 99),
  );
}

function iconFor(tipo: string): { icon: string; color: string; bg: string } {
  if (tipo === "pdf") {
    return {
      icon: "fa-file-pdf",
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/20",
    };
  }
  if (tipo === "imagen") {
    return {
      icon: "fa-file-image",
      color: "text-purple-400",
      bg: "bg-purple-400/10 border-purple-400/20",
    };
  }
  if (tipo === "word") {
    return {
      icon: "fa-file-word",
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
    };
  }
  if (tipo === "excel") {
    return {
      icon: "fa-file-excel",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
    };
  }
  return {
    icon: "fa-file",
    color: "text-gold",
    bg: "bg-gold/10 border-gold/20",
  };
}

export default function Documentoteca() {
  const { user, canEdit } = useSession();
  const canDelete = user?.rol === "admin";
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<Documento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docParaEliminar, setDocParaEliminar] = useState<Documento | null>(
    null,
  );

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroPlanta, setFiltroPlanta] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

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

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      if (filtroCategoria !== "Todas" && doc.categoria !== filtroCategoria) {
        return false;
      }
      if (filtroPlanta !== "Todas" && doc.planta !== filtroPlanta) {
        return false;
      }
      if (filtroTipo !== "Todos") {
        if (filtroTipo === "office" && !isOfficeTipo(doc.tipo)) return false;
        if (filtroTipo !== "office" && doc.tipo !== filtroTipo) return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const texto = [
          doc.nombre,
          doc.categoria,
          doc.planta,
          doc.puntoId,
          doc.responsable,
          doc.descripcion,
          doc.fecha,
        ]
          .join(" ")
          .toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [documentos, filtroCategoria, filtroPlanta, filtroTipo, busqueda]);

  async function eliminarDocumento(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documentos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar el documento");
      }
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
      setDocParaEliminar(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <i className="fa-solid fa-folder-open" aria-hidden="true" />
              Evidencias y Certificaciones
            </span>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Documentoteca SGC
            </h1>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Repositorio centralizado de certificados, especificaciones
              técnicas, actas y registros de calidad.
            </p>
          </div>

          {canEdit && (
            <Link
              href="/administracion#documentos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-xs font-bold text-[#0f172a] shadow-[0_10px_25px_-5px_rgba(212,175,55,0.5)] transition-all hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
              Subir documento
            </Link>
          )}
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

        {/* Categorías con selector rápido */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
              Categorías
            </h2>
            {filtroCategoria !== "Todas" && (
              <button
                type="button"
                onClick={() => setFiltroCategoria("Todas")}
                className="text-xs text-gold underline underline-offset-2 hover:text-amber-200"
              >
                Ver todas las categorías
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordenarCategorias(categorias).map((categoria, i) => {
              const count = documentos.filter(
                (d) => d.categoria === categoria,
              ).length;
              const seleccionada = filtroCategoria === categoria;
              const numero = i + 1;

              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() =>
                    setFiltroCategoria(seleccionada ? "Todas" : categoria)
                  }
                  className={`glass glass-hover flex items-center justify-between rounded-xl p-3 text-left transition-all ${
                    seleccionada
                      ? "border-gold/60 bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          seleccionada
                            ? "bg-gold text-[#0f172a]"
                            : "bg-gold/10 text-gold"
                        }`}
                      >
                        <span className="text-xs font-bold">{numero}</span>
                      </span>
                      <span className="truncate text-xs font-medium text-white">
                        {categoria}
                      </span>
                    </div>
                  </div>
                  <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-[#94a3b8]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filtros y Buscador */}
        <section className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {/* Buscador */}
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <i
                  className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, categoría, planta o responsable..."
                  className="w-full rounded-lg border border-white/10 bg-[#0f172a] py-2 pl-9 pr-8 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-white"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Filtro Planta */}
              <select
                value={filtroPlanta}
                onChange={(e) => setFiltroPlanta(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white outline-none transition focus:border-gold/60"
              >
                <option value="Todas">Planta: Todas</option>
                <option value="Campana">Campana</option>
                <option value="Luján">Luján</option>
                <option value="General">General</option>
              </select>

              {/* Filtro Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white outline-none transition focus:border-gold/60"
              >
                <option value="Todos">Tipo: Todos</option>
                <option value="pdf">Solo PDF</option>
                <option value="office">Word / Excel (Office)</option>
                <option value="imagen">Imágenes</option>
              </select>
            </div>

            <p className="text-xs text-[#64748b]">
              Mostrando{" "}
              <span className="font-mono text-white font-semibold">
                {documentosFiltrados.length}
              </span>{" "}
              de{" "}
              <span className="font-mono text-white">{documentos.length}</span>{" "}
              documentos
            </p>
          </div>

          {/* Listado / Tabla */}
          {loading ? (
            <div className="glass flex items-center justify-center rounded-2xl p-12 text-sm text-[#94a3b8]">
              <i
                className="fa-solid fa-spinner fa-spin mr-2 text-gold"
                aria-hidden="true"
              />
              Cargando documentoteca...
            </div>
          ) : documentosFiltrados.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <i
                className="fa-solid fa-inbox mb-3 text-3xl text-gold/60"
                aria-hidden="true"
              />
              <p className="text-sm text-[#94a3b8]">
                {busqueda ||
                filtroCategoria !== "Todas" ||
                filtroPlanta !== "Todas" ||
                filtroTipo !== "Todos"
                  ? "No se encontraron documentos con los filtros seleccionados."
                  : "No hay documentos cargados aún."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                {busqueda ||
                filtroCategoria !== "Todas" ||
                filtroPlanta !== "Todas" ||
                filtroTipo !== "Todos" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("");
                      setFiltroCategoria("Todas");
                      setFiltroPlanta("Todas");
                      setFiltroTipo("Todos");
                    }}
                    className="text-xs text-gold underline underline-offset-2 hover:text-amber-200"
                  >
                    Restablecer filtros
                  </button>
                ) : canEdit ? (
                  <Link
                    href="/administracion#documentos"
                    className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20"
                  >
                    Subir el primer documento
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="glass overflow-x-auto rounded-2xl">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0f172a]/60 text-[10px] uppercase tracking-wider text-[#64748b]">
                    <th className="px-4 py-3 font-semibold">Documento</th>
                    <th className="px-3 py-3 font-semibold">Categoría</th>
                    <th className="px-3 py-3 font-semibold">Tema SGC</th>
                    <th className="px-3 py-3 font-semibold">Planta</th>
                    <th className="px-3 py-3 font-semibold">Fecha</th>
                    <th className="px-2 py-3 font-semibold">Versión</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Visualización
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {documentosFiltrados.map((d) => {
                    const style = iconFor(d.tipo);

                    return (
                      <tr
                        key={d.id}
                        className="group transition-colors hover:bg-white/[0.04]"
                      >
                        {/* Nombre e icono */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setModalDoc(d)}
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 ${style.bg} ${style.color}`}
                              title="Ver en visor integrado"
                            >
                              <i
                                className={`fa-solid ${style.icon} text-sm`}
                                aria-hidden="true"
                              />
                            </button>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setModalDoc(d)}
                                className="block truncate text-left text-xs font-semibold text-white transition-colors hover:text-gold"
                                title={d.nombre}
                              >
                                {d.nombre}
                              </button>
                              {d.responsable && (
                                <p className="text-[11px] text-[#64748b] truncate max-w-[200px]">
                                  {d.responsable}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="px-3 py-3 text-[#94a3b8]">
                          <span className="inline-block rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[11px]">
                            {d.categoria}
                          </span>
                        </td>

                        {/* Tema */}
                        <td className="px-3 py-3 text-[#94a3b8]">
                          {d.puntoId ? (
                            <Link
                              href={`/temas/${d.puntoId}`}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-gold/90 hover:underline"
                            >
                              <i
                                className="fa-solid fa-link text-[9px]"
                                aria-hidden="true"
                              />
                              {d.puntoId}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-[#64748b]">
                              —
                            </span>
                          )}
                        </td>

                        {/* Planta */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              d.planta === "Campana"
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                : d.planta === "Luján"
                                  ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                                  : "border-slate-400/30 bg-slate-400/10 text-slate-300"
                            }`}
                          >
                            {d.planta}
                          </span>
                        </td>

                        {/* Fecha */}
                        <td className="px-3 py-3 text-[#94a3b8]">{d.fecha}</td>

                        {/* Versión */}
                        <td className="px-2 py-3 font-mono text-[#94a3b8]">
                          v{d.version}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ver en Modal rápido */}
                            <button
                              type="button"
                              onClick={() => setModalDoc(d)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20"
                              title="Abrir visor integrado"
                            >
                              <i
                                className="fa-solid fa-eye text-[11px]"
                                aria-hidden="true"
                              />
                              Ver
                            </button>

                            {/* Abrir en página completa / nueva pestaña */}
                            <Link
                              href={`/documentos/${d.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-1 text-xs text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-white"
                              title="Abrir en página completa / pestaña nueva"
                            >
                              <i
                                className="fa-solid fa-arrow-up-right-from-square text-[11px]"
                                aria-hidden="true"
                              />
                            </Link>

                            {/* Descargar */}
                            <a
                              href={downloadUrl(d.archivoUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-1 text-xs text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-white"
                              title="Descargar archivo"
                            >
                              <i
                                className="fa-solid fa-download text-[11px]"
                                aria-hidden="true"
                              />
                            </a>

                            {/* Eliminar (solo admin) */}
                            {canDelete && (
                              <>
                                {docParaEliminar?.id === d.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => eliminarDocumento(d.id)}
                                      disabled={deletingId === d.id}
                                      className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-400/20 disabled:opacity-60"
                                      title="Eliminar documento"
                                    >
                                      {deletingId === d.id ? (
                                        <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                                      ) : (
                                        <i className="fa-solid fa-trash-can text-[10px]" />
                                      )}
                                      Sí
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDocParaEliminar(null)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-white/10 hover:text-white"
                                      title="Cancelar"
                                    >
                                      <i className="fa-solid fa-xmark text-[10px]" />
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDocParaEliminar(d)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-400/20"
                                    title="Eliminar documento"
                                  >
                                    <i className="fa-solid fa-trash-can text-[10px]" />
                                    Eliminar
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Visor Modal de Documento */}
      {modalDoc && (
        <DocumentoModal
          documento={modalDoc}
          onClose={() => setModalDoc(null)}
        />
      )}
    </main>
  );
}
