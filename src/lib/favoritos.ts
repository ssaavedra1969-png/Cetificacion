export const FAV_KEY = "sgc_favoritos";

export function getFavoritos(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setFavoritos(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function toggleFavorito(id: string): string[] {
  const cur = getFavoritos();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  setFavoritos(next);
  return next;
}
