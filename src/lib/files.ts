export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type TipoArchivo = "pdf" | "word" | "excel" | "imagen" | "otro";

const EXT_TIPO: Record<string, TipoArchivo> = {
  ".pdf": "pdf",
  ".doc": "word",
  ".docx": "word",
  ".xls": "excel",
  ".xlsx": "excel",
  ".csv": "excel",
  ".png": "imagen",
  ".jpg": "imagen",
  ".jpeg": "imagen",
  ".webp": "imagen",
  ".gif": "imagen",
};

const EXT_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const ALLOWED_EXT = new Set(Object.keys(EXT_TIPO));

export function extFromName(name: string): string {
  const clean = (name || "").split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  if (dot < 0) return "";
  return clean.slice(dot).toLowerCase();
}

export function tipoFromExt(ext: string): TipoArchivo {
  return EXT_TIPO[ext.toLowerCase()] ?? "otro";
}

export function mimeForExt(ext: string): string {
  return EXT_MIME[ext.toLowerCase()] ?? "application/octet-stream";
}

export function isAllowedExt(ext: string): boolean {
  return ALLOWED_EXT.has(ext.toLowerCase());
}

export function isImageExt(ext: string): boolean {
  return tipoFromExt(ext) === "imagen";
}

export function isOfficeTipo(tipo: string): boolean {
  return tipo === "word" || tipo === "excel";
}

export function slugify(value: string): string {
  const slug = (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return slug || "documento";
}

export function officeEmbedUrl(url: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    url,
  )}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
