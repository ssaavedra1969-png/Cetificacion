import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  HttpError,
  createDocumento,
  deleteDocumento,
  getDocumentos,
  updateDocumento,
  type DocumentoSession,
} from "@/lib/documentos";

function sessionData(
  session: Awaited<ReturnType<typeof getSession>>,
): DocumentoSession | null {
  if (!session) return null;
  return {
    nombre: session.nombre,
    rol: session.rol,
    plantas: session.plantas,
  };
}

function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Error desconocido" },
    { status: 500 },
  );
}

export async function GET() {
  try {
    return NextResponse.json(await getDocumentos());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const session = sessionData(await getSession());
    const result = await createDocumento(form, session);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const form = await request.formData();
    const id = form.get("id");
    if (typeof id !== "string" || !id.trim()) {
      throw new HttpError(400, "Falta el id del documento");
    }
    const session = sessionData(await getSession());
    const result = await updateDocumento(id.trim(), form, session);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new HttpError(400, "Falta el id del documento");
    }
    const session = sessionData(await getSession());
    const result = await deleteDocumento(id, session);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
