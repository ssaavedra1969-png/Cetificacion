import { NextResponse } from "next/server";
import type { Documento } from "@/types/models";
import { readDocumentos, writeDocumentos } from "@/lib/storage";

export async function GET() {
  try {
    const data = await readDocumentos();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await writeDocumentos(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}