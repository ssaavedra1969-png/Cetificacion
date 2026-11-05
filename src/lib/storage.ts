import { promises as fs } from "fs";
import path from "path";
import type { PuntoSGC, Documento, HistorialCambio } from "../types/models";
import { githubConfigured, getJSON } from "./github";

const DATA_DIR = path.join(process.cwd(), "data");

const isVercel = process.env.VERCEL === "1";

export async function readAgenda(): Promise<{ puntos: PuntoSGC[]; metadata: any }> {
  if (isVercel && githubConfigured()) {
    try {
      const data = await getJSON<{ puntos: PuntoSGC[]; metadata: any }>(
        "data/agenda.json",
      );
      if (data) return data;
    } catch {
      // caer al filesystem empaquetado
    }
  }

  const raw = await fs.readFile(path.join(DATA_DIR, "agenda.json"), "utf-8");
  return JSON.parse(raw);
}

export async function writeAgenda(data: {
  puntos: PuntoSGC[];
  metadata: any;
}): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, "agenda.json"),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export async function readDocumentos(): Promise<{
  documentos: Documento[];
  categorias: string[];
  metadata: any;
}> {
  if (isVercel && githubConfigured()) {
    try {
      const data = await getJSON<{
        documentos: Documento[];
        categorias: string[];
        metadata: any;
      }>("data/documentos.json");
      if (data) return data;
    } catch {
      // caer al filesystem empaquetado
    }
  }

  const raw = await fs.readFile(
    path.join(DATA_DIR, "documentos.json"),
    "utf-8",
  );
  return JSON.parse(raw);
}

export async function writeDocumentos(data: {
  documentos: Documento[];
  categorias: string[];
  metadata: any;
}): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, "documentos.json"),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export async function addHistorialPunto(
  puntoId: string,
  campo: string,
  valorAnterior: string,
  valorNuevo: string,
  usuario: string,
): Promise<void> {
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

export type { HistorialCambio };
