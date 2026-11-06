export function normalizeUrl(url: string): string {
  const match = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i,
  );
  if (match) {
    return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
  }
  return url;
}

export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url.split("?")[0]);
}

export function downloadUrl(url: string): string {
  if (!url.startsWith("/api/files")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}