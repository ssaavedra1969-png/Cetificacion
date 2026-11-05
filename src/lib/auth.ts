import { cookies } from "next/headers";

export const SESSION_COOKIE = "sgc-auth";
export const SESSION_VALUE = "autenticado";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
