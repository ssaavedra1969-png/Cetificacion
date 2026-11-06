import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveSharedPath, mimeForExt } from "@/lib/files";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p = searchParams.get("p");
  const download = searchParams.get("download") === "1";

  if (!p) {
    return NextResponse.json(
      { error: "Falta el parámetro 'p' con la ruta del archivo" },
      { status: 400 },
    );
  }

  let resolved;
  try {
    resolved = resolveSharedPath(p);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ruta inválida" },
      { status: 400 },
    );
  }

  try {
    const stat = await fs.stat(resolved.absolutePath);
    if (!stat.isFile()) {
      return NextResponse.json(
        { error: "La ruta no es un archivo" },
        { status: 404 },
      );
    }

    const total = stat.size;
    const mime = mimeForExt(resolved.ext);
    const filename = encodeURIComponent(path.basename(resolved.absolutePath));
    const baseHeaders: Record<string, string> = {
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, max-age=60",
    };

    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : total - 1;

        if (start >= total) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${total}` },
          });
        }

        const safeEnd = Math.min(end, total - 1);
        const length = safeEnd - start + 1;
        const buffer = Buffer.alloc(length);
        const handle = await fs.open(resolved.absolutePath, "r");
        try {
          await handle.read(buffer, 0, length, start);
        } finally {
          await handle.close();
        }

        return new NextResponse(new Uint8Array(buffer), {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Length": String(length),
            "Content-Range": `bytes ${start}-${safeEnd}/${total}`,
          },
        });
      }
    }

    const data = await fs.readFile(resolved.absolutePath);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(total) },
    });
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return NextResponse.json(
        {
          error:
            "Archivo no encontrado en el compartido. Verificá la ruta y el acceso de red del servidor.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error leyendo el archivo",
      },
      { status: 500 },
    );
  }
}