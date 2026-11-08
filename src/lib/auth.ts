import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySession,
  type Rol,
  type SessionPayload,
} from "./session";

export { SESSION_COOKIE };
export type { Rol, SessionPayload };

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function hasRole(...roles: Rol[]): Promise<boolean> {
  const session = await getSession();
  return Boolean(session && roles.includes(session.rol));
}

export async function canEditPlanta(planta: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.rol === "admin") return true;
  if (session.rol !== "editor") return false;
  return (
    session.plantas.includes(planta) ||
    session.plantas.includes("General") ||
    planta === "General"
  );
}
