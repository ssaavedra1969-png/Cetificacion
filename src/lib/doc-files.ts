import { promises as fs } from "fs";
import path from "path";
import {
  deleteFile,
  getBinaryFile,
  githubConfigured,
  putBinaryFile,
} from "./github";

export const DOCS_DIR = "documentos";

function safeRelative(ruta: string): string {
  const normalized = (ruta || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");

  if (
    !normalized.startsWith(`${DOCS_DIR}/`) ||
    normalized.includes("../") ||
    normalized.includes("/..")
  ) {
    throw new Error("Ruta de documento inválida");
  }

  return normalized;
}

function localPathFor(relative: string): string {
  const base = path.resolve(process.cwd(), DOCS_DIR);
  const absolute = path.resolve(process.cwd(), relative);
  if (absolute !== base && !absolute.startsWith(`${base}${path.sep}`)) {
    throw new Error("Ruta de documento inválida");
  }
  return absolute;
}

export interface SavedFile {
  ruta: string;
  local: boolean;
  remote: boolean;
}

export async function saveDocumentoFile(
  buffer: Buffer,
  filename: string,
): Promise<SavedFile> {
  const cleanName = path.basename(filename);
  if (!cleanName || cleanName !== filename) {
    throw new Error("Nombre de archivo inválido");
  }

  const ruta = `${DOCS_DIR}/${cleanName}`;
  const absolute = localPathFor(ruta);

  let local = false;
  try {
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, buffer);
    local = true;
  } catch {
    local = false;
  }

  const shouldRemote =
    githubConfigured() && (!local || process.env.NODE_ENV === "production");

  if (shouldRemote) {
    await putBinaryFile(ruta, buffer, `SGC: agregar documento ${cleanName}`);
  }

  if (!local && !shouldRemote) {
    throw new Error(
      "No se pudo guardar el archivo: almacenamiento local no disponible y GitHub no configurado.",
    );
  }

  return { ruta, local, remote: shouldRemote };
}

export async function readDocumentoFile(
  ruta: string,
): Promise<{ data: Buffer; local: boolean }> {
  const relative = safeRelative(ruta);

  try {
    const data = await fs.readFile(localPathFor(relative));
    return { data, local: true };
  } catch {
    // puede no existir en el filesystem de la función serverless
  }

  if (githubConfigured()) {
    const data = await getBinaryFile(relative);
    if (data) return { data, local: false };
  }

  throw new Error("Archivo no encontrado");
}

export async function removeDocumentoFile(ruta: string): Promise<void> {
  const relative = safeRelative(ruta);

  try {
    await fs.unlink(localPathFor(relative));
  } catch {
    // ignorar si no existe localmente
  }

  if (githubConfigured()) {
    try {
      await deleteFile(relative, `SGC: eliminar documento ${relative}`);
    } catch {
      // el archivo ya podría no existir en GitHub
    }
  }
}
