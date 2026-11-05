import { NextResponse } from "next/server";
import type { PuntoSGC } from "@/types/models";
import { readAgenda } from "@/lib/storage";
import { saveAgenda } from "@/lib/persist";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const data = await readAgenda();
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
      puntos?: PuntoSGC[];
      metadata?: unknown;
    };

    if (!Array.isArray(body.puntos)) {
      return NextResponse.json(
        { error: "Formato inválido: falta el arreglo de puntos" },
        { status: 400 },
      );
    }

    const result = await saveAgenda({
      puntos: body.puntos,
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
