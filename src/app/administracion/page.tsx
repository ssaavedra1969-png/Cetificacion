"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Documento, HistorialCambio, PuntoSGC } from "@/types/models";
import DocumentoManager from "@/components/DocumentoManager";
import DocumentoModal from "@/components/DocumentoModal";
import CustomDropdown from "@/components/CustomDropdown";

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

const RESPONSABLES: string[] = [
  "A definir",
  "Juan Pérez",
  "María García",
  "Carlos López",
];

const PRIORIDADES: string[] = ["alta", "media", "baja"];

const PLANTAS_OPTIONS: string[] = ["Campana", "Luján", "Ambas"];

const estadoCardClasses: Record<PuntoSGC["estado"], string> = {
  Pendiente:
    "border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[inset_0_1px_10px_rgba(245,158,11,0.1)] before:bg-amber-400",
  "En curso":
    "border-blue-400/25 bg-blue-400/10 text-blue-300 shadow-[inset_0_1px_10px_rgba(96,165,250,0.1)] before:bg-blue-400",
  Bloqueado:
    "border-red-400/25 bg-red-400/10 text-red-300 shadow-[inset_0_1px_10px_rgba(248,113,113,0.1)] before:bg-red-400",
  Completado:
    "border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[inset_0_1px_10px_rgba(52,211,153,0.1)] before:bg-emerald-400",
};

const PREMIUM_INPUT =
  "w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30";

const PREMIUM_LABEL =
  "mb-1.5 block text-[10px] uppercase font-bold text-slate-500 tracking-wider";

