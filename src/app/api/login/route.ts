import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "falpat-admin-2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("sgc-auth", "autenticado", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return NextResponse.json({ success: true, redirect: "/administracion" });
    } else {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
