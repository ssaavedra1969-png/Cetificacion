import { NextResponse } from "next/server";
import type { Documento } from "@/types/models";
import { readDocumentos } from "@/lib/storage";
import { saveDocumentos } from "@/lib/persist";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const data = await readDocumentos();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      documentos?: Documento[];
      categorias?: string[];
      metadata?: unknown;
    };

    if (!Array.isArray(body.documentos)) {
      return NextResponse.json(
        { error: "Formato inválido: falta el arreglo de documentos" },
        { status: 400 },
      );
    }

    const result = await saveDocumentos({
      documentos: body.documentos,
      categorias: body.categorias ?? [],
      metadata: body.metadata ?? {},
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
