import { NextResponse } from "next/server";
import type { PuntoSGC } from "@/types/models";
import { readAgenda, writeAgenda } from "@/lib/storage";

export async function GET() {
  try {
    const data = await readAgenda();
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
    await writeAgenda(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}