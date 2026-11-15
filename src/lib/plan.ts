export type PlanEstado = "Pendiente" | "En curso" | "Terminado" | "Bloqueado" | "";

export interface PlanTarea {
  id: string;
  codigo: string;
  tarea: string;
  responsable: string;
  inicio: string;
  semanas: number | null;
  estado: PlanEstado;
  avance: number;
  observaciones: string;
  esGrupo: boolean;
  hito: boolean;
}

export interface PlanRaw {
  titulo: string;
  nota: string;
  fuente: string;
  referencias: string[];
  tareas: PlanTarea[];
}

export interface PlanTareaCalc extends PlanTarea {
  fin: string;
  grupoId: string | null;
  atrasada: boolean;
}

export interface PlanDerivado {
  titulo: string;
  nota: string;
  fuente: string;
  referencias: string[];
  tareas: PlanTareaCalc[];
  semanas: string[];
  meses: { col: number; label: string }[];
  avanceGeneral: number;
  rango: { inicio: string; fin: string };
  hoy: string;
  semanaActual: number;
}

const MS_DIA = 86400000;
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const toUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * MS_DIA);

export function mondayOf(iso: string): string {
  const ms = toUTC(iso);
  const dow = new Date(ms).getUTCDay();
  const delta = (dow + 6) % 7;
  return fromUTC(ms - delta * MS_DIA);
}

export function semanasDeTarea(t: PlanTarea): number {
  if (t.esGrupo) return 0;
  if (t.hito) return 0;
  return typeof t.semanas === "number" && t.semanas > 0 ? t.semanas : 1;
}

export function finDeTarea(t: PlanTarea): string {
  const s = semanasDeTarea(t);
  if (t.hito || s <= 0) return t.inicio;
  return addDays(t.inicio, Math.round(s * 7) - 3);
}

export function esHito(t: PlanTarea): boolean {
  return t.hito || (!t.esGrupo && typeof t.semanas === "number" && t.semanas === 0);
}

export function derivePlan(raw: PlanRaw, hoyISO = new Date().toISOString().slice(0, 10)): PlanDerivado {
  const tareas = Array.isArray(raw.tareas) ? raw.tareas : [];
  const hojas = tareas.filter((t) => !t.esGrupo);

  const finHoja = new Map<string, string>();
  for (const t of hojas) finHoja.set(t.id, finDeTarea(t));

  const hijosDe = (grupoId: string) =>
    hojas.filter((t) => t.id.startsWith(`${grupoId}.`));

  const avanceGrupo = (grupoId: string): number => {
    const hijos = hijosDe(grupoId);
    if (!hijos.length) return 0;
    return hijos.reduce((acc, t) => acc + (Number(t.avance) || 0), 0) / hijos.length;
  };

  const calc: PlanTareaCalc[] = tareas.map((t) => {
    if (t.esGrupo) {
      const hijos = hijosDe(t.id);
      const inicios = hijos.map((h) => h.inicio).filter(Boolean);
      const fines = hijos.map((h) => finHoja.get(h.id) ?? h.inicio).filter(Boolean);
      const inicio = inicios.length ? inicios.reduce((a, b) => (a < b ? a : b)) : t.inicio;
      const fin = fines.length ? fines.reduce((a, b) => (a > b ? a : b)) : t.inicio;
      return {
        ...t,
        inicio,
        fin,
        grupoId: null,
        avance: avanceGrupo(t.id),
        atrasada: false,
      };
    }
    const fin = finHoja.get(t.id) ?? t.inicio;
    return {
      ...t,
      fin,
      grupoId: t.id.includes(".") ? t.id.split(".")[0] : null,
      atrasada: !esHito(t) && t.estado !== "Terminado" && fin < hoyISO,
    };
  });

  const grupos = calc.filter((t) => t.esGrupo);
  const avanceGeneral = grupos.length
    ? grupos.reduce((acc, g) => acc + (Number(g.avance) || 0), 0) / grupos.length
    : hojas.length
      ? hojas.reduce((acc, t) => acc + (Number(t.avance) || 0), 0) / hojas.length
      : 0;

  const inicios = tareas.map((t) => t.inicio).filter(Boolean).sort();
  const fines = calc.map((t) => t.fin).filter(Boolean).sort();
  const minInicio = inicios[0] ?? hoyISO;
  const maxFin = fines[fines.length - 1] ?? minInicio;

  const semanas: string[] = [];
  let cursor = mondayOf(minInicio);
  let guard = 0;
  while (cursor <= maxFin && guard < 520) {
    semanas.push(cursor);
    cursor = addDays(cursor, 7);
    guard += 1;
  }
  if (!semanas.length) semanas.push(mondayOf(minInicio));

  const meses: { col: number; label: string }[] = [];
  let mesPrevio = "";
  semanas.forEach((s, i) => {
    const clave = s.slice(0, 7);
    if (clave !== mesPrevio) {
      const [y, m] = clave.split("-");
      meses.push({ col: i, label: `${MESES[Number(m) - 1]}-${y.slice(2)}` });
      mesPrevio = clave;
    }
  });

  let semanaActual = -1;
  semanas.forEach((s, i) => {
    if (s <= hoyISO) semanaActual = i;
  });

  return {
    titulo: raw.titulo ?? "",
    nota: raw.nota ?? "",
    fuente: raw.fuente ?? "",
    referencias: raw.referencias ?? [],
    tareas: calc,
    semanas,
    meses,
    avanceGeneral,
    rango: { inicio: semanas[0], fin: semanas[semanas.length - 1] },
    hoy: hoyISO,
    semanaActual,
  };
}

export const ESTADOS: PlanEstado[] = ["Pendiente", "En curso", "Terminado", "Bloqueado"];

export const planRawVacio = (): PlanRaw => ({
  titulo: "",
  nota: "",
  fuente: "",
  referencias: [],
  tareas: [],
});
