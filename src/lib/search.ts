export function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const SINONIMOS: Record<string, string[]> = {
  modificar: ["editar", "cambiar", "actualizar"],
  cambiar: ["editar", "modificar", "actualizar"],
  actualizar: ["editar", "modificar", "cambiar"],
  editar: ["modificar", "cambiar", "actualizar"],
  subir: ["cargar", "crear", "agregar", "nuevo"],
  agregar: ["cargar", "crear", "subir", "nuevo"],
  nuevo: ["cargar", "crear", "subir", "agregar"],
  crear: ["cargar", "subir", "agregar", "nuevo"],
  cargar: ["subir", "crear", "agregar", "nuevo"],
  borrar: ["eliminar", "quitar"],
  quitar: ["eliminar", "borrar"],
  eliminar: ["borrar", "quitar"],
  ver: ["consultar", "visualizar", "abrir", "leer"],
  abrir: ["consultar", "visualizar", "ver", "leer"],
  leer: ["consultar", "visualizar", "ver", "abrir"],
  consultar: ["ver", "abrir", "leer", "visualizar"],
  visualizar: ["ver", "abrir", "leer", "consultar"],
  peso: ["4 mb", "limite", "tamano", "pesado"],
  tamano: ["4 mb", "limite", "peso", "pesado"],
  pesado: ["4 mb", "limite", "peso", "tamano"],
  limite: ["4 mb", "peso", "tamano"],
  documento: ["documentos", "documentoteca", "archivo"],
  documentos: ["documento", "documentoteca", "archivo"],
  permiso: ["permisos", "rol", "roles"],
};

export function expandirTokens(tokens: string[]): string[] {
  const out = new Set<string>(tokens);
  for (const t of tokens) {
    const syns = SINONIMOS[t];
    if (syns) syns.forEach((s) => out.add(s));
  }
  return Array.from(out);
}

export function tokenizar(q: string): string[] {
  return norm(q).split(/\s+/).filter(Boolean);
}

export function coincide(texto: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const n = norm(texto);
  const exp = expandirTokens(tokens);
  return exp.every((t) => n.includes(t));
}
