import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Usuario } from "@/types/models";
import { githubConfigured, getJSON, putJSON } from "./github";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_PATH = "data/usuarios.json";
const isVercel = process.env.VERCEL === "1";

export interface UsuariosData {
  usuarios: Usuario[];
  metadata?: Record<string, unknown>;
}

export async function readUsuarios(): Promise<UsuariosData> {
  if (isVercel && githubConfigured()) {
    try {
      const data = await getJSON<UsuariosData>(USERS_PATH);
      if (data) return data;
    } catch {
      // caer al archivo empaquetado
    }
  }

  const raw = await fs.readFile(path.join(DATA_DIR, "usuarios.json"), "utf-8");
  return JSON.parse(raw) as UsuariosData;
}

export async function writeUsuarios(
  data: UsuariosData,
): Promise<{ local: boolean; remote: boolean }> {
  let local = false;
  try {
    await fs.writeFile(
      path.join(DATA_DIR, "usuarios.json"),
      JSON.stringify(data, null, 2),
      "utf-8",
    );
    local = true;
  } catch {
    local = false;
  }

  const shouldRemote =
    githubConfigured() && (!local || process.env.NODE_ENV === "production");

  if (shouldRemote) {
    await putJSON(USERS_PATH, data, "SGC: actualizar usuarios");
  }

  if (!local && !shouldRemote) {
    throw new Error(
      "No se pudo guardar: almacenamiento local no disponible y GitHub no configurado.",
    );
  }

  return { local, remote: shouldRemote };
}

export function hashPassword(
  password: string,
  salt = randomBytes(16).toString("hex"),
): { salt: string; hash: string } {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(
  password: string,
  salt: string,
  hash: string,
): boolean {
  try {
    const computed = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return (
      computed.length === expected.length && timingSafeEqual(computed, expected)
    );
  } catch {
    return false;
  }
}

export async function authenticate(
  identifier: string,
  password: string,
): Promise<Usuario | null> {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized || !password) return null;

  const data = await readUsuarios();
  const user = data.usuarios.find(
    (u) =>
      u.activo &&
      (u.usuario?.toLowerCase() === normalized ||
        u.email.toLowerCase() === normalized),
  );
  if (!user) return null;
  if (!verifyPassword(password, user.salt, user.passwordHash)) return null;

  return user;
}

export type PublicUser = Pick<
  Usuario,
  "id" | "email" | "nombre" | "rol" | "plantas"
>;

export function toPublicUser(user: Usuario): PublicUser {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    plantas: user.plantas,
  };
}
