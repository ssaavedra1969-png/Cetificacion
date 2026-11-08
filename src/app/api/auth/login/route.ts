import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticate, toPublicUser } from "@/lib/users";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresá email y contraseña" },
        { status: 400 },
      );
    }

    const user = await authenticate(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 },
      );
    }

    const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
    const token = await signSession({
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      plantas: user.plantas,
      exp,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true, user: toPublicUser(user) });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
