import { NextResponse } from "next/server";
import path from "path";
import { readDocumentos } from "@/lib/storage";
import { readDocumentoFile } from "@/lib/doc-files";
import { extFromName, mimeForExt, tipoFromExt } from "@/lib/files";
import { verifyFileToken } from "@/lib/signing";

function parseRange(
  header: string | null,
  total: number,
): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const startRaw = match[1];
  const endRaw = match[2];

  if (!startRaw && !endRaw) return null;

  let start: number;
  let end: number;

  if (!startRaw) {
    const suffix = parseInt(endRaw, 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = parseInt(startRaw, 10);
    end = endRaw ? parseInt(endRaw, 10) : total - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start >= total) return { start: total, end: total - 1 };
  if (start > end) return null;

  return { start, end: Math.min(end, total - 1) };
}

async function resolveRuta(
  searchParams: URLSearchParams,
): Promise<{ ruta: string; nombre: string; externo?: string } | null> {
  const id = searchParams.get("id");
  const p = searchParams.get("p");

  if (id) {
    const data = await readDocumentos();
    const doc = (data.documentos ?? []).find((item) => item.id === id);
    if (!doc) return null;

    if (doc.ruta) {
      return { ruta: doc.ruta, nombre: doc.nombre };
    }

    if (/^https?:\/\//i.test(doc.archivoUrl)) {
      return { ruta: "", nombre: doc.nombre, externo: doc.archivoUrl };
    }

    const match = /[?&]p=([^&]+)/.exec(doc.archivoUrl || "");
    if (match) {
      const decoded = decodeURIComponent(match[1]);
      return {
        ruta: decoded,
        nombre: path.posix.basename(decoded) || doc.nombre,
      };
    }

    return null;
  }

  if (p) {
    return { ruta: p, nombre: path.posix.basename(p) };
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";
  const token = searchParams.get("token");

  let resuelto: Awaited<ReturnType<typeof resolveRuta>>;
  try {
    resuelto = await resolveRuta(searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }

  if (!resuelto) {
    return NextResponse.json(
      { error: "Documento no encontrado" },
      { status: 404 },
    );
  }

  if (resuelto.externo) {
    return NextResponse.redirect(resuelto.externo);
  }

  if (token && !(await verifyFileToken(resuelto.ruta, token))) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = (await readDocumentoFile(resuelto.ruta)).data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error leyendo el archivo";
    const invalida = /inválida/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: invalida ? 400 : 404 },
    );
  }

  const ext =
    extFromName(resuelto.ruta) || extFromName(resuelto.nombre);
  const tipo = tipoFromExt(ext);
  const total = data.length;
  const nombreArchivo = resuelto.nombre.includes(".")
    ? resuelto.nombre
    : `${resuelto.nombre}${ext}`;
  const filename = encodeURIComponent(nombreArchivo);
  const adjuntar = download || tipo === "otro";

  const headers: Record<string, string> = {
    "Content-Type": mimeForExt(ext),
    "Accept-Ranges": "bytes",
    "Content-Disposition": `${adjuntar ? "attachment" : "inline"}; filename*=UTF-8''${filename}`,
    "Cache-Control": "private, max-age=60",
  };

  const range = parseRange(request.headers.get("range"), total);

  if (range && range.start >= total) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  if (range) {
    const length = range.end - range.start + 1;
    return new NextResponse(new Uint8Array(data.subarray(range.start, range.end + 1)), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(length),
        "Content-Range": `bytes ${range.start}-${range.end}/${total}`,
      },
    });
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: { ...headers, "Content-Length": String(total) },
  });
}
