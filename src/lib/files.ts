import path from "path";

const ALLOWED_EXT = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);

export type TipoArchivo = "pdf" | "imagen" | "otro";

export function getShareRoot(): string {
  const configured = process.env.SGC_SHARE_ROOT;
  if (configured && configured.trim()) return path.resolve(configured);
  return path.resolve(process.cwd(), "compartido");
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function tipoFromExt(ext: string): TipoArchivo {
  const e = ext.toLowerCase();
  if (e === ".pdf") return "pdf";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(e)) {
    return "imagen";
  }
  return "otro";
}

export interface ResolvedFile {
  absolutePath: string;
  relativePath: string;
  ext: string;
}

export function resolveSharedPath(input: string): ResolvedFile {
  let value = (input ?? "").trim();
  if (!value) throw new Error("La ruta está vacía");

  if (value.startsWith("file://")) value = value.slice("file://".length);
  value = value.replace(/\//g, path.sep);

  const root = getShareRoot();
  const absolute = path.isAbsolute(value)
    ? path.normalize(value)
    : path.resolve(root, value);

  const relative = path.relative(root, absolute);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      "La ruta debe estar dentro del compartido configurado (SGC_SHARE_ROOT)",
    );
  }

  const ext = path.extname(absolute).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("Tipo de archivo no permitido (solo PDF o imágenes)");
  }

  return {
    absolutePath: absolute,
    relativePath: relative.split(path.sep).join("/"),
    ext,
  };
}

export function sharedStreamUrl(relativePath: string): string {
  return `/api/files?p=${encodeURIComponent(relativePath)}`;
}

export function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}