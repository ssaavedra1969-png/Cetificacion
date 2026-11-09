import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticate, toPublicUser } from "@/lib/users";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      usuario?: string;
      email?: string;
      password?: string;
    };
    const identifier = (body.usuario ?? body.email ?? "").trim();
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Ingresá usuario y contraseña" },
        { status: 400 },
      );
    }

    const user = await authenticate(identifier, password);
    if (!user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
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
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Error interno"
            : error instanceof Error
              ? error.message
              : "Error interno",
      },
      { status: 500 },
    );
  }
}
