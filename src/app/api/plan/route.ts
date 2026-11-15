import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPlan, updatePlan, type PlanSession } from "@/lib/plan-service";
import { HttpError } from "@/lib/documentos";

function sessionData(
  session: Awaited<ReturnType<typeof getSession>>,
): PlanSession | null {
  if (!session) return null;
  return { nombre: session.nombre, rol: session.rol };
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
    return NextResponse.json(await getPlan());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const session = sessionData(await getSession());
    const result = await updatePlan(body, session);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
