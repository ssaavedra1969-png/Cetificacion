import { NextResponse } from "next/server";
import path from "path";
import { isAuthenticated } from "@/lib/auth";
import { readAgenda, readDocumentos } from "@/lib/storage";
import { saveAgenda, saveDocumentos } from "@/lib/persist";
import {
  isHttpUrl,
  resolveSharedPath,
  sharedStreamUrl,
  tipoFromExt,
} from "@/lib/files";
import type { Documento } from "@/types/models";

interface AnexarBody {
  puntoId?: string;
  nombre?: string;
  categoria?: string;
  version?: string;
  responsable?: string;
  descripcion?: string;
  ruta?: string;
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AnexarBody;
    const puntoId = (body.puntoId ?? "").trim();
    const nombre = (body.nombre ?? "").trim();
    const ruta = (body.ruta ?? "").trim();

    if (!puntoId) {
      return NextResponse.json(
        { error: "Falta el tema (puntoId)" },
        { status: 400 },
      );
    }
    if (!nombre) {
      return NextResponse.json(
        { error: "Ingresá un nombre para el documento" },
        { status: 400 },
      );
    }
    if (!ruta) {
      return NextResponse.json(
        { error: "Ingresá la ruta o URL del archivo" },
        { status: 400 },
      );
    }

    const agenda = await readAgenda();
    const punto = agenda.puntos.find((p) => p.id === puntoId);
    if (!punto) {
      return NextResponse.json(
        { error: "El tema indicado no existe" },
        { status: 404 },
      );
    }

    let archivoUrl: string;
    let tipo: Documento["tipo"];
    const rutaGuardada = ruta;

    if (isHttpUrl(ruta)) {
      archivoUrl = ruta;
      let ext = "";
      try {
        ext = path.extname(new URL(ruta).pathname).toLowerCase();
      } catch {
        ext = "";
      }
      tipo = tipoFromExt(ext);
      if (tipo === "otro") tipo = "pdf";
    } else {
      const resolved = resolveSharedPath(ruta);
      archivoUrl = sharedStreamUrl(resolved.relativePath);
      tipo = tipoFromExt(resolved.ext);
    }

    const docsData = await readDocumentos();
    const documento: Documento = {
      id: Date.now().toString(),
      nombre,
      categoria: (body.categoria ?? "").trim() || punto.categoria || "General",
      puntoId,
      planta: punto.plantas?.[0] ?? "General",
      fecha: new Date().toISOString().split("T")[0],
      version: (body.version ?? "").trim() || "1.0",
      responsable:
        (body.responsable ?? "").trim() || punto.responsable || "A definir",
      descripcion: (body.descripcion ?? "").trim(),
      archivoUrl,
      ruta: rutaGuardada,
      tipo,
    };

    const documentos = [...(docsData.documentos ?? []), documento];
    const categorias = [...(docsData.categorias ?? [])];
    if (documento.categoria && !categorias.includes(documento.categoria)) {
      categorias.push(documento.categoria);
    }

    await saveDocumentos({
      documentos,
      categorias,
      metadata: docsData.metadata ?? {},
    });

    punto.documentosIds = Array.from(
      new Set([...(punto.documentosIds ?? []), documento.id]),
    );
    punto.fechaActualizacion = new Date().toISOString();
    punto.historial = punto.historial ?? [];
    punto.historial.push({
      fecha: new Date().toISOString(),
      usuario: "admin",
      campo: "documentos",
      valorAnterior: "",
      valorNuevo: `${documento.nombre} (${documento.id})`,
    });

    await saveAgenda({ puntos: agenda.puntos, metadata: agenda.metadata });

    return NextResponse.json({ success: true, documento });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al anexar documento",
      },
      { status: 400 },
    );
  }
}