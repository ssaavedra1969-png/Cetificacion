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
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function putFile(
  path: string,
  content: string,
  message: string,
): Promise<void> {
  if (!githubConfigured()) {
    throw new Error("GitHub no configurado (falta GITHUB_TOKEN o GITHUB_REPO)");
  }

  const existing = await getFile(path);
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
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
