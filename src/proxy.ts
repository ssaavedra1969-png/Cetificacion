import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (pathname.startsWith("/administracion")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.rol === "lector") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (
    MUTATING_METHODS.has(request.method) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/")
  ) {
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (
      session.rol === "lector" &&
      (pathname.startsWith("/api/agenda") ||
        pathname.startsWith("/api/documentos"))
    ) {
      return NextResponse.json(
        { error: "No tenés permisos para modificar datos" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/administracion/:path*", "/api/:path*"],
};
