"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Documento, HistorialCambio, PuntoSGC } from "@/types/models";
import DocumentoManager from "@/components/DocumentoManager";
import DocumentoModal from "@/components/DocumentoModal";

interface AgendaData {
  puntos: PuntoSGC[];
  metadata: Record<string, unknown>;
}

interface DocumentosData {
  documentos: Documento[];
  categorias: string[];
}

interface SessionInfo {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  plantas: string[];
}

const CATEGORIAS_DEFAULT = [
  "Resguardo de información",
  "Muestras de Campana",
  "Certificados de calibración",
  "Layout",
  "Seguridad vial",
  "Administración",
  "Muestreo",
  "Control de calidad",
  "Documentación del laboratorio",
];

const ESTADOS: PuntoSGC["estado"][] = [
  "Pendiente",
  "En curso",
  "Bloqueado",
  "Completado",
];

const estadoClasses: Record<PuntoSGC["estado"], string> = {
  Pendiente: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  "En curso": "border-blue-400/30 bg-blue-400/10 text-blue-300",
  Bloqueado: "border-red-400/30 bg-red-400/10 text-red-300",
  Completado: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

export default function Administracion() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [documentos, setDocumentos] = useState<DocumentosData>({
    documentos: [],
    categorias: [],
  });

  const [usuario, setUsuario] = useState<SessionInfo | null>(null);
  const [editando, setEditando] = useState<PuntoSGC | null>(null);
  const [mensaje, setMensaje] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Estados para subida y vinculación directa a temas
  const [temaParaSubir, setTemaParaSubir] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<Documento | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoadingData(true);
    try {
      const [agendaRes, docsRes] = await Promise.all([
        fetch("/api/agenda"),
        fetch("/api/documentos"),
      ]);
      if (agendaRes.ok) setAgenda(await agendaRes.json());
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocumentos({
          documentos: data.documentos || [],
          categorias: data.categorias || [],
        });
      }
    } catch {
      setMensaje({
        type: "error",
        text: "Error de conexión con el servidor",
      });
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Detectar parámetro ?tema= en la URL para abrirlo automáticamente
  useEffect(() => {
    if (typeof window === "undefined" || !agenda) return;
    const params = new URLSearchParams(window.location.search);
    const temaId = params.get("tema");
    if (temaId) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTemaParaSubir(temaId);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [agenda]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setUsuario(data.user ?? null);
          await cargarDatos();
        } else {
          router.replace("/login?next=/administracion");
        }
      })
      .catch(() => {
        router.replace("/login?next=/administracion");
      })
      .finally(() => setChecking(false));
  }, [cargarDatos, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setAgenda(null);
    setEditando(null);
    setMensaje(null);
    router.push("/login");
    router.refresh();
  };

  const guardarPunto = useCallback(
    async (puntoData: PuntoSGC, cerrar: boolean = true) => {
      if (!agenda) return;

      // Asegurar que no se pierdan documentos vinculados
      const docsDeEstePunto = documentos.documentos
        .filter((d) => d.puntoId === puntoData.id)
        .map((d) => d.id);
      const documentosIds = Array.from(
        new Set([...(puntoData.documentosIds || []), ...docsDeEstePunto]),
      );
      const puntoActualizado = { ...puntoData, documentosIds };

      const existe = agenda.puntos.some((p) => p.id === puntoData.id);
      const nuevosPuntos = existe
        ? agenda.puntos.map((p) =>
            p.id === puntoData.id ? puntoActualizado : p,
          )
        : [...agenda.puntos, puntoActualizado];

      try {
        const res = await fetch("/api/agenda", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puntos: nuevosPuntos,
            metadata: agenda.metadata,
          }),
        });

        if (res.status === 401) {
          setAuthenticated(false);
          setMensaje({
            type: "error",
            text: "La sesión expiró. Volvé a ingresar.",
          });
          return;
        }

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "No se pudo guardar");

        setAgenda({ puntos: nuevosPuntos, metadata: agenda.metadata });
        if (cerrar) setEditando(null);
        else setEditando(puntoActualizado);
        setMensaje({
          type: "success",
          text: result.remote
            ? "Guardado y publicado en GitHub correctamente"
            : "Tema actualizado correctamente",
        });
      } catch (error) {
        setMensaje({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Error al guardar el tema",
        });
      }
    },
    [agenda, documentos.documentos],
  );

  const desvincularDocDeTema = async (docId: string) => {
    if (
      !window.confirm(
        "¿Desvincular este documento del tema? Seguirá existiendo en la Documentoteca.",
      )
    ) {
      return;
    }
    try {
      const fd = new FormData();
      fd.append("id", docId);
      fd.append("puntoId", "");
      const res = await fetch("/api/documentos", {
        method: "PATCH",
        body: fd,
      });
      if (res.ok) {
        setMensaje({
          type: "success",
          text: "Documento desvinculado del tema correctamente",
        });
        await cargarDatos();
      } else {
        const result = await res.json().catch(() => ({}));
        setMensaje({
          type: "error",
          text: result.error || "No se pudo desvincular",
        });
      }
    } catch {
      setMensaje({
        type: "error",
        text: "Error de conexión al desvincular el documento",
      });
    }
  };

  const categorias = documentos.categorias.length
    ? documentos.categorias
    : CATEGORIAS_DEFAULT;
  const puntos = agenda?.puntos ?? [];

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-[#94a3b8]">
          <i
            className="fa-solid fa-spinner fa-spin text-gold"
            aria-hidden="true"
          />
          Verificando sesión...
        </span>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-[#94a3b8]">
          <i
            className="fa-solid fa-spinner fa-spin text-gold"
            aria-hidden="true"
          />
          Redirigiendo al inicio de sesión...
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-14 z-30 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl md:top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <i className="fa-solid fa-sliders text-gold" aria-hidden="true" />
            Administración SGC
          </div>
          <div className="flex items-center gap-2">
            {usuario && (
              <span className="hidden items-center gap-2 text-xs text-[#94a3b8] sm:flex">
                <i className="fa-solid fa-circle-user text-gold" aria-hidden="true" />
                {usuario.nombre}
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7d2e3]">
                  {usuario.rol}
                </span>
              </span>
            )}
            <button
              onClick={cargarDatos}
              disabled={loadingData}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#c7d2e3] transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              <i
                className={`fa-solid fa-rotate ${loadingData ? "fa-spin" : ""}`}
                aria-hidden="true"
              />
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-400/20"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {mensaje && (
          <div
            className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              mensaje.type === "success"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : mensaje.type === "info"
                  ? "border-blue-400/25 bg-blue-400/10 text-blue-300"
                  : "border-red-400/25 bg-red-400/10 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <i
                className={`fa-solid ${
                  mensaje.type === "success"
                    ? "fa-circle-check"
                    : mensaje.type === "info"
                      ? "fa-circle-info"
                      : "fa-triangle-exclamation"
                }`}
                aria-hidden="true"
              />
              {mensaje.text}
            </div>
            <button
              type="button"
              onClick={() => setMensaje(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Encabezado de Temas */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <i className="fa-solid fa-list-check" aria-hidden="true" />
              Agenda SGC
            </span>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white">
              Temas y Puntos de Control
            </h1>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Hacé clic en cualquier tema para editarlo o utilizá <strong>+ Adjuntar doc</strong> para subirle archivos directamente.
            </p>
          </div>
          <button
            onClick={() =>
              setEditando({
                id: `P${Date.now()}`,
                titulo: "",
                descripcion: "",
                categoria: categorias[0] ?? "",
                plantas: [],
                responsable: "A definir",
                prioridad: "media",
                estado: "Pendiente",
                fechaCompromiso: "",
                fechaActualizacion: new Date().toISOString(),
                notas: "",
                documentosIds: [],
                historial: [],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-[#0f172a] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Nuevo tema
          </button>
        </div>

        {/* Grilla de Temas SGC con acción directa de adjuntar doc */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {puntos.map((p) => {
            const numDocs = documentos.documentos.filter(
              (d) => d.puntoId === p.id,
            ).length;
            return (
              <div
                key={p.id}
                onClick={() => setEditando(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setEditando(p);
                }}
                className="glass glass-hover flex flex-col justify-between rounded-xl p-4 text-left cursor-pointer transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                        {p.id}
                      </p>
                      <h2 className="mt-1 truncate text-sm font-semibold text-white">
                        {p.titulo}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs text-[#94a3b8]">
                        {p.descripcion}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${estadoClasses[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[11px] text-[#94a3b8]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <i className="fa-solid fa-industry" aria-hidden="true" />
                      {p.plantas.length ? p.plantas.join(" · ") : "General"}
                    </span>
                    {numDocs > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-gold">
                        <i className="fa-solid fa-paperclip" aria-hidden="true" />
                        {numDocs} docs
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTemaParaSubir(p.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold transition-colors hover:bg-gold/20"
                    title={`Subir y vincular documento al tema ${p.id}`}
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-[9px]" aria-hidden="true" />
                    + Adjuntar doc
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal / Formulario de Edición de Tema */}
        {editando && (
          <section className="mt-8">
            <div className="glass rounded-2xl p-6 border border-gold/20">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-white">
                  {puntos.some((p) => p.id === editando.id)
                    ? `Editar Tema: [${editando.id}] ${editando.titulo}`
                    : "Nuevo tema"}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#c7d2e3] transition-colors hover:bg-white/10"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                  Cerrar
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const plantas = Array.from(
                    (
                      e.currentTarget.elements.namedItem(
                        "plantas",
                      ) as HTMLSelectElement
                    ).selectedOptions,
                  ).map((o) => o.value);

                  await guardarPunto({
                    ...editando,
                    titulo: formData.get("titulo") as string,
                    descripcion: formData.get("descripcion") as string,
                    categoria: formData.get("categoria") as string,
                    plantas,
                    responsable:
                      (formData.get("responsable") as string) || "A definir",
                    prioridad:
                      (formData.get("prioridad") as PuntoSGC["prioridad"]) ||
                      "media",
                    estado:
                      (formData.get("estado") as PuntoSGC["estado"]) ||
                      "Pendiente",
                    fechaCompromiso:
                      (formData.get("fechaCompromiso") as string) || "",
                    fechaActualizacion: new Date().toISOString(),
                    notas: (formData.get("notas") as string) || "",
                  });
                }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Título
                  </label>
                  <input
                    name="titulo"
                    defaultValue={editando.titulo}
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    rows={2}
                    defaultValue={editando.descripcion}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Categoría
                  </label>
                  <select
                    name="categoria"
                    defaultValue={editando.categoria}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Plantas
                  </label>
                  <select
                    name="plantas"
                    multiple
                    defaultValue={editando.plantas}
                    className="h-[42px] w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="Campana">Campana</option>
                    <option value="Luján">Luján</option>
                    <option value="General">General</option>
                  </select>
                  <p className="mt-1 text-[10px] text-[#64748b]">
                    Ctrl/Cmd para seleccionar varias.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Responsable
                  </label>
                  <select
                    name="responsable"
                    defaultValue={editando.responsable}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="A definir">A definir</option>
                    <option value="Juan Pérez">Juan Pérez</option>
                    <option value="María García">María García</option>
                    <option value="Carlos López">Carlos López</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Prioridad
                  </label>
                  <select
                    name="prioridad"
                    defaultValue={editando.prioridad}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Estado
                  </label>
                  <select
                    name="estado"
                    defaultValue={editando.estado}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Fecha compromiso
                  </label>
                  <input
                    type="date"
                    name="fechaCompromiso"
                    defaultValue={editando.fechaCompromiso?.slice(0, 10) ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
                    Notas
                  </label>
                  <textarea
                    name="notas"
                    rows={3}
                    defaultValue={editando.notas}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                {/* Documentos anexados con subida directa e interactiva */}
                <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0f172a]/80 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-paperclip text-gold" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-white">
                        Documentos adjuntos a este tema (
                        {documentos.documentos.filter((d) => d.puntoId === editando.id).length}
                        )
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTemaParaSubir(editando.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold/25"
                    >
                      <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                      + Subir documento a este tema
                    </button>
                  </div>

                  {documentos.documentos.filter((d) => d.puntoId === editando.id)
                    .length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                      <i className="fa-solid fa-folder-open text-2xl text-gold/40 mb-2" />
                      <p className="text-xs text-[#94a3b8]">
                        Este tema todavía no tiene documentos anexados.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTemaParaSubir(editando.id)}
                        className="mt-2 text-xs font-semibold text-gold underline underline-offset-2 hover:text-amber-200"
                      >
                        Hacé clic acá para adjuntar el primer documento
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {documentos.documentos
                        .filter((d) => d.puntoId === editando.id)
                        .map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.06]"
                          >
                            <button
                              type="button"
                              onClick={() => setModalDoc(d)}
                              className="flex min-w-0 items-center gap-2.5 text-left"
                              title="Ver vista previa del documento"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                                <i className="fa-solid fa-file text-xs" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-white">
                                  {d.nombre}
                                </span>
                                <span className="block text-[10px] text-[#64748b]">
                                  {d.categoria} · v{d.version} · {d.fecha}
                                </span>
                              </span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setModalDoc(d)}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-400/20"
                                title="Ver documento al instante"
                              >
                                <i className="fa-solid fa-eye text-[10px]" />
                                Ver
                              </button>
                              <a
                                href={`/api/files?id=${encodeURIComponent(d.id)}&download=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-white/10 bg-white/5 p-1 text-xs text-[#94a3b8] hover:text-white"
                                title="Descargar archivo"
                              >
                                <i className="fa-solid fa-download text-[10px]" />
                              </a>
                              <button
                                type="button"
                                onClick={() => desvincularDocDeTema(d.id)}
                                className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-400/20"
                                title="Desvincular del tema sin borrar el documento"
                              >
                                Desvincular
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2 md:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-bold text-[#0f172a] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                    Guardar cambios del tema
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#c7d2e3] transition-colors hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            </div>

            <div className="glass mt-5 rounded-2xl p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">
                Historial de cambios
              </h3>
              {editando.historial?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Fecha", "Usuario", "Campo", "Anterior", "Nuevo"].map(
                          (label) => (
                            <th
                              key={label}
                              className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]"
                            >
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {editando.historial.map(
                        (h: HistorialCambio, i: number) => (
                          <tr key={i} className="border-b border-white/[0.06]">
                            <td className="px-3 py-2 text-xs text-[#94a3b8]">
                              {new Date(h.fecha).toLocaleDateString("es-AR")}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#94a3b8]">
                              {h.usuario}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#94a3b8]">
                              {h.campo}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#64748b]">
                              {h.valorAnterior || "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#c7d2e3]">
                              {h.valorNuevo}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-[#64748b]">
                  Sin historial de cambios aún.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Gestor General de Documentos */}
        <DocumentoManager
          documentos={documentos.documentos}
          categorias={categorias}
          puntos={puntos}
          temaPreseleccionadoId={temaParaSubir}
          onClearTemaPreseleccionado={() => setTemaParaSubir(null)}
          onChanged={cargarDatos}
        />
      </div>

      {/* Visor Modal de Documento */}
      {modalDoc && (
        <DocumentoModal documento={modalDoc} onClose={() => setModalDoc(null)} />
      )}
    </main>
  );
}
