import { randomUUID } from "crypto";
import type { Documento, PuntoSGC } from "@/types/models";
import { readAgenda, readDocumentos } from "./storage";
import { saveAgenda, saveDocumentos } from "./persist";
import {
  MAX_UPLOAD_BYTES,
  extFromName,
  formatBytes,
  isAllowedExt,
  slugify,
  tipoFromExt,
} from "./files";
import { removeDocumentoFile, saveDocumentoFile } from "./doc-files";
import type { Rol } from "./session";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface DocumentoSession {
  nombre: string;
  rol: Rol;
  plantas: string[];
}

const PLANTAS_VALIDAS = new Set(["Campana", "Luján", "General"]);

function requireEditor(session: DocumentoSession | null, planta: string): void {
  if (!session) throw new HttpError(401, "No autorizado");
  if (session.rol === "lector") {
    throw new HttpError(403, "No tenés permisos para modificar documentos");
  }
  if (session.rol === "editor") {
    const permitida =
      planta === "General" ||
      session.plantas.includes(planta) ||
      session.plantas.includes("General");
    if (!permitida) {
      throw new HttpError(
        403,
        `No tenés permisos sobre la planta ${planta || "indicada"}`,
      );
    }
  }
}

function normalizeDocumento(doc: Documento): Documento {
  if (doc.ruta) {
    const ext = extFromName(doc.ruta);
    const tipo = isAllowedExt(ext) ? tipoFromExt(ext) : doc.tipo;
    return {
      ...doc,
      tipo,
      archivoUrl: `/api/files?id=${encodeURIComponent(doc.id)}`,
    };
  }

  const ext = extFromName(doc.archivoUrl || doc.nombre);
  const tipo = isAllowedExt(ext) ? tipoFromExt(ext) : doc.tipo;
  return { ...doc, tipo };
}

export async function getDocumentos(): Promise<{
  documentos: Documento[];
  categorias: string[];
  metadata: unknown;
}> {
  const data = await readDocumentos();
  return {
    ...data,
    documentos: (data.documentos ?? []).map(normalizeDocumento),
  };
}

function field(form: FormData, name: string, fallback = ""): string {
  const value = form.get(name);
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function text(form: FormData, name: string, fallback = ""): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : fallback;
}

function optionalText(
  form: FormData,
  name: string,
  fallback: string,
): string {
  return form.has(name) ? text(form, name) : fallback;
}

function isUpload(value: FormDataEntryValue | null): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0 &&
    Boolean(value.name)
  );
}

function ensureCategory(categorias: string[], categoria: string): string[] {
  const clean = categoria.trim();
  if (!clean || categorias.includes(clean)) return categorias;
  return [...categorias, clean];
}

