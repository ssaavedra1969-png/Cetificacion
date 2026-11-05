"use client";

import { useState, useEffect } from "react";
import { PuntoSGC, Documento, HistorialCambio } from "@/types/models";
import { readAgenda, writeAgenda } from "@/lib/storage";
import { readDocumentos, writeDocumentos } from "@/lib/storage";

interface AdminPageProps {
  query: { puntoId?: string };
}

export default function Administracion({ query }: AdminPageProps) {
  const [agenda, setAgenda] = useState<{
    puntos: PuntoSGC[];
    metadata: any;
  } | null>(null);
  const [documentos, setDocumentos] = useState<{
    documentos: any[];
    categorias: string[];
  }>({ documentos: [], categorias: [] });

  const [modo, setModo] = useState<"login" | "lista" | "formulario">("login");
  const [editando, setEditando] = useState<PuntoSGC | null>(null);
  const [nuevoDocumento, setNuevoDocumento] = useState({
    nombre: "",
    categoria: "",
    puntoId: "",
    planta: "",
    version: "1.0",
    responsable: "",
    descripcion: "",
    archivo: null as File | null,
  });

  const [mensaje, setMensaje] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordInvalido, setPasswordInvalido] = useState(false);

  // Verificar autenticacion al cargar
  useEffect(() => {
    fetch("/api/agenda")
      .then((res) => {
        if (res.status === 401) {
          setPasswordInvalido(true);
          setModo("login");
        } else if (res.ok) {
          setModo("lista");
          fetch("/api/agenda").then((r) => r.json()).then((data) => setAgenda(data));
          fetch("/api/documentos").then((r) => r.json()).then((data) =>
            setDocumentos({ documentos: data.documentos || [], categorias: data.categorias || [] })
          );
        } else {
          setModo("login");
          setMensaje({ type: "error", text: "Error de conexión con el servidor" });
        }
      })
      .catch(() => {
        setModo("login");
        setMensaje({ type: "error", text: "Error de conexión con el servidor" });
      });
  }, []);

  // Si la contraseña es inválida, mostrar formulario de login
  if (passwordInvalido) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso a Administración
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La sesión expiró o no está autenticada.
          </p>
          <form
            onSubmit={async (e: React.FormEvent) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const password = form.elements["admin-password"] as HTMLInputElement;
              const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: password.value }),
              });
              const data = await res.json();
              if (data.success) {
                setModo("lista");
                password.value = "";
              } else {
                setMensaje({ type: "error", text: data.error || "Contraseña incorrecta" });
              }
            }}
          >
            <input
              type="password"
              name="admin-password"
              placeholder="Contraseña de administración"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-3"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Autenticar
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            No tiene permisos para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <span className="text-gray-600">Cargando administración...</span>
      </div>
    );
  }

  const puntos = agenda.puntos;

  // Filtrar punto específico
  const punto = query.puntoId
    ? puntos.find((p: any) => p.id === query.puntoId)
    : null;

  // Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevoDocumento((prev) => ({ ...prev, archivo: file }));
      setMensaje(null);
    }
  };

  // Manejar cambio de formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNuevoDocumento((prev) => ({ ...prev, [name]: value as any }));
  };

  // Guardar punto SGC (editando o nuevo)
  const guardarPunto = useCallback(async (puntoData: PuntoSGC) => {
    try {
      await writeAgenda({ puntos: agenda.puntos.map((p) => p.id === puntoData.id ? puntoData : p), metadata: agenda.metadata });
      setMensaje({ type: "success", text: "Punto SGC actualizado correctamente" });
      setEditando(null);
      fetch("/api/agenda").then((res) => res.json()).then((data) => setAgenda(data));
    } catch (error) {
      setMensaje({ type: "error", text: "Error al guardar el punto SGC" });
    }
  }, [agenda]);

  // Cambiar estado de un punto
  const cambiarEstado = useCallback(async (puntoId: string, nuevoEstado: PuntoSGC["estado"], usuario: string) => {
    const punto = agenda.puntos.find((p: any) => p.id === puntoId);
    if (!punto) return;

    const historial: HistorialCambio = {
      fecha: new Date().toISOString(),
      usuario,
      campo: "estado",
      valorAnterior: punto.estado,
      valorNuevo: nuevoEstado,
    };

    const updatedPunto = {
      ...punto,
      estado: nuevoEstado,
      fechaActualizacion: new Date().toISOString(),
      historial: [...(punto.historial || []), historial],
    };

    await guardarPunto(updatedPunto);
  }, [agenda, guardarPunto]);

  // Agregar nota a un punto
  const agregarNota = useCallback(async (puntoId: string, nota: string, usuario: string) => {
    const punto = agenda.puntos.find((p: any) => p.id === puntoId);
    if (!punto) return;

    const historial: HistorialCambio = {
      fecha: new Date().toISOString(),
      usuario,
      campo: "notas",
      valorAnterior: punto.notas || "",
      valorNuevo: nota,
    };

    const updatedPunto = {
      ...punto,
      notas: nota,
      historial: [...(punto.historial || []), historial],
    };

    await guardarPunto(updatedPunto);
  }, [agenda, guardarPunto]);

  // Subir PDF mediante GitHub API
  const subirPDF = useCallback(async () => {
    if (!nuevoDocumento.archivo) {
      setMensaje({ type: "error", text: "Seleccione un archivo PDF" });
      return;
    }
    if (!nuevoDocumento.nombre.trim()) {
      setMensaje({ type: "error", text: "Ingrese un nombre para el documento" });
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
    formData.append("password", process.env.ADMIN_PASSWORD || "falpat-admin-2026");

    try {
      const res = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        // Agregar referencia al documento a la lista
        const nuevoDoc: any = {
          id: Date.now().toString(),
          nombre: nuevoDocumento.nombre,
          categoria: nuevoDocumento.categoria,
          puntoId: nuevoDocumento.puntoId,
          planta: nuevoDocumento.planta,
          fecha: new Date().toISOString().split("T")[0],
          version: nuevoDocumento.version,
          responsable: nuevoDocumento.responsable,
          descripcion: nuevoDocumento.descripcion,
          archivoUrl: result.url,
          tipo: "pdf",
        };

        // Actualizar documentos.json
        const currentDocs = documentos.documentos || [];
        await writeDocumentos({ ...documentos, documentos: [...currentDocs, nuevoDoc] });

        // Agregar al punto SGC correspondiente
        if (nuevoDocumento.puntoId) {
          const punto = agenda.puntos.find((p: any) => p.id === nuevoDocumento.puntoId);
          if (punto) {
            const updatedPunto = {
              ...punto,
              documentosIds: [...(punto.documentosIds || []), nuevoDoc.id],
            };
            await guardarPunto(updatedPunto);
          }
        }

        setMensaje({ type: "success", text: "PDF subido y guardado correctamente" });
        setNuevoDocumento({
          nombre: "",
          categoria: "",
          puntoId: "",
          planta: "",
          version: "1.0",
          responsable: "",
          descripcion: "",
          archivo: null,
        });

        // Recargar documentos
        fetch("/api/documentos").then((res) => res.json()).then((data) =>
          setDocumentos(data)
        );
      } else {
        setMensaje({ type: "error", text: result.error || "Error al subir PDF" });
      }
    } catch (error) {
      setMensaje({ type: "error", text: "Error de conexión al subir PDF" });
    }
  }, [nuevoDocumento, documentos, agenda, guardarPunto, writeDocumentos]);

  // Obtener URL pública de un PDF subido a GitHub
  const obtenerURLPDF = (filename: string): string => {
    return `https://github.com/grupo-falpat/portal-sgc/raw/main/public/documentos/${filename}`;
  };

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Message toast */}
        {mensaje && (
          <div className="mb-4 rounded-md px-4 py-2 text-sm {
            mensaje.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } animate-in fade-in-0">
            {mensaje.text}
          </div>
        )}

        {/* Modo lista de puntos */}
        {modo === "lista" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Panel de Administración SGC
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {puntos.map((p: PuntoSGC) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setEditando(p)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {p.titulo}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {p.descripcion}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        p.estado === "Pendiente"
                          ? "bg-gray-100 text-gray-800"
                          : p.estado === "En curso"
                          ? "bg-blue-100 text-blue-800"
                          : p.estado === "Bloqueado"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {p.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones rápidas */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-4">Acciones rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-600 text-sm font-medium"
                >
                  Nuevo punto SGC
                </button>
                <button
                  className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 text-sm font-medium"
                >
                  Actualizar datos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de edición de punto */}
        {editando && modo !== "login" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editando.id === "NUEVO" ? "Nuevo Punto SGC" : `Editar: ${editando.titulo}`}
            </h2>

            <form
              onSubmit={async (e: React.FormEvent) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const puntoData: PuntoSGC = {
                  id: editando.id,
                  titulo: formData.get("titulo") as string,
                  descripcion: formData.get("descripcion") as string,
                  categoria: formData.get("categoria") as string,
                  plantas: (formData.get("plantas") as string || "")
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0),
                  responsable: formData.get("responsable") as string || "A definir",
                  prioridad: formData.get("prioridad") as "alta" | "media" | "baja" || "media",
                  estado: formData.get("estado") as PuntoSGC["estado"] || "Pendiente",
                  fechaCompromiso: formData.get("fechaCompromiso") as string || "",
                  fechaActualizacion: new Date().toISOString(),
                  notas: formData.get("notas") as string || editando.notas,
                  documentosIds: editando.documentosIds,
                  historial: editando.historial,
                };
                await guardarPunto(puntoData);
              }}
            >
              <input type="hidden" name="id" value={editando.id} />
              <input
                type="text"
                name="titulo"
                defaultValue={editando?.titulo || ""}
                placeholder="Título del punto"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <select
                name="categoria"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccionar categoría</option>
                <option value="Resguardo de información">Resguardo de información</option>
                <option value="Muestras de Campana">Muestras de Campana</option>
                <option value="Certificados de calibración">Certificados de calibración</option>
                <option value="Layout">Layout</option>
                <option value="Seguridad vial">Seguridad vial</option>
                <option value="Administración">Administración</option>
                <option value="Muestreo">Muestreo</option>
                <option value="Control de calidad">Control de calidad</option>
                <option value="Documentación del laboratorio">Documentación del laboratorio</option>
              </select>
              <select
                name="plantas"
                multiple
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Campana">Campana</option>
                <option value="Luján">Luján</option>
                <option value="General">General</option>
              </select>
              <select
                name="responsable"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="A definir">A definir</option>
                <option value="Juan Pérez">Juan Pérez</option>
                <option value="María García">María García</option>
                <option value="Carlos López">Carlos López</option>
              </select>
              <select
                name="prioridad"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
              <select
                name="estado"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Bloqueado">Bloqueado</option>
                <option value="Completado">Completado</option>
              </select>
              <textarea
                name="notas"
                rows={3}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >{editando?.notas || ""}</textarea>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Historial de cambios del punto seleccionado */}
        {editando && modo !== "login" && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Historial de cambios
            </h2>
            {editando.historial?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">Fecha</th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">Usuario</th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">Campo</th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">Anterior</th>
                      <th className="py-3 px-3 text-left text-gray-600 dark:text-gray-400">Nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editando.historial.map((h: HistorialCambio, i: number) => (
                      <tr key={i} className="border-b dark:border-gray-700">
                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(h.fecha).toLocaleDateString("es-AR")}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {h.usuario}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {h.campo}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {h.valorAnterior || "—"}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {h.valorNuevo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Sin historial de cambios aún.
              </p>
            )}
          </div>
        )}

        {/* Subir PDF Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Subir PDF / Documento
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Cargar un nuevo documento PDF asociado a un punto SGC. Los archivos se
            suben mediante la API de GitHub y se guardan en la documentoteca.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <form onSubmit={subirPDF} className="grid grid-cols-1 gap-4">
              <input
                type="hidden"
                name="puntoId"
                value={nuevoDocumento.puntoId}
              />
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del documento
                </label>
                <input
                  type="text"
                  value={nuevoDocumento.nombre}
                  onChange={handleInputChange}
                  name="nombre"
                  placeholder="Ej: Certificado balanza 01/2026"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={nuevoDocumento.categoria}
                  onChange={handleInputChange}
                  name="categoria"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleccionar categoría</option>
                  {documentos.categorias.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Planta
                </label>
                <select
                  value={nuevoDocumento.planta}
                  onChange={handleInputChange}
                  name="planta"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Campana">Campana</option>
                  <option value="Luján">Luján</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={nuevoDocumento.version}
                  onChange={handleInputChange}
                  name="version"
                  placeholder="1.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Responsable
                </label>
                <input
                  type="text"
                  value={nuevoDocumento.responsable}
                  onChange={handleInputChange}
                  name="responsable"
                  placeholder="Ej: Laboratorio Luján"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={nuevoDocumento.descripcion}
                  onChange={handleInputChange}
                  name="descripcion"
                  placeholder="Descripción del documento..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Archivo PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  name="archivo"
                  className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-gray-800 text-center focus:outline-none"
                />
                {nuevoDocumento.archivo && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Archivo seleccionado: {nuevoDocumento.archivo.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-lg"
              >
                Subir PDF y actualizar documento
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}