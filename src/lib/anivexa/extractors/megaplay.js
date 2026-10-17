import crypto from "node:crypto";
import vm from "node:vm";

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function decodeScriptString(value) {
  return value.replace(/\\u([\dA-Fa-f]{4})|\\x([\dA-Fa-f]{2})|\\([\\'"bnfrtv0])/g, (_, unicode, hex, escaped) => {
    if (unicode) return String.fromCharCode(Number.parseInt(unicode, 16));
    if (hex) return String.fromCharCode(Number.parseInt(hex, 16));
    return { b: "\b", n: "\n", f: "\f", r: "\r", t: "\t", v: "\v", 0: "\0" }[escaped] ?? escaped;
  });
}

function getScriptStrings(script) {
  const strings = [];
  let index = 0;
  let previous = "";
  while (index < script.length) {
    const char = script[index];
    if (char === "/" && script[index + 1] === "/") {
      index = script.indexOf("\n", index + 2);
      if (index < 0) break;
      continue;
    }
    if (char === "/" && script[index + 1] === "*") {
      index = script.indexOf("*/", index + 2);
      if (index < 0) break;
      index += 2;
      continue;
    }
    if (char === "/" && /[=(:,[!&|?{};]/.test(previous)) {
      index++;
      let inClass = false;
      while (index < script.length) {
        if (script[index] === "\\") {
          index += 2;
          continue;
        }
        if (script[index] === "[") inClass = true;
        if (script[index] === "]") inClass = false;
        if (script[index] === "/" && !inClass) {
          index++;
          while (/[a-z]/i.test(script[index] ?? "")) index++;
          break;
        }
        index++;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      const quote = char;
      let value = "";
      index++;
      while (index < script.length && script[index] !== quote) {
        if (script[index] === "\\" && index + 1 < script.length) value += script[index++];
        value += script[index++];
      }
      strings.push(decodeScriptString(value));
      index++;
      continue;
    }
    if (char === "`") {
      index++;
      while (index < script.length && script[index] !== "`") index += script[index] === "\\" ? 2 : 1;
      index++;
      continue;
    }
    if (!/\s/.test(char)) previous = char;
    index++;
  }
  return [...new Set(strings)];
}

function getMegaPlayRoutes(script) {
  const routes = getScriptStrings(script)
    .filter((value) => /^stream\/getSources[\w/-]*$/i.test(value))
    .sort((left, right) => left.length - right.length);
  const legacy = routes[0] ?? null;
  const modern = routes.find((route) => route !== legacy && route.startsWith(legacy)) ?? null;
  return { legacy, modern };
}

function decryptMegaPlaySource(value, script) {
  if (!value) return null;
  const encrypted = Buffer.from(value, "base64url");
  if (!encrypted.length || encrypted.length % 16) return null;
  const values = getScriptStrings(script).filter((item) => Buffer.byteLength(item) > 0 && Buffer.byteLength(item) <= 32);
  const ivs = values.filter((item) => Buffer.byteLength(item) === 16);
  for (const keyValue of values) {
    const key = Buffer.alloc(32);
    Buffer.from(keyValue).copy(key);
    for (const ivValue of ivs) {
      try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(ivValue));
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        const data = JSON.parse(decrypted.toString("utf8"));
        const source = data?.file ?? data?.url ?? data?.sources?.file ?? data?.sources?.[0]?.file;
        if (typeof source === "string" && source) return source;
      } catch {}
    }
  }
  return null;
}

function getMegaPlaySigningKey(script) {
  const objectName = script.match(/\blet\s+([A-Za-z_$][\w$]*)\s*;\s*!\s*function\s*\(\)\s*\{/i)?.[1];
  const entry = script.match(/\bconst\s+[A-Za-z_$][\w$]*\s*=\s*new URLSearchParams\b/);
  if (!objectName || !entry) return null;

  const encoderIndex = script.indexOf("new TextEncoder();return");
  if (encoderIndex < 0) return null;

  const keyVar = script
    .slice(encoderIndex, encoderIndex + 1600)
    .match(/new TextEncoder\(\);return[\s\S]{0,1200}?\]\(([A-Za-z_$][\w$]*)\),\{/i)?.[1];
  if (!keyVar) return null;

  const keyExpression = script.match(
    new RegExp(`(?:const|let|var)\\s+${keyVar}\\s*=\\s*(${objectName}\\.[A-Za-z_$][\\w$]*\\(\\d+\\))`)
  )?.[1];
  if (!keyExpression) return null;

  try {
    const context = { console, decodeURI, encodeURI, Math, String, Array, Object, RegExp, Error, SyntaxError };
    context.globalThis = context;
    vm.runInNewContext(
      `${script.slice(0, entry.index)};globalThis.__megaPlaySigningKey=${keyExpression};`,
      context,
      { timeout: 5000 }
    );
    return typeof context.__megaPlaySigningKey === "string" ? context.__megaPlaySigningKey : null;
  } catch {
    return null;
  }
}

function signMegaPlayUrl(value, signingKey) {
  if (!value || !signingKey || /[?&]token=/i.test(value)) return value;
  const match = String(value).match(/\/([a-f0-9]{32})\/([a-f0-9]{32})\//i);
  if (!match) return value;

  const pathKey = `${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
  const payload = `${Math.floor(Date.now() / 1000) + 90}|${pathKey}`;
  const signature = crypto.createHmac("sha256", signingKey).update(payload).digest("base64url");
  const token = `${Buffer.from(payload).toString("base64url")}.${signature}`;
  const endpoint = new URL(value);
  endpoint.searchParams.set("token", token);
  return endpoint.href;
}

function buildSourceUrl(origin, path, fileId) {
  const endpoint = new URL(path, origin);
  endpoint.searchParams.append("id", fileId);
  endpoint.searchParams.append("id", fileId);
  return endpoint;
}

async function fetchText(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) throw new Error(`MegaPlay HTTP ${response.status}: ${url}`);
  return response.text();
}

async function fetchJson(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) throw new Error(`MegaPlay HTTP ${response.status}: ${url}`);
  return response.json();
}

export function canExtractMegaPlay(url) {
  return /megaplay\.[^/]+\/stream\//i.test(String(url));
}

export async function extractMegaPlayDetails(embedUrl, { fetchImpl = fetch, userAgent = DEFAULT_USER_AGENT, referer } = {}) {
  const pageUrl = new URL(String(embedUrl));
  const pageHeaders = {
    "User-Agent": userAgent,
    "Accept": "text/html,*/*",
    "Referer": referer ?? `${pageUrl.origin}/`,
  };
  const pageHtml = await fetchText(fetchImpl, pageUrl, pageHeaders);
  const fileId = pageHtml.match(/data-id=["']([^"']+)["']/i)?.[1];
  if (!fileId) throw new Error(`MegaPlay file id not found: ${embedUrl}`);
  const scriptUrls = [...pageHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => new URL(match[1], pageUrl).href);
  const scripts = await Promise.all(scriptUrls.map(async (url) => {
    try { return await fetchText(fetchImpl, url, { "User-Agent": userAgent, "Referer": pageUrl.href }); } catch { return null; }
  }));
  const script = scripts.find((value) => /getSources/i.test(value) && /AES-CBC/i.test(value));
  const signingScript = scripts.find((value) => value.includes("[a-f0-9]{32}") && value.includes("token="));
  if (!script) throw new Error(`MegaPlay client script not found: ${embedUrl}`);
  const { legacy, modern } = getMegaPlayRoutes(script);
  if (!legacy && !modern) throw new Error(`MegaPlay source routes not found: ${embedUrl}`);
  const sourceHeaders = {
    "User-Agent": userAgent,
    "Accept": "application/json,*/*",
    "Referer": pageUrl.href,
    "X-Requested-With": "XMLHttpRequest",
  };
  const [modernData, legacyData] = await Promise.all([
    modern ? fetchJson(fetchImpl, buildSourceUrl(pageUrl.origin, modern, fileId), sourceHeaders).catch(() => null) : null,
    legacy ? fetchJson(fetchImpl, buildSourceUrl(pageUrl.origin, legacy, fileId), sourceHeaders).catch(() => null) : null,
  ]);
  const signingKey = signingScript ? getMegaPlaySigningKey(signingScript) : null;
  const modernUrl = signMegaPlayUrl(
    modernData?.sources?.file ?? decryptMegaPlaySource(modernData?.enc, script),
    signingKey
  );
  const legacyUrl = signMegaPlayUrl(
    legacyData?.sources?.file ?? decryptMegaPlaySource(legacyData?.enc, script),
    signingKey
  );
  const sources = [
    modernUrl ? { url: modernUrl, variant: "modern" } : null,
    legacyUrl ? { url: legacyUrl, variant: "legacy" } : null,
  ].filter((source, index, all) => source && all.findIndex((candidate) => candidate?.url === source.url) === index);
  if (!sources.length) throw new Error(`MegaPlay response has no sources: ${embedUrl}`);
  const metadata = modernData ?? legacyData ?? {};
  return {
    origin: pageUrl.origin,
    sources,
    tracks: Array.isArray(metadata.tracks) ? metadata.tracks : [],
    intro: metadata.intro ?? null,
    outro: metadata.outro ?? null,
  };
}

export async function extractMegaPlay(embedUrl, options = {}) {
  const details = await extractMegaPlayDetails(embedUrl, options);
  return details.sources.map((source) => source.url);
}
