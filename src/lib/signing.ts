import { bytesToBase64Url, getAuthSecret } from "./session";

const encoder = new TextEncoder();

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createFileToken(
  ruta: string,
  ttlSeconds = 600,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + Math.max(30, ttlSeconds);
  const signature = await sign(`${ruta}:${exp}`);
  return `${exp}.${signature}`;
}

export async function verifyFileToken(
  ruta: string,
  token: string,
): Promise<boolean> {
  const [expRaw, signature] = (token || "").split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now() || !signature) {
    return false;
  }

  const expected = await sign(`${ruta}:${exp}`);
  if (signature.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < signature.length; i += 1) {
    diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
