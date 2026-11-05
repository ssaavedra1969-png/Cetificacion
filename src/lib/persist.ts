import type { PuntoSGC, Documento } from "../types/models";
import { writeAgenda, writeDocumentos } from "./storage";
import { githubConfigured, putJSON } from "./github";

export interface SaveResult {
  local: boolean;
  remote: boolean;
}

interface AgendaData {
  puntos: PuntoSGC[];
  metadata: unknown;
}

interface DocumentosData {
  documentos: Documento[];
  categorias: string[];
  metadata: unknown;
}

// En local guarda en el filesystem. En producción (filesystem de solo
// lectura) replica el cambio commiteando a GitHub, que redeploya Vercel.
async function persist(
  localWrite: () => Promise<void>,
  remoteWrite: () => Promise<void>,
): Promise<SaveResult> {
  let local = false;
  try {
    await localWrite();
    local = true;
  } catch {
    local = false;
  }

  const shouldRemote =
    githubConfigured() && (!local || process.env.NODE_ENV === "production");

  if (shouldRemote) {
    await remoteWrite();
  }

  if (!local && !shouldRemote) {
    throw new Error(
      "No se pudo guardar: el almacenamiento local no está disponible y GitHub no está configurado (GITHUB_TOKEN / GITHUB_REPO).",
    );
  }

  return { local, remote: shouldRemote };
}

export async function saveAgenda(data: AgendaData): Promise<SaveResult> {
  return persist(
    () => writeAgenda(data),
    () => putJSON("data/agenda.json", data, "SGC: actualizar agenda"),
  );
}

export async function saveDocumentos(
  data: DocumentosData,
): Promise<SaveResult> {
  return persist(
    () => writeDocumentos(data),
    () => putJSON("data/documentos.json", data, "SGC: actualizar documentos"),
  );
}
