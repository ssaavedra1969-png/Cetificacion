"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Documento, PuntoSGC } from "@/types/models";
import {
  MAX_UPLOAD_BYTES,
  extFromName,
  formatBytes,
  isAllowedExt,
  isOfficeTipo,
} from "@/lib/files";

interface Props {
  documentos: Documento[];
  categorias: string[];
  puntos: PuntoSGC[];
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

function iconFor(doc: Documento): string {
  if (doc.tipo === "pdf") return "fa-file-pdf";
  if (doc.tipo === "imagen") return "fa-file-image";
  if (doc.tipo === "word") return "fa-file-word";
  if (doc.tipo === "excel") return "fa-file-excel";
  return "fa-file";
}

export default function DocumentoManager({
  documentos,
  categorias,
  puntos,
  onChanged,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [abierto, setAbierto] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const editando = Boolean(form.id);

  const puntoTitulo = useMemo(() => {
    const map = new Map(puntos.map((p) => [p.id, p.titulo]));
    return (id: string) => (id ? map.get(id) ?? id : "Sin asociar");
  }, [puntos]);

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarArchivo = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const abrirNuevo = () => {
    setForm(emptyForm());
    limpiarArchivo();
    setMensaje(null);
    setAbierto(true);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
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
    setAbierto(true);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const cerrarForm = () => {
    setForm(emptyForm());
    limpiarArchivo();
    setAbierto(false);
    setMensaje(null);
  };

  const validarArchivo = (archivo: File): string | null => {
    if (!isAllowedExt(extFromName(archivo.name))) {
      return "Tipo no permitido. Usá PDF, Word, Excel o imagen.";
    }
    if (archivo.size > MAX_UPLOAD_BYTES) {
      return `El archivo supera el máximo de ${formatBytes(
        MAX_UPLOAD_BYTES,
      )}.`;
    }
    return null;
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensaje(null);

    if (!form.nombre.trim()) {
      setMensaje({ type: "error", text: "Ingresá un nombre para el documento" });
      return;
    }

    if (!editando && !file) {
      setMensaje({ type: "error", text: "Seleccioná el archivo a subir" });
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
    data.append("nombre", form.nombre);
    data.append("categoria", form.categoria);
    data.append("puntoId", form.puntoId);
    data.append("planta", form.planta);
    data.append("version", form.version);
    data.append("responsable", form.responsable);
    data.append("descripcion", form.descripcion);
    data.append("fecha", form.fecha);
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
          : "Documento cargado correctamente",
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
        `¿Eliminar "${doc.nombre}"? Esta acción también borra el archivo.`,
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
      setMensaje({ type: "success", text: "Documento eliminado" });
      await onChanged();
    } catch {
      setMensaje({ type: "error", text: "Error de conexión al eliminar" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section id="documentos" className="mt-10 scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Documentos
          </h2>
          <p className="mt-1 text-sm text-[#9fb0c9]">
            Alta, edición, reemplazo y baja de archivos de la documentoteca.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Nuevo documento
        </button>
      </div>

      {mensaje && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            mensaje.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
              : mensaje.type === "info"
                ? "border-blue-400/25 bg-blue-400/10 text-blue-300"
                : "border-red-400/25 bg-red-400/10 text-red-300"
          }`}
        >
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
      )}

      {abierto && (
        <div
          ref={formRef}
          className="glass mb-5 scroll-mt-6 rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-white">
              {editando ? `Editar: ${form.nombre}` : "Nuevo documento"}
            </h3>
            <button
              type="button"
              onClick={cerrarForm}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#c7d2e3] transition-colors hover:bg-white/10"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
              Cerrar
            </button>
          </div>

          <form
            onSubmit={guardar}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Nombre del documento
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                required
                placeholder="Ej: Certificado balanza 01/2026"
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Categoría
              </label>
              <input
                type="text"
                value={form.categoria}
                onChange={(e) => setField("categoria", e.target.value)}
                list="documento-categorias"
                placeholder="General"
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
              <datalist id="documento-categorias">
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Tema asociado
              </label>
              <select
                value={form.puntoId}
                onChange={(e) => setField("puntoId", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Sin asociar</option>
                {puntos.map((punto) => (
                  <option key={punto.id} value={punto.id}>
                    {punto.id} · {punto.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Planta
              </label>
              <select
                value={form.planta}
                onChange={(e) => setField("planta", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              >
                <option value="Campana">Campana</option>
                <option value="Luján">Luján</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Versión
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setField("version", e.target.value)}
                placeholder="1.0"
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Fecha
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setField("fecha", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Responsable
              </label>
              <input
                type="text"
                value={form.responsable}
                onChange={(e) => setField("responsable", e.target.value)}
                placeholder="Ej: Laboratorio Luján"
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setField("descripcion", e.target.value)}
                rows={2}
                placeholder="Descripción del documento..."
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Archivo {editando ? "(opcional, reemplaza el actual)" : ""}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full cursor-pointer rounded-lg border border-dashed border-white/15 bg-[#0a0e17] px-3 py-3 text-sm text-[#9fb0c9] outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gold hover:border-gold/40"
              />
              <p className="mt-1 text-[11px] text-[#6f7f99]">
                PDF, Word, Excel o imagen. Máximo{" "}
                {formatBytes(MAX_UPLOAD_BYTES)} por archivo.
                {editando && " Si no elegís uno, se conserva el actual."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i
                  className={`fa-solid ${
                    saving ? "fa-spinner fa-spin" : "fa-floppy-disk"
                  }`}
                  aria-hidden="true"
                />
                {saving
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Cargar documento"}
              </button>
              <button
                type="button"
                onClick={cerrarForm}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#c7d2e3] transition-colors hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {documentos.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <i
            className="fa-solid fa-inbox mb-3 text-3xl text-gold/60"
            aria-hidden="true"
          />
          <p className="text-sm text-[#9fb0c9]">
            Todavía no hay documentos cargados.
          </p>
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  "Documento",
                  "Categoría",
                  "Tema",
                  "Planta",
                  "Versión",
                  "Acciones",
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
              {documentos.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <i
                          className={`fa-solid ${iconFor(doc)}`}
                          aria-hidden="true"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {doc.nombre}
                        </p>
                        <p className="text-[11px] text-[#6f7f99]">
                          {doc.fecha}
                          {isOfficeTipo(doc.tipo) ? " · Office" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#9fb0c9]">
                    {doc.categoria}
                  </td>
                  <td className="px-4 py-3 text-[#9fb0c9]">
                    {puntoTitulo(doc.puntoId)}
                  </td>
                  <td className="px-4 py-3 text-[#9fb0c9]">{doc.planta}</td>
                  <td className="px-4 py-3 text-[#9fb0c9]">
                    v{doc.version}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/documentos/${doc.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                      >
                        <i
                          className="fa-solid fa-up-right-from-square"
                          aria-hidden="true"
                        />
                        Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => editar(doc)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-amber-200"
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(doc)}
                        disabled={deletingId === doc.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-60"
                      >
                        <i
                          className={`fa-solid ${
                            deletingId === doc.id
                              ? "fa-spinner fa-spin"
                              : "fa-trash"
                          }`}
                          aria-hidden="true"
                        />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
