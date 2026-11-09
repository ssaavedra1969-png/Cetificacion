"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Documento, PuntoSGC } from "@/types/models";
import DocumentoModal from "@/components/DocumentoModal";
import {
  MAX_UPLOAD_BYTES,
  extFromName,
  formatBytes,
  isAllowedExt,
  isOfficeTipo,
  tipoFromExt,
} from "@/lib/files";
import { downloadUrl } from "@/lib/urls";

interface Props {
  documentos: Documento[];
  categorias: string[];
  puntos: PuntoSGC[];
  temaPreseleccionadoId?: string | null;
  onClearTemaPreseleccionado?: () => void;
  onChanged: () => Promise<void> | void;
}

interface FormState {
  id: string;
  nombre: string;
  categoria: string;
  puntoId: string;
  planta: string;
  version: string;
  responsable: string;
  descripcion: string;
  fecha: string;
}

interface Mensaje {
  type: "success" | "error" | "info";
  text: string;
}

const hoy = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): FormState => ({
  id: "",
  nombre: "",
  categoria: "",
  puntoId: "",
  planta: "General",
  version: "1.0",
  responsable: "",
  descripcion: "",
  fecha: hoy(),
});

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

function sugerirNombreDesdeArchivo(fileName: string): string {
  const sinExt = fileName.replace(/\.[^.]+$/, "");
  const limpio = sinExt
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return "";
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export default function DocumentoManager({
  documentos,
  categorias,
  puntos,
  temaPreseleccionadoId,
  onClearTemaPreseleccionado,
  onChanged,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [abierto, setAbierto] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [docModal, setDocModal] = useState<Documento | null>(null);

  // Filtros de tabla
  const [busqueda, setBusqueda] = useState("");
  const [filtroPlanta, setFiltroPlanta] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const limpiarArchivo = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const editando = Boolean(form.id);
  const docEditando = useMemo(
    () => (editando ? documentos.find((d) => d.id === form.id) : null),
    [documentos, editando, form.id],
  );

  const puntoTitulo = useMemo(() => {
    const map = new Map(puntos.map((p) => [p.id, p.titulo]));
    return (id: string) => (id ? map.get(id) ?? id : "Sin asociar");
  }, [puntos]);

  // Si llega un tema preseleccionado desde arriba (ej. desde una tarjeta o modal de tema)
  useEffect(() => {
    if (temaPreseleccionadoId) {
      const p = puntos.find((item) => item.id === temaPreseleccionadoId);
      /* eslint-disable react-hooks/set-state-in-effect */
      setForm({
        ...emptyForm(),
        puntoId: temaPreseleccionadoId,
        planta: p?.plantas?.[0] || "General",
        categoria: p?.categoria || "General",
      });
      limpiarArchivo();
      setMensaje(null);
      setMostrarDetalles(false);
      setAbierto(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      onClearTemaPreseleccionado?.();
    }
  }, [temaPreseleccionadoId, puntos, onClearTemaPreseleccionado]);

  // Documentos filtrados
  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      if (filtroPlanta !== "Todas" && doc.planta !== filtroPlanta) return false;
      if (filtroTipo !== "Todos") {
        if (filtroTipo === "office" && !isOfficeTipo(doc.tipo)) return false;
        if (filtroTipo !== "office" && doc.tipo !== filtroTipo) return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const textoDoc = [
          doc.nombre,
          doc.categoria,
          doc.planta,
          doc.responsable,
          doc.descripcion,
          puntoTitulo(doc.puntoId),
          doc.fecha,
        ]
          .join(" ")
          .toLowerCase();
        if (!textoDoc.includes(q)) return false;
      }
      return true;
    });
  }, [documentos, filtroPlanta, filtroTipo, busqueda, puntoTitulo]);

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const seleccionarPunto = (puntoId: string) => {
    const punto = puntos.find((p) => p.id === puntoId);
    if (punto) {
      setForm((prev) => ({
        ...prev,
        puntoId,
        planta: punto.plantas?.[0] || prev.planta || "General",
        categoria: punto.categoria || prev.categoria || "General",
      }));
    } else {
      setForm((prev) => ({ ...prev, puntoId }));
    }
  };

  const procesarArchivoSeleccionado = (nuevoArchivo: File) => {
    const error = validarArchivo(nuevoArchivo);
    if (error) {
      setMensaje({ type: "error", text: error });
      return;
    }
    setFile(nuevoArchivo);
    setMensaje(null);
    // Si el nombre está vacío, sugerir automáticamente uno legible
    if (!form.nombre.trim()) {
      setField("nombre", sugerirNombreDesdeArchivo(nuevoArchivo.name));
    }
  };

  const abrirNuevo = () => {
    setForm(emptyForm());
    limpiarArchivo();
    setMensaje(null);
    setMostrarDetalles(false);
    setAbierto(true);
  };

  const editar = (doc: Documento) => {
    setForm({
      id: doc.id,
      nombre: doc.nombre,
      categoria: doc.categoria,
      puntoId: doc.puntoId ?? "",
      planta: doc.planta || "General",
      version: doc.version || "1.0",
      responsable: doc.responsable || "",
      descripcion: doc.descripcion || "",
      fecha: doc.fecha || hoy(),
    });
    limpiarArchivo();
    setMensaje(null);
    setMostrarDetalles(true);
    setAbierto(true);
  };

  const cerrarForm = () => {
    setForm(emptyForm());
    limpiarArchivo();
    setAbierto(false);
    setMensaje(null);
    setMostrarDetalles(false);
  };

  // Bloquear scroll del fondo y cerrar con Escape mientras el modal está abierto
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarForm();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const validarArchivo = (archivo: File): string | null => {
    const ext = extFromName(archivo.name);
    if (!isAllowedExt(ext)) {
      return "Formato no permitido. Podés subir PDF, Word, Excel o imágenes.";
    }
    if (archivo.size > MAX_UPLOAD_BYTES) {
      return `El archivo supera el máximo permitido de ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    }
    return null;
  };

  const previsualizarArchivoLocal = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensaje(null);

    if (!form.nombre.trim()) {
      setMensaje({ type: "error", text: "Ingresá un nombre para el documento" });
      return;
    }

    if (!editando && !file) {
      setMensaje({
        type: "error",
        text: "Seleccioná o arrastrá el archivo que querés subir (Paso 1).",
      });
      return;
    }

    if (file) {
      const error = validarArchivo(file);
      if (error) {
        setMensaje({ type: "error", text: error });
        return;
      }
    }

    setSaving(true);
    setMensaje({ type: "info", text: "Guardando documento..." });

    const data = new FormData();
    if (editando) data.append("id", form.id);
    data.append("nombre", form.nombre.trim());
    data.append("categoria", form.categoria.trim() || "General");
    data.append("puntoId", form.puntoId);
    data.append("planta", form.planta);
    data.append("version", form.version.trim() || "1.0");
    data.append("responsable", form.responsable.trim());
    data.append("descripcion", form.descripcion.trim());
    data.append("fecha", form.fecha || hoy());
    if (file) data.append("file", file);

    try {
      const res = await fetch("/api/documentos", {
        method: editando ? "PATCH" : "POST",
        body: data,
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMensaje({
          type: "error",
          text:
            res.status === 401
              ? "La sesión expiró. Volvé a ingresar."
              : result.error || "No se pudo guardar el documento",
        });
        return;
      }

      setForm(emptyForm());
      limpiarArchivo();
      setAbierto(false);
      setMensaje({
        type: "success",
        text: editando
          ? "Documento actualizado correctamente"
          : "Documento subido y registrado con éxito",
      });
      await onChanged();
    } catch {
      setMensaje({ type: "error", text: "Error de conexión al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (doc: Documento) => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${doc.nombre}"? Esta acción borrará el registro y su archivo.`,
      )
    ) {
      return;
    }

    setDeletingId(doc.id);
    setMensaje(null);
    try {
      const res = await fetch(
        `/api/documentos?id=${encodeURIComponent(doc.id)}`,
        { method: "DELETE" },
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMensaje({
          type: "error",
          text:
            res.status === 401
              ? "La sesión expiró. Volvé a ingresar."
              : result.error || "No se pudo eliminar el documento",
        });
        return;
      }
      if (form.id === doc.id) cerrarForm();
      setMensaje({ type: "success", text: "Documento eliminado correctamente" });
      await onChanged();
    } catch {
      setMensaje({ type: "error", text: "Error de conexión al eliminar" });
    } finally {
      setDeletingId(null);
    }
  };

  const archivoInfoVisual = useMemo(() => {
    if (file) {
      const ext = extFromName(file.name);
      const tipo = tipoFromExt(ext);
      const style = iconFor(tipo);
      return {
        nombre: file.name,
        tamano: formatBytes(file.size),
        tipo,
        style,
        esLocal: true,
      };
    }
    if (editando && docEditando) {
      const style = iconFor(docEditando.tipo);
      return {
        nombre: docEditando.nombre,
        tamano: "Archivo actual conservado",
        tipo: docEditando.tipo,
        style,
        esLocal: false,
      };
    }
    return null;
  }, [file, editando, docEditando]);

  return (
    <section id="documentos" className="mt-10 scroll-mt-20">
      {/* Encabezado y botón de acción */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <i className="fa-solid fa-folder-open text-sm" aria-hidden="true" />
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Carga de documentos
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Subí el archivo y completá solo lo necesario. El resto de los datos es opcional.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-[#0f172a] shadow-[0_10px_25px_-5px_rgba(212,175,55,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-5px_rgba(212,175,55,0.7)]"
        >
          <i className="fa-solid fa-cloud-arrow-up text-base" aria-hidden="true" />
          Subir documento
        </button>
      </div>

      {/* Mensajes globales de alerta */}
      {mensaje && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            mensaje.type === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : mensaje.type === "info"
                ? "border-blue-400/30 bg-blue-400/10 text-blue-200"
                : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <i
              className={`fa-solid ${
                mensaje.type === "success"
                  ? "fa-circle-check text-emerald-400 text-lg"
                  : mensaje.type === "info"
                    ? "fa-circle-info text-blue-400 text-lg"
                    : "fa-triangle-exclamation text-red-400 text-lg"
              }`}
              aria-hidden="true"
            />
            <span>{mensaje.text}</span>
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

      {/* Modal de carga / edición */}
      {abierto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-6"
            onClick={cerrarForm}
            role="dialog"
            aria-modal="true"
            aria-label={editando ? "Editar documento" : "Subir documento"}
          >
            <div
              ref={formRef}
              onClick={(e) => e.stopPropagation()}
              className="glass max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:p-6"
            >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold">
                <i
                  className={`fa-solid ${editando ? "fa-pen-to-square" : "fa-file-circle-plus"}`}
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  {editando
                    ? `Editar: ${form.nombre}`
                    : form.puntoId
                      ? `${form.puntoId} - ${puntoTitulo(form.puntoId)}`
                      : "Subir nuevo documento"}
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  {editando
                    ? "Modificá los campos o reemplazá el archivo si es necesario."
                    : "Elegí el archivo y, si querés, completá los datos opcionales."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cerrarForm}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7d2e3] transition-colors hover:bg-white/10 hover:text-white"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
              Cancelar
            </button>
          </div>

          <form onSubmit={guardar} className="space-y-4">
            {/* Archivo */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                Archivo <span className="text-red-400">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                  if (e.dataTransfer?.files?.length) {
                    procesarArchivoSeleccionado(e.dataTransfer.files[0]);
                  }
                }}
                data-drag={arrastrando}
                className="omx-dropzone flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      procesarArchivoSeleccionado(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-inner">
                  <i className="fa-solid fa-cloud-arrow-up text-xl" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Arrastrá y soltá el archivo acá, o{" "}
                    <span className="text-gold underline underline-offset-2">explorá en tu equipo</span>
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    PDF, Word (.doc, .docx), Excel (.xls, .xlsx, .csv) o imágenes (.jpg, .png, .webp) · Máx. 10 MB
                  </p>
                </div>
              </div>

              {/* Chip / Card del archivo seleccionado */}
              {archivoInfoVisual && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f172a] p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${archivoInfoVisual.style.bg} ${archivoInfoVisual.style.color}`}
                    >
                      <i
                        className={`fa-solid ${archivoInfoVisual.style.icon} text-lg`}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {archivoInfoVisual.nombre}
                      </p>
                      <p className="text-[11px] font-mono text-[#64748b]">
                        {archivoInfoVisual.tamano}
                        {archivoInfoVisual.esLocal ? " · Listo para subir" : " · En repositorio"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {archivoInfoVisual.esLocal ? (
                      <button
                        type="button"
                        onClick={previsualizarArchivoLocal}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
                        title="Ver el archivo seleccionado en una pestaña nueva"
                      >
                        <i className="fa-solid fa-eye" aria-hidden="true" />
                        Previsualizar
                      </button>
                    ) : (
                      docEditando && (
                        <button
                          type="button"
                          onClick={() => setDocModal(docEditando)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
                        >
                          <i className="fa-solid fa-eye" aria-hidden="true" />
                          Ver actual
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={limpiarArchivo}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[#94a3b8] hover:bg-red-400/10 hover:text-red-300"
                      title="Cambiar archivo"
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                      {editando ? "Cambiar" : "Quitar"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nombre (visible) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                Nombre del documento <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                required
                placeholder="Ej: Certificado balanza de camiones Campana 2026"
                className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {form.puntoId && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-300">
                <i className="fa-solid fa-link" aria-hidden="true" />
                <span>
                  Se vinculará al tema{" "}
                  <strong className="text-white">{form.puntoId}</strong>:{" "}
                  {puntoTitulo(form.puntoId)}
                </span>
              </div>
            )}

            {/* Más datos en desplegable */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setMostrarDetalles((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-[#c7d2e3]">
                  <i className="fa-solid fa-sliders text-gold" aria-hidden="true" />
                  Más datos (opcional)
                  <span className="hidden text-[11px] font-normal text-[#64748b] sm:inline">
                    categoría, planta, tema, versión, responsable, fecha y descripción
                  </span>
                </span>
                <i
                  className={`fa-solid ${mostrarDetalles ? "fa-chevron-up" : "fa-chevron-down"} text-[11px] text-[#64748b]`}
                  aria-hidden="true"
                />
              </button>

              {mostrarDetalles && (
                <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={form.categoria}
                      onChange={(e) => setField("categoria", e.target.value)}
                      list="categorias-disponibles"
                      placeholder="Ej: Certificados de calibración"
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                    />
                    <datalist id="categorias-disponibles">
                      {categorias.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>

                    {/* Sugerencias rápidas de categorías */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] text-[#64748b] self-center mr-1">Rápidas:</span>
                      {categorias.slice(0, 5).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setField("categoria", cat)}
                          className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                            form.categoria === cat
                              ? "border-gold/40 bg-gold/15 text-gold font-semibold"
                              : "border-white/10 bg-white/5 text-[#94a3b8] hover:bg-white/10"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#c7d2e3]">
                      Planta de aplicación
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/10 bg-[#0f172a] p-1">
                      {(["General", "Campana", "Luján"] as const).map((planta) => {
                        const seleccionada = form.planta === planta;
                        return (
                          <button
                            key={planta}
                            type="button"
                            onClick={() => setField("planta", planta)}
                            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                              seleccionada
                                ? "bg-gradient-to-r from-gold to-gold-dark text-[#0f172a] shadow"
                                : "text-[#94a3b8] hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {planta}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                      Tema asociado de la Agenda SGC
                    </label>
                    <select
                      value={form.puntoId}
                      onChange={(e) => seleccionarPunto(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                    >
                      <option value="">Sin asociar (documento general / independiente)</option>
                      {puntos.map((punto) => (
                        <option key={punto.id} value={punto.id}>
                          [{punto.id}] {punto.titulo} ({punto.plantas?.length ? punto.plantas.join(", ") : "General"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                      Fecha del documento
                    </label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setField("fecha", e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                      Versión
                    </label>
                    <input
                      type="text"
                      value={form.version}
                      onChange={(e) => setField("version", e.target.value)}
                      placeholder="1.0"
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                      Responsable
                    </label>
                    <input
                      type="text"
                      value={form.responsable}
                      onChange={(e) => setField("responsable", e.target.value)}
                      placeholder="Ej: Laboratorio Luján"
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#c7d2e3]">
                      Descripción / Observaciones
                    </label>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => setField("descripcion", e.target.value)}
                      rows={2}
                      placeholder="Resumen del documento, alcance del certificado o notas de calidad..."
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Confirmación y Guardado */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="text-xs text-[#94a3b8]">
                {file ? (
                  <span className="text-emerald-400 font-medium">
                    <i className="fa-solid fa-check-circle mr-1" aria-hidden="true" />
                    Archivo listo para guardar: {file.name} ({formatBytes(file.size)})
                  </span>
                ) : editando ? (
                  <span>Se conservará el archivo existente.</span>
                ) : (
                  <span className="text-amber-400 font-medium">
                    <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true" />
                    Falta seleccionar el archivo.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={cerrarForm}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#c7d2e3] transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || (!editando && !file)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-5 py-2 text-xs font-bold text-[#0f172a] shadow-[0_10px_25px_-5px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i
                    className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
                    aria-hidden="true"
                  />
                  {saving
                    ? "Guardando..."
                    : editando
                      ? "Guardar cambios"
                      : "Confirmar y subir documento"}
                </button>
              </div>
            </div>
          </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Listado plegable: la sección queda enfocada en la carga */}
      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-gold/30 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-folder-tree text-gold" aria-hidden="true" />
            Documentos cargados
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#94a3b8]">
              {documentos.length}
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-normal text-[#64748b]">
            Ver, editar o eliminar
            <i
              className="fa-solid fa-chevron-down transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </span>
        </summary>

        <div className="mt-4">
      {/* Controles de Búsqueda y Filtros de la Documentoteca */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Input de Búsqueda */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <i
              className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, categoría, responsable o tema..."
              className="w-full rounded-lg border border-white/10 bg-[#0f172a] py-2 pl-9 pr-8 text-xs text-white placeholder-[#64748b] outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
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

          {/* Filtro Tipo de Archivo */}
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
          Mostrando <span className="font-mono text-white font-semibold">{documentosFiltrados.length}</span> de{" "}
          <span className="font-mono text-white">{documentos.length}</span> documentos
        </p>
      </div>

      {/* Tabla / Listado de Documentos con Visualización Rápida en Modal */}
      {documentosFiltrados.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <i className="fa-solid fa-inbox mb-3 text-3xl text-gold/60" aria-hidden="true" />
          <p className="text-sm text-[#94a3b8]">
            {busqueda || filtroPlanta !== "Todas" || filtroTipo !== "Todos"
              ? "No se encontraron documentos con los filtros seleccionados."
              : "Todavía no hay documentos cargados en el sistema."}
          </p>
          {(busqueda || filtroPlanta !== "Todas" || filtroTipo !== "Todos") && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFiltroPlanta("Todas");
                setFiltroTipo("Todos");
              }}
              className="mt-3 text-xs text-gold underline underline-offset-2 hover:text-amber-200"
            >
              Restablecer filtros
            </button>
          )}
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
                <th className="px-2 py-3 font-semibold">Versión</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {documentosFiltrados.map((doc) => {
                const style = iconFor(doc.tipo);
                return (
                  <tr
                    key={doc.id}
                    className="group transition-colors hover:bg-white/[0.04]"
                  >
                    {/* Documento y Tipo */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDocModal(doc)}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 ${style.bg} ${style.color}`}
                          title="Clic para previsualizar documento"
                        >
                          <i className={`fa-solid ${style.icon} text-sm`} aria-hidden="true" />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDocModal(doc)}
                            className="block truncate text-left text-xs font-semibold text-white transition-colors hover:text-gold"
                            title={doc.nombre}
                          >
                            {doc.nombre}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
                            <span>{doc.fecha}</span>
                            {doc.responsable && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[150px]">{doc.responsable}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-3 py-3 text-[#94a3b8]">
                      <span className="inline-block rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[11px]">
                        {doc.categoria}
                      </span>
                    </td>

                    {/* Tema SGC */}
                    <td className="px-3 py-3 text-[#94a3b8]">
                      {doc.puntoId ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-gold/90 font-mono"
                          title={puntoTitulo(doc.puntoId)}
                        >
                          <i className="fa-solid fa-link text-[9px]" aria-hidden="true" />
                          {doc.puntoId}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#64748b]">—</span>
                      )}
                    </td>

                    {/* Planta */}
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          doc.planta === "Campana"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : doc.planta === "Luján"
                              ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                              : "border-slate-400/30 bg-slate-400/10 text-slate-300"
                        }`}
                      >
                        {doc.planta}
                      </span>
                    </td>

                    {/* Versión */}
                    <td className="px-2 py-3 font-mono text-[#94a3b8]">
                      v{doc.version}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Ver rápido en Modal */}
                        <button
                          type="button"
                          onClick={() => setDocModal(doc)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20"
                          title="Visualizar documento al instante en visor integrado"
                        >
                          <i className="fa-solid fa-eye text-[11px]" aria-hidden="true" />
                          Ver
                        </button>

                        {/* Botón Descargar */}
                        <a
                          href={downloadUrl(doc.archivoUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 text-xs text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-white"
                          title="Descargar archivo directamente"
                        >
                          <i className="fa-solid fa-download text-[11px]" aria-hidden="true" />
                        </a>

                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={() => editar(doc)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
                          title="Editar metadatos o cambiar archivo"
                        >
                          <i className="fa-solid fa-pen text-[10px]" aria-hidden="true" />
                          Editar
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => eliminar(doc)}
                          disabled={deletingId === doc.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-400/25 bg-red-400/10 p-1 text-xs text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                          title="Eliminar documento y archivo"
                        >
                          <i
                            className={`fa-solid ${
                              deletingId === doc.id ? "fa-spinner fa-spin" : "fa-trash"
                            } text-[11px]`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

        </div>
      </details>

      {/* Visor Modal integrado para ver documentos al instante sin recargar la página */}
      {docModal && (
        <DocumentoModal documento={docModal} onClose={() => setDocModal(null)} />
      )}
    </section>
  );
}
