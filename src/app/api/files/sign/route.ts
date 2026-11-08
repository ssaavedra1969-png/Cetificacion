import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDocumentos } from "@/lib/storage";
import { createFileToken } from "@/lib/signing";

const TTL_SECONDS = 600;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let id = "";
  try {
    const body = (await request.json()) as { id?: unknown };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    id = "";
  }

  if (!id) {
    return NextResponse.json(
      { error: "Falta el id del documento" },
      { status: 400 },
    );
  }

  const data = await readDocumentos();
  const doc = (data.documentos ?? []).find((item) => item.id === id);
  if (!doc || !doc.ruta) {
    return NextResponse.json(
      { error: "Documento no encontrado" },
      { status: 404 },
    );
  }

  const token = await createFileToken(doc.ruta, TTL_SECONDS);
  const origin = new URL(request.url).origin;
  const url = `${origin}/api/files?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;

  return NextResponse.json({ url, expiresIn: TTL_SECONDS });
}
