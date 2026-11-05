import type { PuntoSGC, Documento, HistorialCambio } from "../types/models";

const DATA_DIR = "./data";

export async function readAgenda(): Promise<{ puntos: PuntoSGC[]; metadata: any }> {
  const res = await fetch(`${DATA_DIR}/agenda.json`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer agenda.json");
  return res.json();
}

export async function writeAgenda(data: { puntos: PuntoSGC[]; metadata: any }): Promise<void> {
  // This will be called from serverless functions
  const path = `${DATA_DIR}/agenda.json`;
  // Write locally for dev; serverless functions will commit to GitHub
  const fs = await import("fs");
  const pathModule = await import("path");
  const filePath = pathModule.default.join(process.cwd(), path);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function readDocumentos(): Promise{ documentos: Documento[]; categorias: string[]; metadata: any }> {
  const res = await fetch(`${DATA_DIR}/documentos.json`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer documentos.json");
  return res.json();
}

export async function writeDocumentos(data: { documentos: Documento[]; categorias: string[]; metadata: any }): Promise<void> {
  const fs = await import("fs");
  const pathModule = await import("path");
  const filePath = pathModule.default.join(process.cwd(), "./data/documentos.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function addHistorialPunto(
  puntoId: string,
  campo: string,
  valorAnterior: string,
  valorNuevo: string,
  usuario: string
): Promise<void> {
  const { writeAgenda } = await import("./lib/storage");
  const { readAgenda } = await import("./lib/storage");
  const agenda = await readAgenda();
  const punto = agenda.puntos.find((p) => p.id === puntoId);
  if (!punto) throw new Error("Punto no encontrado");

  punto.historial = punto.historial || [];
  punto.historial.push({
    fecha: new Date().toISOString(),
    usuario,
    campo,
    valorAnterior,
    valorNuevo,
  });

  await writeAgenda(agenda);
}