async function readFileBuffer(file: File): Promise<Buffer> {
  const ext = extFromName(file.name);
  if (!isAllowedExt(ext)) {
    throw new HttpError(
      400,
      "Tipo de archivo no permitido (PDF, Word, Excel o imagen)",
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(
      413,
      `El archivo supera el máximo de ${formatBytes(
        MAX_UPLOAD_BYTES,
      )} por solicitud`,
    );
  }
  return Buffer.from(await file.arrayBuffer());
}

function buildFilename(id: string, nombre: string, ext: string): string {
  return `${id}-${slugify(nombre)}${ext}`;
}

function addHistorial(
  punto: PuntoSGC,
  usuario: string,
  antes: string[],
  despues: string[],
): void {
  punto.documentosIds = despues;
  punto.fechaActualizacion = new Date().toISOString();
  punto.historial = punto.historial ?? [];
  punto.historial.push({
    fecha: new Date().toISOString(),
    usuario,
    campo: "documentos",
    valorAnterior: antes.join(", "),
    valorNuevo: despues.join(", "),
  });
}

async function linkDocumento(
  documento: Documento,
  usuario: string,
): Promise<void> {
  if (!documento.puntoId) return;
  const agenda = await readAgenda();
  const punto = agenda.puntos.find((p) => p.id === documento.puntoId);
  if (!punto) return;

  const antes = punto.documentosIds ?? [];
  if (antes.includes(documento.id)) return;
  addHistorial(
    punto,
    usuario,
    antes,
    Array.from(new Set([...antes, documento.id])),
  );
  await saveAgenda({ puntos: agenda.puntos, metadata: agenda.metadata });
}

async function unlinkDocumentoDePunto(
  puntoId: string,
  documentoId: string,
  usuario: string,
): Promise<void> {
  if (!puntoId) return;
  const agenda = await readAgenda();
  const punto = agenda.puntos.find((p) => p.id === puntoId);
  if (!punto) return;

  const antes = punto.documentosIds ?? [];
  if (!antes.includes(documentoId)) return;
  addHistorial(
    punto,
    usuario,
    antes,
    antes.filter((id) => id !== documentoId),
  );
  await saveAgenda({ puntos: agenda.puntos, metadata: agenda.metadata });
}

async function unlinkDocumentoDeTodos(
  documentoId: string,
  usuario: string,
): Promise<void> {
  const agenda = await readAgenda();
  let changed = false;

  for (const punto of agenda.puntos) {
    const antes = punto.documentosIds ?? [];
    if (!antes.includes(documentoId)) continue;
    addHistorial(
      punto,
      usuario,
      antes,
      antes.filter((id) => id !== documentoId),
    );
    changed = true;
  }

  if (changed) {
    await saveAgenda({ puntos: agenda.puntos, metadata: agenda.metadata });
  }
}

export async function createDocumento(
  form: FormData,
  session: DocumentoSession | null,
) {
  const planta = field(form, "planta", "General");
  if (!PLANTAS_VALIDAS.has(planta)) {
    throw new HttpError(400, "Planta inválida");
  }
  requireEditor(session, planta);

  const nombre = field(form, "nombre");
  if (!nombre) throw new HttpError(400, "Ingresá un nombre para el documento");

  const file = form.get("file");
  if (!isUpload(file)) {
    throw new HttpError(400, "Seleccioná el archivo a subir");
  }

  const buffer = await readFileBuffer(file);
  const ext = extFromName(file.name);
  const id = `D${Date.now().toString(36)}${randomUUID().slice(0, 6)}`;
  const filename = buildFilename(id, nombre, ext);
  const guardado = await saveDocumentoFile(buffer, filename);

  const data = await readDocumentos();
  const categoria = field(form, "categoria", "General");
  const documento: Documento = {
    id,
    nombre,
    categoria,
    puntoId: field(form, "puntoId"),
    planta,
    fecha: field(form, "fecha", new Date().toISOString().slice(0, 10)),
    version: field(form, "version", "1.0"),
    responsable: field(form, "responsable", session?.nombre ?? "A definir"),
    descripcion: field(form, "descripcion"),
    archivoUrl: `/api/files?id=${encodeURIComponent(id)}`,
    ruta: guardado.ruta,
    tipo: tipoFromExt(ext),
  };

  try {
    await saveDocumentos({
      documentos: [...(data.documentos ?? []), documento],
      categorias: ensureCategory(data.categorias ?? [], categoria),
      metadata: data.metadata ?? {},
    });
  } catch (error) {
    await removeDocumentoFile(guardado.ruta);
    throw error;
  }

  await linkDocumento(documento, session?.nombre ?? "admin");

  return {
    documento: normalizeDocumento(documento),
    guardado: { local: guardado.local, remote: guardado.remote },
  };
}

export async function updateDocumento(
  id: string,
  form: FormData,
  session: DocumentoSession | null,
) {
  const data = await readDocumentos();
  const actual = (data.documentos ?? []).find((doc) => doc.id === id);
  if (!actual) throw new HttpError(404, "Documento no encontrado");

  const planta = field(form, "planta", actual.planta || "General");
  if (!PLANTAS_VALIDAS.has(planta)) {
    throw new HttpError(400, "Planta inválida");
  }
  requireEditor(session, actual.planta || "General");
  requireEditor(session, planta);

  const actualizado: Documento = {
    ...actual,
    nombre: field(form, "nombre", actual.nombre),
    categoria: field(form, "categoria", actual.categoria),
    puntoId: optionalText(form, "puntoId", actual.puntoId ?? ""),
    planta,
    fecha: field(form, "fecha", actual.fecha),
    version: field(form, "version", actual.version),
    responsable: field(form, "responsable", actual.responsable),
    descripcion: optionalText(form, "descripcion", actual.descripcion),
  };

  const file = form.get("file");
  let nuevoArchivo: string | null = null;

  if (isUpload(file)) {
    const buffer = await readFileBuffer(file);
    const ext = extFromName(file.name);
    const filename = buildFilename(id, actualizado.nombre, ext);
    const guardado = await saveDocumentoFile(buffer, filename);
    nuevoArchivo = guardado.ruta;
    actualizado.ruta = guardado.ruta;
    actualizado.archivoUrl = `/api/files?id=${encodeURIComponent(id)}`;
    actualizado.tipo = tipoFromExt(ext);
  }

  const documentos = (data.documentos ?? []).map((doc) =>
    doc.id === id ? actualizado : doc,
  );

  try {
    await saveDocumentos({
      documentos,
      categorias: ensureCategory(data.categorias ?? [], actualizado.categoria),
      metadata: data.metadata ?? {},
    });
  } catch (error) {
    if (nuevoArchivo) await removeDocumentoFile(nuevoArchivo);
    throw error;
  }

  const usuario = session?.nombre ?? "admin";
  const puntoAnterior = actual.puntoId ?? "";
  const puntoNuevo = actualizado.puntoId ?? "";

  if (puntoAnterior !== puntoNuevo) {
    if (puntoAnterior) {
      await unlinkDocumentoDePunto(puntoAnterior, id, usuario);
    }
    if (puntoNuevo) {
      await linkDocumento(actualizado, usuario);
    }
  } else if (puntoNuevo) {
    await linkDocumento(actualizado, usuario);
  }

  if (actual.ruta && nuevoArchivo && actual.ruta !== nuevoArchivo) {
    await removeDocumentoFile(actual.ruta);
  }

  return { documento: normalizeDocumento(actualizado) };
}

export async function deleteDocumento(
  id: string,
  session: DocumentoSession | null,
) {
  const data = await readDocumentos();
  const actual = (data.documentos ?? []).find((doc) => doc.id === id);
  if (!actual) throw new HttpError(404, "Documento no encontrado");

  requireEditor(session, actual.planta || "General");

  await saveDocumentos({
    documentos: (data.documentos ?? []).filter((doc) => doc.id !== id),
    categorias: data.categorias ?? [],
    metadata: data.metadata ?? {},
  });

  if (actual.ruta) {
    await removeDocumentoFile(actual.ruta);
  }

  await unlinkDocumentoDeTodos(id, session?.nombre ?? "admin");

  return { ok: true };
}
