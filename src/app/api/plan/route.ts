import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { githubConfigured, getJSON } from "@/lib/github";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET() {
  if (
    (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") &&
    githubConfigured()
  ) {
    try {
      const data = await getJSON<unknown>("data/plan.json");
      if (data) return NextResponse.json(data);
    } catch {
      // caer al filesystem empaquetado
    }
  }

  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "plan.json"), "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar el plan de trabajo" },
      { status: 500 },
    );
  }
}
