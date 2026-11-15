import { HttpError } from "./documentos";
import type { SaveResult } from "./persist";
import { savePlan } from "./persist";
import { readPlan } from "./storage";
import type { Rol } from "./session";
import { ESTADOS, type PlanEstado, type PlanRaw, type PlanTarea } from "./plan";

export interface PlanSession {
  nombre: string;
  rol: Rol;
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TAREAS = 500;

function requireEditor(session: PlanSession | null): void {
  if (!session) throw new HttpError(401, "No autorizado");
  if (session.rol === "lector") {
    throw new HttpError(403, "No tenés permisos para editar el plan de trabajo");
  }
}

function str(value: unknown, max = 500): string {
  return typeof value === "string" ? value.slice(0, max).trim() : "";
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown): boolean {
  return value === true;
}

function sanitizeTarea(value: unknown, hoy: string): PlanTarea {
  const t = (value ?? {}) as Record<string, unknown>;
  const id = str(t.id, 40);
  if (!id) throw new HttpError(400, "Cada tarea necesita un id");

  const esGrupo = bool(t.esGrupo);
  const hito = !esGrupo && bool(t.hito);

  const inicioRaw = str(t.inicio, 10);
  const inicio = FECHA_RE.test(inicioRaw) ? inicioRaw : hoy;

  const estadoRaw = str(t.estado, 20) as PlanEstado;
  const estado: PlanEstado = ESTADOS.includes(estadoRaw) ? estadoRaw : "";

  let semanas: number | null;
  if (esGrupo) {
    semanas = null;
  } else if (hito) {
    semanas = 0;
  } else {
    const s = Math.round(num(t.semanas, 1));
    semanas = s > 0 ? s : 1;
  }

  const avance = Math.min(1, Math.max(0, num(t.avance, 0)));

  return {
    id,
    codigo: str(t.codigo, 40),
    tarea: str(t.tarea, 300),
    responsable: str(t.responsable, 120),
    inicio,
    semanas,
    estado: esGrupo ? "" : estado || "Pendiente",
    avance: esGrupo ? 0 : avance,
    observaciones: str(t.observaciones, 1000),
    esGrupo,
    hito,
  };
}

export async function getPlan(): Promise<PlanRaw> {
  return readPlan();
}

export async function updatePlan(
  raw: unknown,
  session: PlanSession | null,
): Promise<SaveResult> {
  requireEditor(session);

  const body = (raw ?? {}) as Record<string, unknown>;
  const lista = Array.isArray(body.tareas) ? body.tareas : [];
  if (lista.length > MAX_TAREAS) {
    throw new HttpError(400, `El plan no puede superar ${MAX_TAREAS} tareas`);
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const tareas = lista.map((t) => sanitizeTarea(t, hoy));

  const ids = new Set<string>();
  for (const t of tareas) {
    if (ids.has(t.id)) throw new HttpError(400, `Id de tarea duplicado: ${t.id}`);
    ids.add(t.id);
  }

  const data: PlanRaw = {
    titulo: str(body.titulo, 300) || "Plan de Trabajo",
    nota: str(body.nota, 1000),
    fuente: str(body.fuente, 300),
    referencias: Array.isArray(body.referencias)
      ? body.referencias.filter((r): r is string => typeof r === "string").slice(0, 40)
      : [],
    tareas,
  };

  return savePlan(data);
}
