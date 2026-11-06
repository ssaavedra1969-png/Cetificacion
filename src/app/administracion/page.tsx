"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Documento, HistorialCambio, PuntoSGC } from "@/types/models";

interface AgendaData {
  puntos: PuntoSGC[];
  metadata: Record<string, unknown>;
}

interface DocumentosData {
  documentos: Documento[];
  categorias: string[];
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

const emptyDocumento = {
  nombre: "",
  categoria: "",
  puntoId: "",
  planta: "Campana",
  version: "1.0",
  responsable: "",
  descripcion: "",
  archivo: null as File | null,
};

export default function Administracion() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [documentos, setDocumentos] = useState<DocumentosData>({
    documentos: [],
    categorias: [],
  });

  const [password, setPassword] = useState("");
  const [editando, setEditando] = useState<PuntoSGC | null>(null);
  const [nuevoDocumento, setNuevoDocumento] = useState(emptyDocumento);
  const [mensaje, setMensaje] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
  const [nombreAdjunto, setNombreAdjunto] = useState("");
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

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

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          await cargarDatos();
        }
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [cargarDatos]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setPassword("");
        await cargarDatos();
      } else {
        setMensaje({
          type: "error",
          text: data.error || "Contraseña incorrecta",
        });
      }
    } catch {
      setMensaje({ type: "error", text: "Error de conexión" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/session", { method: "POST" });
    setAuthenticated(false);
    setAgenda(null);
    setEditando(null);
    setMensaje(null);
  };

  const guardarPunto = useCallback(
    async (puntoData: PuntoSGC, cerrar: boolean = true) => {
      if (!agenda) return;
      const existe = agenda.puntos.some((p) => p.id === puntoData.id);
      const nuevosPuntos = existe
        ? agenda.puntos.map((p) => (p.id === puntoData.id ? puntoData : p))
        : [...agenda.puntos, puntoData];

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
        else setEditando(puntoData);
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
    [agenda],
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setNuevoDocumento((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevoDocumento((prev) => ({ ...prev, archivo: file }));
      setMensaje(null);
    }
  };

  const subirPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDocumento.archivo) {
      setMensaje({ type: "error", text: "Seleccioná un archivo PDF" });
      return;
    }
    if (!nuevoDocumento.nombre.trim()) {
      setMensaje({
        type: "error",
        text: "Ingresá un nombre para el documento",
      });
      return;
    }

    setMensaje({ type: "info", text: "Subiendo PDF..." });

    const formData = new FormData();
    formData.append("file", nuevoDocumento.archivo);
    formData.append("puntoId", nuevoDocumento.puntoId);
    formData.append("categoria", nuevoDocumento.categoria);
    formData.append("planta", nuevoDocumento.planta);
    formData.append("version", nuevoDocumento.version);
    formData.append("responsable", nuevoDocumento.responsable);
    formData.append("descripcion", nuevoDocumento.descripcion);
    formData.append("nombre", nuevoDocumento.nombre);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setMensaje({
          type: "success",
          text: "PDF subido y guardado correctamente",
        });
        setNuevoDocumento(emptyDocumento);
        await cargarDatos();
      } else {
        setMensaje({
          type: "error",
          text: result.error || "Error al subir PDF",
        });
      }
    } catch {
      setMensaje({ type: "error", text: "Error de conexión al subir PDF" });
    }
  };

  const subirYAdjuntar = async () => {
    if (!editando || !archivoAdjunto) {
      setMensaje({
        type: "error",
        text: "Seleccioná un archivo PDF para adjuntar",
      });
      return;
    }

    setSubiendoAdjunto(true);
    setMensaje({ type: "info", text: "Subiendo y adjuntando PDF..." });

    const formData = new FormData();
    formData.append("file", archivoAdjunto);
    formData.append("puntoId", editando.id);
    formData.append("categoria", editando.categoria || "Administración");
    formData.append("planta", editando.plantas[0] || "General");
    formData.append("version", "1.0");
    formData.append("responsable", editando.responsable);
    formData.append("descripcion", editando.titulo);
    formData.append("nombre", nombreAdjunto.trim() || editando.titulo);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (res.ok && result.success) {
        const docId = result.documento?.id;
        const nuevosIds = docId
          ? [...(editando.documentosIds || []), docId]
          : editando.documentosIds || [];
        const puntoActualizado: PuntoSGC = {
          ...editando,
          documentosIds: nuevosIds,
          fechaActualizacion: new Date().toISOString(),
        };
        await guardarPunto(puntoActualizado, false);
        setArchivoAdjunto(null);
        setNombreAdjunto("");
        await cargarDatos();
        setMensaje({
          type: "success",
          text: "PDF adjuntado al punto correctamente",
        });
      } else {
        setMensaje({
          type: "error",
          text: result.error || "Error al subir PDF",
        });
      }
    } catch {
      setMensaje({ type: "error", text: "Error de conexión al subir PDF" });
    } finally {
      setSubiendoAdjunto(false);
    }
  };

  const categorias = documentos.categorias.length
    ? documentos.categorias
    : CATEGORIAS_DEFAULT;
  const puntos = agenda?.puntos ?? [];

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-[#9fb0c9]">
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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-blue-600/10 blur-2xl"
        />
        <div className="relative w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:text-white"
          >
            <i
              className="fa-solid fa-arrow-left text-gold"
              aria-hidden="true"
            />
            Volver al portal
          </Link>
          <div className="glass rounded-2xl p-7">
            <h1 className="font-display text-2xl font-bold text-white">
              Acceso administrativo
            </h1>
            <p className="mt-2 text-sm text-[#9fb0c9]">
              Ingresá la contraseña para administrar el sistema.
            </p>

            {mensaje && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                <i
                  className="fa-solid fa-triangle-exclamation"
                  aria-hidden="true"
                />
                {mensaje.text}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div className="relative">
                <i
                  className="fa-solid fa-lock pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6f7f99]"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#0a0e17] py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <i
                  className="fa-solid fa-arrow-right-to-bracket"
                  aria-hidden="true"
                />
                Ingresar
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#02040a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:text-white"
          >
            <i
              className="fa-solid fa-arrow-left text-gold"
              aria-hidden="true"
            />
            Volver al portal
          </Link>
          <div className="flex items-center gap-2">
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
              <i
                className="fa-solid fa-right-from-bracket"
                aria-hidden="true"
              />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {mensaje && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
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

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <i className="fa-solid fa-lock" aria-hidden="true" />
              Administración
            </span>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white">
              Panel de administración
            </h1>
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
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Nuevo tema
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {puntos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setEditando(p)}
              className="glass glass-hover rounded-xl p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                    {p.id}
                  </p>
                  <h2 className="mt-1 truncate text-sm font-semibold text-white">
                    {p.titulo}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-[#9fb0c9]">
                    {p.descripcion}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${estadoClasses[p.estado]}`}
                >
                  {p.estado}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#9fb0c9]">
                <span className="inline-flex items-center gap-1">
                  <i className="fa-solid fa-user" aria-hidden="true" />
                  {p.responsable}
                </span>
                <span className="inline-flex items-center gap-1">
                  <i className="fa-solid fa-industry" aria-hidden="true" />
                  {p.plantas.length ? p.plantas.join(" · ") : "General"}
                </span>
                {(p.documentosIds?.length ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-gold">
                    <i className="fa-solid fa-paperclip" aria-hidden="true" />
                    {p.documentosIds?.length} docs
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {editando && (
          <section className="mt-8">
            <div className="glass rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-white">
                  {puntos.some((p) => p.id === editando.id)
                    ? `Editar: ${editando.titulo}`
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
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Título
                  </label>
                  <input
                    name="titulo"
                    defaultValue={editando.titulo}
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    rows={2}
                    defaultValue={editando.descripcion}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Categoría
                  </label>
                  <select
                    name="categoria"
                    defaultValue={editando.categoria}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Plantas
                  </label>
                  <select
                    name="plantas"
                    multiple
                    defaultValue={editando.plantas}
                    className="h-[42px] w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="Campana">Campana</option>
                    <option value="Luján">Luján</option>
                    <option value="General">General</option>
                  </select>
                  <p className="mt-1 text-[10px] text-[#6f7f99]">
                    Ctrl/Cmd para seleccionar varias.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Responsable
                  </label>
                  <select
                    name="responsable"
                    defaultValue={editando.responsable}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="A definir">A definir</option>
                    <option value="Juan Pérez">Juan Pérez</option>
                    <option value="María García">María García</option>
                    <option value="Carlos López">Carlos López</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Prioridad
                  </label>
                  <select
                    name="prioridad"
                    defaultValue={editando.prioridad}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Estado
                  </label>
                  <select
                    name="estado"
                    defaultValue={editando.estado}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Fecha compromiso
                  </label>
                  <input
                    type="date"
                    name="fechaCompromiso"
                    defaultValue={editando.fechaCompromiso?.slice(0, 10) ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Notas
                  </label>
                  <textarea
                    name="notas"
                    rows={3}
                    defaultValue={editando.notas}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0a0e17]/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    Documentos adjuntos a este punto
                  </h3>

                  {documentos.documentos.filter(
                    (d) => d.puntoId === editando.id,
                  ).length === 0 ? (
                    <p className="mb-3 text-xs text-[#6f7f99]">
                      Sin documentos adjuntos aún.
                    </p>
                  ) : (
                    <ul className="mb-3 space-y-1.5">
                      {documentos.documentos
                        .filter((d) => d.puntoId === editando.id)
                        .map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                          >
                            <a
                              href={d.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-gold hover:text-amber-200"
                            >
                              {d.nombre}
                            </a>
                            <span className="shrink-0 text-[#6f7f99]">
                              v{d.version}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Nombre del documento"
                      value={nombreAdjunto}
                      onChange={(e) => setNombreAdjunto(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20 md:col-span-1"
                    />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setArchivoAdjunto(e.target.files?.[0] ?? null)
                      }
                      className="rounded-lg border border-dashed border-white/15 bg-[#0a0e17] px-3 py-2 text-xs text-[#9fb0c9] file:mr-2 file:rounded-md file:border-0 file:bg-gold/15 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-gold"
                    />
                    <button
                      type="button"
                      onClick={subirYAdjuntar}
                      disabled={subiendoAdjunto || !archivoAdjunto}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-3 py-2 text-xs font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <i
                        className={`fa-solid ${
                          subiendoAdjunto ? "fa-spinner fa-spin" : "fa-paperclip"
                        }`}
                        aria-hidden="true"
                      />
                      {subiendoAdjunto ? "Subiendo..." : "Adjuntar PDF"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#c7d2e3] transition-colors hover:bg-white/10"
                  >
                    Cancelar
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
                              className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]"
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
                            <td className="px-3 py-2 text-xs text-[#9fb0c9]">
                              {new Date(h.fecha).toLocaleDateString("es-AR")}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#9fb0c9]">
                              {h.usuario}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#9fb0c9]">
                              {h.campo}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#6f7f99]">
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
                <p className="py-4 text-center text-sm text-[#6f7f99]">
                  Sin historial de cambios aún.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-white">
            Subir PDF / Documento (general)
          </h2>
          <p className="mb-4 mt-1 text-sm text-[#9fb0c9]">
            El archivo se sube a GitHub y queda disponible en la documentoteca.
          </p>

          <form
            onSubmit={subirPDF}
            className="glass grid grid-cols-1 gap-4 rounded-2xl p-6 md:grid-cols-2"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Nombre del documento
              </label>
              <input
                type="text"
                name="nombre"
                value={nuevoDocumento.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Certificado balanza 01/2026"
                required
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Tema asociado
              </label>
              <select
                name="puntoId"
                value={nuevoDocumento.puntoId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Sin asociar</option>
                {puntos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Categoría
              </label>
              <select
                name="categoria"
                value={nuevoDocumento.categoria}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Planta
              </label>
              <select
                name="planta"
                value={nuevoDocumento.planta}
                onChange={handleInputChange}
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
                name="version"
                value={nuevoDocumento.version}
                onChange={handleInputChange}
                placeholder="1.0"
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Responsable
              </label>
              <input
                type="text"
                name="responsable"
                value={nuevoDocumento.responsable}
                onChange={handleInputChange}
                placeholder="Ej: Laboratorio Luján"
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Descripción
              </label>
              <textarea
                name="descripcion"
                rows={2}
                value={nuevoDocumento.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción del documento..."
                className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Archivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full cursor-pointer rounded-lg border border-dashed border-white/15 bg-[#0a0e17] px-3 py-3 text-sm text-[#9fb0c9] outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gold hover:border-gold/40"
              />
              {nuevoDocumento.archivo && (
                <p className="mt-1 text-xs text-[#6f7f99]">
                  Archivo seleccionado: {nuevoDocumento.archivo.name}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                Subir PDF
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