export default function Administracion() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [redirigiendo, setRedirigiendo] = useState(false);
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

  const [categoriasOptions, setCategoriasOptions] = useState<string[]>(
    documentos.categorias,
  );
  const [responsableOptions, setResponsableOptions] =
    useState<string[]>(RESPONSABLES);
  const [plantasOptions, setPlantasOptions] =
    useState<string[]>(PLANTAS_OPTIONS);

  const plantasValue = useMemo(() => {
    const p = editando?.plantas ?? [];
    if (p.includes("Campana") && p.includes("Luján")) return "Ambas";
    return p.includes("Luján") ? "Luján" : "Campana";
  }, [editando?.plantas]);
  const [selectedPlantas, setSelectedPlantas] = useState<string>(plantasValue);

  // Estados para subida y vinculación directa a temas
  const [temaParaSubir, setTemaParaSubir] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<Documento | null>(null);

  const setEditField = useCallback(
    (key: string, value: string) =>
      setEditando((prev) =>
        prev ? ({ ...prev, [key]: value } as PuntoSGC) : null,
      ),
    [],
  );

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

  // Bloquear scroll y permitir cerrar la ficha con Escape
  useEffect(() => {
    if (!editando) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditando(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [editando]);

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
        if (data.authenticated && data.user?.rol !== "lector") {
          setAuthenticated(true);
          setUsuario(data.user ?? null);
          await cargarDatos();
        } else if (data.authenticated) {
          setRedirigiendo(true);
          router.replace("/");
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
            error instanceof Error ? error.message : "Error al guardar el tema",
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

  if (redirigiendo) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-[#94a3b8]">
          <i
            className="fa-solid fa-spinner fa-spin text-gold"
            aria-hidden="true"
          />
          Redirigiendo al portal...
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
                <i
                  className="fa-solid fa-circle-user text-gold"
                  aria-hidden="true"
                />
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
              Hacé clic en cualquier tema para editarlo o utilizá{" "}
              <strong>+ Adjuntar doc</strong> para subirle archivos
              directamente.
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
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                className="flex h-auto min-h-[180px] cursor-pointer flex-col justify-between rounded-xl border border-white/[0.06] bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.15)] focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="rounded-md border border-white/[0.05] bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-slate-300">
                      {p.id}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold before:mr-1.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${estadoCardClasses[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                  </div>
                  <h2 className="whitespace-normal break-words text-base font-semibold tracking-tight text-white drop-shadow-sm">
                    {p.titulo}
                  </h2>
                  <p className="mt-2 whitespace-normal break-words text-xs leading-relaxed text-slate-400">
                    {p.descripcion}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <i className="fa-solid fa-industry" aria-hidden="true" />
                      {p.plantas.length ? p.plantas.join(" - ") : "General"}
                    </span>
                    {numDocs > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-400">
                        <i
                          className="fa-solid fa-paperclip"
                          aria-hidden="true"
                        />
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
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-3 py-1.5 text-xs text-amber-400 transition-all duration-300 hover:border-amber-500/40 hover:text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    title={`Subir y vincular documento al tema ${p.id}`}
                  >
                    <i
                      className="fa-solid fa-cloud-arrow-up"
                      aria-hidden="true"
                    />
                    + Adjuntar doc
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de edición de tema */}
        {editando && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tema-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditando(null);
            }}
          >
            <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] sm:max-h-[calc(100vh-3rem)]">
              <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-5 py-4 sm:px-6">
                <span
                  className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-xs text-slate-300">
                      {puntos.some((p) => p.id === editando.id)
                        ? editando.id
                        : "Nuevo"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                        Tema SGC
                      </p>
                      <h2
                        id="tema-modal-title"
                        className="font-display mt-1 max-w-2xl text-lg font-bold leading-snug text-white sm:text-xl"
                      >
                        {editando.titulo || "Nuevo tema SGC"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {editando.categoria || "Sin categoría"} ·{" "}
                        {editando.plantas?.length
                          ? editando.plantas.join(" · ")
                          : "General"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold before:mr-1.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${estadoCardClasses[editando.estado]}`}
                    >
                      {editando.estado}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditando(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                      aria-label="Cerrar ficha del tema"
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  let plantas: string[] = [];
                  if (selectedPlantas === "Ambas") {
                    plantas = ["Campana", "Luján"];
                  } else if (selectedPlantas) {
                    plantas = [selectedPlantas];
                  }

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
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                  <section>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-400">
                        <i
                          className="fa-solid fa-circle-info"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Información general
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Datos principales y seguimiento del tema.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="mb-4">
                          <label className={PREMIUM_LABEL}>Título</label>
                          <input
                            name="titulo"
                            defaultValue={editando.titulo}
                            required
                            className={PREMIUM_INPUT}
                          />
                        </div>
                        <div className="mb-4">
                          <label className={PREMIUM_LABEL}>Descripción</label>
                          <textarea
                            name="descripcion"
                            rows={5}
                            defaultValue={editando.descripcion}
                            className={PREMIUM_INPUT}
                          />
                        </div>
                        <div className="mb-4">
                          <label className={PREMIUM_LABEL}>Notas</label>
                          <textarea
                            name="notas"
                            rows={4}
                            defaultValue={editando.notas}
                            className={PREMIUM_INPUT}
                          />
                        </div>
                      </div>

                      <div className="lg:col-span-1 space-y-6">
                        <div className="space-y-3">
                          <label className={PREMIUM_LABEL}>Clasificación</label>
                          <CustomDropdown
                            label="Categoría"
                            value={editando.categoria ?? ""}
                            options={categoriasOptions}
                            onChange={(v) => setEditField("categoria", v)}
                            addable
                            onAdd={(v) => {
                              setCategoriasOptions((prev) => [...prev, v]);
                              setDocumentos((prev) => ({
                                ...prev,
                                categorias: [...prev.categorias, v],
                              }));
                            }}
                          />
                          <CustomDropdown
                            label="Plantas"
                            value={selectedPlantas}
                            options={plantasOptions}
                            onChange={setSelectedPlantas}
                            addable
                            onAdd={(v) => {
                              setPlantasOptions((prev) => [...prev, v]);
                              setSelectedPlantas(v);
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className={PREMIUM_LABEL}>
                            Gestión operativa
                          </label>
                          <CustomDropdown
                            label="Responsable"
                            value={editando.responsable ?? ""}
                            options={responsableOptions}
                            onChange={(v) => setEditField("responsable", v)}
                            addable
                            onAdd={(v) => {
                              setResponsableOptions((prev) => [...prev, v]);
                              setEditField("responsable", v);
                            }}
                          />
                          <CustomDropdown
                            label="Prioridad"
                            value={editando.prioridad ?? "media"}
                            options={PRIORIDADES}
                            onChange={(v) => setEditField("prioridad", v)}
                          />
                          <CustomDropdown
                            label="Estado"
                            value={editando.estado ?? "Pendiente"}
                            options={ESTADOS as string[]}
                            onChange={(v) => setEditField("estado", v)}
                          />
                          <div className="mb-4">
                            <label className={PREMIUM_LABEL}>
                              Fecha compromiso
                            </label>
                            <input
                              type="date"
                              name="fechaCompromiso"
                              defaultValue={
                                editando.fechaCompromiso?.slice(0, 10) ?? ""
                              }
                              className={PREMIUM_INPUT}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Documentos adjuntos */}
                  <section>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-400">
                        <i
                          className="fa-solid fa-paperclip"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Documentos adjuntos
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Archivos vinculados a este tema.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/30 p-4 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-semibold text-[#94a3b8]">
                            {
                              documentos.documentos.filter(
                                (d) => d.puntoId === editando.id,
                              ).length
                            }{" "}
                            documento(s)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTemaParaSubir(editando.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold/25"
                        >
                          <i
                            className="fa-solid fa-cloud-arrow-up"
                            aria-hidden="true"
                          />
                          + Subir documento a este tema
                        </button>
                      </div>

                      {documentos.documentos.filter(
                        (d) => d.puntoId === editando.id,
                      ).length === 0 ? (
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
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
                              >
                                <button
                                  type="button"
                                  onClick={() => setModalDoc(d)}
                                  className="flex min-w-0 items-center gap-2.5 text-left"
                                  title="Ver vista previa del documento"
                                >
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                                    <i
                                      className="fa-solid fa-file text-xs"
                                      aria-hidden="true"
                                    />
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
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
                                    title="Ver documento al instante"
                                  >
                                    <i
                                      className="fa-solid fa-eye text-[10px]"
                                      aria-hidden="true"
                                    />
                                    Ver
                                  </button>
                                  <a
                                    href={`/api/files?id=${encodeURIComponent(d.id)}&download=1`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-md border border-slate-600/30 bg-slate-800/50 p-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                                    title="Descargar archivo"
                                  >
                                    <i
                                      className="fa-solid fa-download text-[10px]"
                                      aria-hidden="true"
                                    />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => void 0}
                                    className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                                    title="Editar documento"
                                  >
                                    <i
                                      className="fa-solid fa-pen-to-square text-[10px]"
                                      aria-hidden="true"
                                    />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => desvincularDocDeTema(d.id)}
                                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
                                    title="Eliminar documento del tema"
                                  >
                                    <i
                                      className="fa-solid fa-trash-can text-[10px]"
                                      aria-hidden="true"
                                    />
                                    Eliminar
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </section>

                  {/* Historial de cambios */}
                  <section>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-[11px] text-gold">
                        <i
                          className="fa-solid fa-clipboard-list"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Historial de cambios
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Registro de modificaciones del tema.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/20 p-4 sm:p-6">
                      {editando.historial?.length > 0 ? (
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800/40">
                              {[
                                "Fecha",
                                "Usuario",
                                "Campo",
                                "Anterior",
                                "Nuevo",
                              ].map((label) => (
                                <th
                                  key={label}
                                  className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]"
                                >
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {editando.historial.map(
                              (h: HistorialCambio, i: number) => (
                                <tr
                                  key={i}
                                  className="border-b border-slate-800/40"
                                >
                                  <td className="px-3 py-2 text-xs text-slate-500">
                                    {new Date(h.fecha).toLocaleDateString(
                                      "es-AR",
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-slate-500">
                                    {h.usuario}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-slate-500">
                                    {h.campo}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-slate-400">
                                    {h.valorAnterior || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-slate-300">
                                    {h.valorNuevo}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-500">
                          Sin historial de cambios aún.
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-slate-950/95 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-slate-950 px-6 py-2.5 shadow-lg shadow-amber-500/10 hover:brightness-110 transition-all"
                  >
                    <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                    Guardar cambios del tema
                  </button>
                </div>
              </form>
            </div>
          </div>
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
        <DocumentoModal
          documento={modalDoc}
          onClose={() => setModalDoc(null)}
        />
      )}
    </main>
  );
}
