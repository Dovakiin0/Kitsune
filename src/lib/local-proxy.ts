export const LOCAL_PROXY_BASE_URL =
  process.env.NEXT_PUBLIC_LOCAL_PROXY_URL || "http://127.0.0.1:43210";

export const COMPANION_UI_URL = `${LOCAL_PROXY_BASE_URL}/ui`;

export const COMPANION_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_COMPANION_RELEASE_URL ||
  "https://github.com/dovakiin0/Kitsune/releases/latest";

let cachedStatus: { active: boolean; checkedAt: number } | null = null;
let inflightProbe: Promise<boolean> | null = null;
const PROBE_TTL_MS = 30_000;

export async function detectLocalProxy(force: boolean = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!force && cachedStatus && Date.now() - cachedStatus.checkedAt < PROBE_TTL_MS) {
    return cachedStatus.active;
  }

  if (inflightProbe) return inflightProbe;

  inflightProbe = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 400);
    try {
      const res = await fetch(`${LOCAL_PROXY_BASE_URL}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      const active = res.ok;
      cachedStatus = { active, checkedAt: Date.now() };
      return active;
    } catch {
      cachedStatus = { active: false, checkedAt: Date.now() };
      return false;
    } finally {
      clearTimeout(timer);
      inflightProbe = null;
    }
  })();

  return inflightProbe;
}

export function isLocalProxyActive(): boolean {
  return Boolean(cachedStatus?.active);
}

export async function resolveApiEndpoint(path: string): Promise<string> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  await detectLocalProxy();
  return `/api${cleanPath}`;
}

export function buildStreamProxyUrl(options: {
  url: string;
  referer?: string;
  headers?: Record<string, string>;
  playlistKey?: string;
}): string {
  const proxyBase = isLocalProxyActive()
    ? `${LOCAL_PROXY_BASE_URL}/proxy`
    : "/api/proxy";

  const params = new URLSearchParams();
  params.set("url", options.url);
  if (options.referer) {
    params.set("referer", options.referer);
  }
  if (options.headers && Object.keys(options.headers).length > 0) {
    params.set("headers", JSON.stringify(options.headers));
  }
  if (options.playlistKey) {
    params.set("playlist_key", options.playlistKey);
  }
  return `${proxyBase}?${params.toString()}`;
}

