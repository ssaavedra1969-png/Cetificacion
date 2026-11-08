const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

export function githubConfigured(): boolean {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO);
}

function apiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "portal-sgc",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export interface GithubFile {
  content: string;
  sha: string;
}

export interface GithubMeta {
  sha: string;
  size: number;
  downloadUrl?: string;
}

export async function getFileMeta(path: string): Promise<GithubMeta | null> {
  if (!githubConfigured()) return null;

  const res = await fetch(`${apiUrl(path)}?ref=${GITHUB_BRANCH}`, {
    headers: headers(),
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path}: ${res.status}`);
  }

  const data = await res.json();
  return {
    sha: data.sha,
    size: typeof data.size === "number" ? data.size : 0,
    downloadUrl: data.download_url,
  };
}

export async function getFile(path: string): Promise<GithubFile | null> {
  if (!githubConfigured()) return null;

  const res = await fetch(`${apiUrl(path)}?ref=${GITHUB_BRANCH}`, {
    headers: headers(),
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path}: ${res.status}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content || "", "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function getBinaryFile(path: string): Promise<Buffer | null> {
  if (!githubConfigured()) return null;

  const res = await fetch(`${apiUrl(path)}?ref=${GITHUB_BRANCH}`, {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.raw",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path}: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function putContent(
  path: string,
  base64: string,
  message: string,
): Promise<void> {
  if (!githubConfigured()) {
    throw new Error("GitHub no configurado (falta GITHUB_TOKEN o GITHUB_REPO)");
  }

  const existing = await getFileMeta(path);
  const body: Record<string, unknown> = {
    message,
    content: base64,
    branch: GITHUB_BRANCH,
  };
  if (existing?.sha) body.sha = existing.sha;

  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub PUT ${path}: ${res.status} ${detail}`);
  }
}

export async function putFile(
  path: string,
  content: string,
  message: string,
): Promise<void> {
  await putContent(
    path,
    Buffer.from(content, "utf-8").toString("base64"),
    message,
  );
}

export async function putBinaryFile(
  path: string,
  content: Buffer,
  message: string,
): Promise<void> {
  await putContent(path, content.toString("base64"), message);
}

export async function deleteFile(
  path: string,
  message: string,
): Promise<boolean> {
  if (!githubConfigured()) return false;

  const existing = await getFileMeta(path);
  if (!existing) return false;

  const res = await fetch(apiUrl(path), {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sha: existing.sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok && res.status !== 404) {
    const detail = await res.text();
    throw new Error(`GitHub DELETE ${path}: ${res.status} ${detail}`);
  }
  return true;
}

export async function getJSON<T>(path: string): Promise<T | null> {
  const file = await getFile(path);
  if (!file) return null;
  return JSON.parse(file.content) as T;
}

export async function putJSON(
  path: string,
  data: unknown,
  message: string,
): Promise<void> {
  await putFile(path, JSON.stringify(data, null, 2), message);
}
