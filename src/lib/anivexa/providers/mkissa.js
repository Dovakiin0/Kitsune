import crypto from "node:crypto";
import { wreqFetch } from "../core/wreq.js";
import { buildTitleSearchQueries, buildTitles, titleIdentityScore } from "../core/new-provider-utils.js";

const __name = (fn, _) => fn;

const UA4 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
const REFERER = "https://mkissa.to";
const API = "https://api.mkissa.net";
const API_URL = `${API}/api`;
const CDN_ROOT = "https://cdn.mkissa.net/all/mk";
const ANIZIP = "https://api.ani.zip/mappings";
const CONTENT_LANE = "k7";
const REFERER_HOST = "mkissa.to";
const KEY_GROUP = "mkissa";
const BOOT_EPOCH_MS = 604800000;
const BOOT_GRACE_MS = 86400000;
const AA_REQ_MS = 300000;
const WATCH_MEMORY_TTL = 3 * 60 * 60 * 1000;
const DISCOVERY_CONCURRENCY = 16;
const DISCOVERY_LIMIT = 600;
const FETCH_TIMEOUT_MS = 10000;
const EXTRACT_TIMEOUT_MS = 5000;
const MKISSA_WREQ_BROWSER = process.env.MKISSA_WREQ_BROWSER || "chrome_149";
const MKISSA_WREQ_OS = process.env.MKISSA_WREQ_OS || "windows";
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlYjdkMWM0ZTgwMGUzM2FiMmE3Y2I3NDA5YmM4NjQ2YSIsIm5iZiI6MTc3OTUzMDcxOS40MzIsInN1YiI6IjZhMTE3YmRmYTlhNjNlYmFiOWUzYjc4YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Z9pa96oJEyicf6wAoaKGKJd9ldapeiOdktoJd4xcgLo";

const HEX_TABLE = {
  "79": "A", "7a": "B", "7b": "C", "7c": "D", "7d": "E", "7e": "F", "7f": "G",
  "70": "H", "71": "I", "72": "J", "73": "K", "74": "L", "75": "M", "76": "N", "77": "O",
  "68": "P", "69": "Q", "6a": "R", "6b": "S", "6c": "T", "6d": "U", "6e": "V", "6f": "W",
  "60": "X", "61": "Y", "62": "Z", "59": "a", "5a": "b", "5b": "c", "5c": "d", "5d": "e",
  "5e": "f", "5f": "g", "50": "h", "51": "i", "52": "j", "53": "k", "54": "l", "55": "m",
  "56": "n", "57": "o", "48": "p", "49": "q", "4a": "r", "4b": "s", "4c": "t", "4d": "u",
  "4e": "v", "4f": "w", "40": "x", "41": "y", "42": "z", "08": "0", "09": "1", "0a": "2",
  "0b": "3", "0c": "4", "0d": "5", "0e": "6", "0f": "7", "00": "8", "01": "9", "15": "-",
  "16": ".", "67": "_", "46": "~", "02": ":", "17": "/", "07": "?", "1b": "#", "63": "[",
  "65": "]", "78": "@", "19": "!", "1c": "$", "1e": "&", "10": "(", "11": ")", "12": "*",
  "13": "+", "14": ",", "03": ";", "05": "=", "1d": "%"
};

let cryptoConfigCache = null;
let episodeQueryCache = null;
const sessionCookies = new Map();
const watchMemoryCache = new Map();

function decodeHexUrl(hex) {
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const pair = hex.substring(i, i + 2).toLowerCase();
    out += HEX_TABLE[pair] ?? pair;
  }
  return out;
}
__name(decodeHexUrl, "decodeHexUrl");

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
__name(sha256Hex, "sha256Hex");

function hmacBytes(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}
__name(hmacBytes, "hmacBytes");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
__name(sleep, "sleep");

function storeCookies(headers) {
  const raw = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [headers.get("set-cookie")].filter(Boolean);
  for (const value of raw) {
    for (const part of String(value).split(/,(?=[^;,]+=)/)) {
      const pair = part.split(";")[0]?.trim();
      const index = pair?.indexOf("=");
      if (index > 0) sessionCookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }
}
__name(storeCookies, "storeCookies");

function cookieHeader() {
  return [...sessionCookies].map(([key, value]) => `${key}=${value}`).join("; ");
}
__name(cookieHeader, "cookieHeader");

function browserHeaders(headers = {}) {
  const cookie = cookieHeader();
  return {
    "User-Agent": UA4,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Google Chrome\";v=\"151\", \"Chromium\";v=\"151\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    ...(cookie ? { Cookie: cookie } : {}),
    ...headers
  };
}
__name(browserHeaders, "browserHeaders");

function apiHeaders(buildId, headers = {}) {
  return {
    "Referer": `${REFERER}/`,
    "Origin": REFERER,
    "x-build-id": buildId,
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Priority": "u=1, i",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    ...headers
  };
}
__name(apiHeaders, "apiHeaders");

async function sessionFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: browserHeaders(options.headers || {}),
  });
  storeCookies(res.headers);
  return res;
}
__name(sessionFetch, "sessionFetch");

async function apiSessionFetch(url, options = {}) {
  try {
    const res = await wreqFetch(url, {
      ...options,
      warm: [{
        url: `${REFERER}/`,
        headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      }],
      session: "mkissa",
      browser: MKISSA_WREQ_BROWSER,
      os: MKISSA_WREQ_OS,
    });
    storeCookies(res.headers);
    return res;
  } catch (error) {
    if (process.env.MKISSA_WREQ_REQUIRED === "1") throw error;
    return sessionFetch(url, options);
  }
}
__name(apiSessionFetch, "apiSessionFetch");

function absoluteAssetUrl(value, base = CDN_ROOT) {
  return new URL(value, base.endsWith("/") ? base : `${base}/`).toString();
}
__name(absoluteAssetUrl, "absoluteAssetUrl");

function findBalancedBlock(text, start) {
  let depth = 0;
  let seen = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      depth++;
      seen = true;
    } else if (ch === "}") {
      depth--;
      if (seen && depth === 0) return i + 1;
    }
  }
  return -1;
}
__name(findBalancedBlock, "findBalancedBlock");

function findOpeningParen(text, end) {
  let depth = 0;
  for (let i = end; i >= 0; i--) {
    const ch = text[i];
    if (ch === ")") depth++;
    else if (ch === "(" && --depth === 0) return i;
  }
  return -1;
}
__name(findOpeningParen, "findOpeningParen");

function normalizeCryptoConfig(out) {
  if (!out?.buildId || !Array.isArray(out.maskParts) || out.maskParts.length < 4) return null;
  return {
    scheme: "legacy",
    buildId: String(out.buildId),
    maskParts: out.maskParts.slice(0, 4).map(String)
  };
}
__name(normalizeCryptoConfig, "normalizeCryptoConfig");

function functionSource(text, name) {
  const match = new RegExp(`function\\s+${name}\\s*\\(`).exec(text);
  if (!match) return null;
  const start = text.indexOf("{", match.index);
  const end = findBalancedBlock(text, start);
  return end === -1 ? null : text.slice(match.index, end);
}
__name(functionSource, "functionSource");

function findStatementEnd(text, start) {
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let quote = "";
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") parens++;
    else if (ch === ")") parens--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
    else if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === ";" && !parens && !brackets && !braces) return i;
  }
  return -1;
}
__name(findStatementEnd, "findStatementEnd");

function splitTopLevel(text) {
  const out = [];
  let start = 0;
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") parens++;
    else if (ch === ")") parens--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
    else if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "," && !parens && !brackets && !braces) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
}
__name(splitTopLevel, "splitTopLevel");

function declarationStatementAt(text, index) {
  const start = Math.max(text.lastIndexOf("const ", index), text.lastIndexOf("let ", index), text.lastIndexOf("var ", index));
  if (start < 0) return null;
  const end = findStatementEnd(text, start);
  if (end < 0 || index > end) return null;
  const keyword = /^(?:const|let|var)\s+/.exec(text.slice(start));
  if (!keyword) return null;
  const entries = splitTopLevel(text.slice(start + keyword[0].length, end)).map((value) => {
    const entry = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(value);
    return entry ? { name: entry[1], expression: entry[2], start, end } : null;
  }).filter(Boolean);
  return { start, end, entries };
}
__name(declarationStatementAt, "declarationStatementAt");

function templateDependencies(expression) {
  return [...expression.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)\b[^}]*\}/g)].map((match) => match[1]);
}
__name(templateDependencies, "templateDependencies");

function templateDeclaration(chunk, name, before = chunk.length) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...chunk.matchAll(new RegExp(`(?<![A-Za-z0-9_$])${escaped}\\s*=`, "g"))];
  let fallback = null;
  for (const match of matches) {
    const statement = declarationStatementAt(chunk, match.index);
    const entry = statement?.entries.find((value) => value.name === name);
    if (!entry) continue;
    if (!fallback) fallback = entry;
    if (entry.start < before) fallback = entry;
  }
  return fallback;
}
__name(templateDeclaration, "templateDeclaration");

function bootstrapBuildDeclaration(chunk) {
  const matches = [...chunk.matchAll(/\bbuildId\s*:\s*[A-Za-z_$][\w$]*\s*=\s*([A-Za-z_$][\w$]*)\b/g)];
  for (const match of matches) {
    const entry = templateDeclaration(chunk, match[1], match.index);
    if (entry) return entry;
  }
  return null;
}
__name(bootstrapBuildDeclaration, "bootstrapBuildDeclaration");

function previousArrayAndBuildDeclaration(chunk, before) {
  const matches = [...chunk.slice(0, before).matchAll(/\b(?:const|let|var)\s+/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const statement = declarationStatementAt(chunk, matches[i].index + matches[i][0].length);
    if (!statement?.entries.length || statement.start >= before) continue;
    const partsIndex = statement.entries.findIndex((entry) => entry.expression.trim().startsWith("["));
    if (partsIndex < 0) continue;
    const build = statement.entries.find((entry, index) => index < partsIndex && !entry.expression.trim().startsWith("["));
    if (build) return { build, parts: statement.entries[partsIndex] };
  }
  return null;
}
__name(previousArrayAndBuildDeclaration, "previousArrayAndBuildDeclaration");

function validEpisodeQuery(query) {
  return typeof query === "string" &&
    !/[\uD800-\uDFFF]/.test(query) &&
    /\bquery\b/.test(query) &&
    /\bepisode\s*\(\s*showId\s*:\s*\$showId\s+translationType\s*:\s*\$translationType\s+episodeString\s*:\s*\$episodeString\s*\)/.test(query) &&
    !query.includes("${");
}
__name(validEpisodeQuery, "validEpisodeQuery");

function evalEpisodeQueryChunk(chunk) {
  const operation = /\bepisode\s*\(\s*showId\s*:\s*\$showId\s*translationType\s*:\s*\$translationType\s*episodeString\s*:\s*\$episodeString\s*\)/g;
  const operationInExpression = new RegExp(operation.source);
  for (const match of chunk.matchAll(operation)) {
    const statement = declarationStatementAt(chunk, match.index);
    const candidate = statement?.entries.find((entry) => operationInExpression.test(entry.expression));
    if (!candidate) continue;
    const definitions = new Map();
    const resolving = new Set();
    const resolve = (name, before) => {
      if (definitions.has(name) || resolving.has(name)) return;
      const entry = templateDeclaration(chunk, name, before);
      if (!entry) return;
      resolving.add(name);
      for (const dependency of templateDependencies(entry.expression)) resolve(dependency, entry.start);
      resolving.delete(name);
      definitions.set(name, entry);
    };
    resolve(candidate.name, candidate.start + 1);
    try {
      const source = [...definitions.values()].map((entry) => `const ${entry.name}=${entry.expression};`).join("\n");
      const query = Function(`${source}\nreturn ${candidate.name}();`)();
      if (validEpisodeQuery(query)) return query;
    } catch {}
  }
  return null;
}
__name(evalEpisodeQueryChunk, "evalEpisodeQueryChunk");

function evalFragmentCryptoChunk(chunk) {
  for (const match of chunk.matchAll(/\bsaltMul\s*:/g)) {
    const declarationAt = chunk.lastIndexOf("const ", match.index);
    const declarationEnd = declarationAt === -1 ? -1 : findStatementEnd(chunk, declarationAt);
    if (declarationEnd === -1 || match.index > declarationEnd) continue;
    const declarations = splitTopLevel(chunk.slice(declarationAt + 6, declarationEnd)).map((value) => {
      const entry = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(value);
      return entry ? { name: entry[1], expression: entry[2] } : null;
    }).filter(Boolean);
    const configIndex = declarations.findIndex((entry) => /\b(?:saltMul|fragMul)\s*:/.test(entry.expression));
    if (configIndex < 0) continue;
    const previous = previousArrayAndBuildDeclaration(chunk, declarationAt);
    const partsIndex = declarations.slice(0, configIndex).map((entry, index) => ({ entry, index })).reverse().find(({ entry }) => entry.expression.trim().startsWith("["))?.index;
    const build = bootstrapBuildDeclaration(chunk) ?? previous?.build ?? declarations[0];
    const parts = partsIndex === undefined ? previous?.parts : declarations[partsIndex];
    const params = declarations[configIndex];
    if (!build || !parts || !params) continue;
    const expression = `${build.expression};${parts.expression};${params.expression}`;
    const names = new Set([...expression.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map((entry) => entry[1]));
    const helpers = [];
    for (let pass = 0; pass < 8; pass++) {
      let changed = false;
      for (const name of [...names]) {
        if (helpers.some((source) => new RegExp(`function\\s+${name}\\s*\\(`).test(source))) continue;
        const source = functionSource(chunk, name);
        if (!source) continue;
        helpers.push(source);
        for (const reference of source.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
          if (!names.has(reference[1])) {
            names.add(reference[1]);
            changed = true;
          }
        }
      }
      if (helpers.some((source) => /^function\s+[A-Za-z_$][\w$]*\s*\(\)\s*\{const\s+e=\[/.test(source))) break;
      if (!changed) break;
    }
    const tableSource = helpers.find((source) => /^function\s+[A-Za-z_$][\w$]*\s*\(\)\s*\{const\s+e=\[/.test(source)) ?? null;
    const tableName = tableSource?.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/)?.[1] ?? null;
    const tableInitEnd = tableName ? chunk.lastIndexOf(`)(${tableName},`, declarationAt) : -1;
    const tableInitStart = tableInitEnd === -1 ? -1 : findOpeningParen(chunk, tableInitEnd);
    const tableInit = tableInitStart === -1 || tableInitEnd === -1 ? "" : chunk.slice(tableInitStart, chunk.indexOf(";", tableInitEnd) + 1);
    if (!tableSource || !tableInit) continue;
    const source = `${tableSource}\n${tableInit}\n${helpers.filter((helper) => !helper.startsWith(`function ${tableName}`)).join("\n")}\nreturn { buildId: (${build.expression}), maskParts: (${parts.expression}), params: (${params.expression}) };`;
    const out = Function(source)();
    const config = out?.params;
    if (!out?.buildId || !Array.isArray(out.maskParts) || out.maskParts.length < 4 || !config || typeof config !== "object") continue;
    const numeric = ["saltMul", "saltAdd", "fragMul", "fragAdd"];
    if (numeric.some((key) => !Number.isFinite(Number(config[key])))) continue;
    if (!Array.isArray(config.parts) || !config.parts.length || typeof config.bootPrefix !== "string" || typeof config.join !== "string") continue;
    return {
      scheme: "fragments",
      buildId: String(out.buildId),
      maskParts: out.maskParts.slice(0, 4).map(String),
      saltMul: Number(config.saltMul),
      saltAdd: Number(config.saltAdd),
      fragMul: Number(config.fragMul),
      fragAdd: Number(config.fragAdd),
      bootPrefix: config.bootPrefix,
      join: config.join,
      parts: config.parts.map(String),
      omitEmptyLane: Boolean(config.omitEmptyLane)
    };
  }
  return null;
}
__name(evalFragmentCryptoChunk, "evalFragmentCryptoChunk");

function evalOldCryptoChunk(chunk) {
  const cryptoStart = chunk.search(/const\s+[A-Za-z_$][\w$]*\s*=[^;]{0,180}\?"\d+":"",\s*[A-Za-z_$][\w$]*=\[/);
  if (cryptoStart < 0) return null;
  const tableMatches = [...chunk.slice(0, cryptoStart).matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(\)\{const e=\[/g)];
  const tableStart = tableMatches.at(-1)?.index ?? -1;
  const asyncStart = chunk.indexOf("async function", cryptoStart);
  if (tableStart < 0 || asyncStart < 0) return null;
  let code = chunk.slice(tableStart, asyncStart);
  const buildMatch = code.match(/const\s+([A-Za-z_$][\w$]*)\s*=([^;]+?\?"(\d+)":"")\s*,\s*([A-Za-z_$][\w$]*)=\[/);
  if (!buildMatch) return null;
  const buildName = buildMatch[1];
  const maskName = buildMatch[4];
  code = code.replace(new RegExp(`\\b[A-Za-z_$][\\w$]*\\(\\);\\s*const\\s+${buildName}=`), `const ${buildName}=`);
  code = code.replace(new RegExp(`const\\s+${buildName}=`), `var ${buildName}=`);
  code = code.replace(new RegExp(`,\\s*${maskName}=\\[`), `;var ${maskName}=[`);
  code += `\nreturn { buildId: ${buildName}, maskParts: ${maskName} };`;
  return normalizeCryptoConfig(Function(code)());
}
__name(evalOldCryptoChunk, "evalOldCryptoChunk");

function evalModernCryptoChunk(chunk) {
  const cryptoStart = chunk.search(/const\s+[A-Za-z_$][\w$]*\s*=[^;]{0,220}\?"\d+":"",\s*[A-Za-z_$][\w$]*=\[/);
  if (cryptoStart < 0) return null;
  const wrapperMatch = [...chunk.slice(0, cryptoStart).matchAll(/const\s+[A-Za-z_$][\w$]*=\(function\(\)\{/g)].at(-1);
  const wrapperStart = wrapperMatch?.index ?? -1;
  const tableMatch = [...chunk.slice(0, wrapperStart).matchAll(/function\s+[A-Za-z_$][\w$]*\s*\(\)\{const\s+[A-Za-z_$][\w$]*=\[/g)].at(-1);
  const tableStart = tableMatch?.index ?? -1;
  const decoderMatch = [...chunk.slice(0, tableStart).matchAll(/function\s+[A-Za-z_$][\w$]*\s*\([A-Za-z_$][\w$]*(?:,[A-Za-z_$][\w$]*)?\)\{return\s+[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*-\d+,[A-Za-z_$][\w$]*\(\)\[[A-Za-z_$][\w$]*\]\}/g)].at(-1);
  const tiStart = decoderMatch?.index ?? -1;
  const asyncStart = chunk.indexOf("async function", cryptoStart);
  if (tiStart < 0 || wrapperStart < 0 || asyncStart < 0) return null;
  const head = chunk.slice(tiStart, wrapperStart);
  let body = chunk.slice(cryptoStart, asyncStart);
  const buildMatch = body.match(/const\s+([A-Za-z_$][\w$]*)=/);
  const maskMatch = body.match(/,([A-Za-z_$][\w$]*)=\[/);
  const maskFunction = body.match(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*=\s*([A-Za-z_$][\w$]*)\)/);
  if (!buildMatch || !maskMatch || !maskFunction) return null;
  const buildName = buildMatch[1];
  const maskName = maskMatch[1];
  const maskFunctionName = maskFunction[1];
  body = body.replace(new RegExp(`const\\s+${buildName}=`), `var ${buildName}=`);
  body = body.replace(new RegExp(`,${maskName}=\\[`), `;var ${maskName}=[`);
  body += `\nreturn { buildId: ${buildName}, maskParts: ${maskName}, mask: Array.from(${maskFunctionName}(${buildName}) || []) };`;
  return normalizeCryptoConfig(Function(head + body)());
}
__name(evalModernCryptoChunk, "evalModernCryptoChunk");

function evalCryptoChunk(chunk) {
  try {
    const config = evalFragmentCryptoChunk(chunk);
    if (config) return config;
  } catch {}
  try {
    return evalModernCryptoChunk(chunk);
  } catch {}
  try {
    return evalOldCryptoChunk(chunk);
  } catch {}
  return null;
}
__name(evalCryptoChunk, "evalCryptoChunk");

async function fetchText(url, headers = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await sessionFetch(url, {
      signal: ac.signal,
      headers: {
        "Referer": `${REFERER}/`,
        ...headers
      }
    });
    if (!res.ok) throw new Error(`Fetch ${res.status}: ${url}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}
__name(fetchText, "fetchText");

async function fetchWithTimeout(url, options = {}, timeout = EXTRACT_TIMEOUT_MS) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: options.signal || ac.signal });
    storeCookies(res.headers);
    return res;
  } finally {
    clearTimeout(timer);
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");

function appEntryUrl(html) {
  const entry = html.match(/(?:import\(|src=)["']([^"']+\/_app\/immutable\/entry\/app\.[^"']+\.js)["']/)?.[1];
  return entry ? new URL(entry, REFERER).toString() : null;
}
__name(appEntryUrl, "appEntryUrl");

async function discoverCryptoConfig(force = false) {
  try {
    const entryUrl = new URL(`${REFERER}/`);
    if (force) entryUrl.searchParams.set("_mkissa", String(Date.now()));
    const html = await fetchText(entryUrl, {
      Accept: "text/html,*/*",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    });
    const appUrl = appEntryUrl(html);
    if (!appUrl) throw new Error("MKissa app entry not found");
    if (!force && cryptoConfigCache?.appUrl === appUrl) return cryptoConfigCache;
    const app = await fetchText(appUrl, { Accept: "application/javascript,*/*" });
    const queue = [appUrl];
    const seen = new Set();
    while (queue.length && seen.size < DISCOVERY_LIMIT) {
      const batch = queue.splice(0, DISCOVERY_CONCURRENCY).filter((url) => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });
      const chunks = await Promise.all(batch.map(async (url) => {
        try {
          return { url, text: url === appUrl ? app : await fetchText(url, { Accept: "application/javascript,*/*" }) };
        } catch {
          return null;
        }
      }));
      for (const item of chunks.filter(Boolean)) {
        const imported = [
          ...item.text.matchAll(/(?:import\(|from\s*)["']([^"']+\.js)["']/g),
          ...item.text.matchAll(/"(\.\.\/(?:chunks|nodes)\/[^"\n]+\.js)"/g)
        ].map((m) => m[1]).filter((value) => value.startsWith(".") || value.startsWith("/"));
        for (const value of imported) {
          const next = new URL(value, item.url).toString();
          if (!seen.has(next)) queue.push(next);
        }
        if (!/client-crypto|x-aa-boot|aaReq|partB/.test(item.text)) continue;
        const config = evalCryptoChunk(item.text);
        if (config) {
          cryptoConfigCache = { ...config, appUrl, sourceUrl: item.url };
          return cryptoConfigCache;
        }
      }
    }
    throw new Error("MKissa crypto chunk not found");
  } catch (error) {
    cryptoConfigCache = null;
    throw error;
  }
}
__name(discoverCryptoConfig, "discoverCryptoConfig");

async function discoverEpisodeQuery(force = false) {
  const config = await discoverCryptoConfig(force);
  if (!force && episodeQueryCache?.appUrl === config.appUrl && episodeQueryCache.buildId === config.buildId) return episodeQueryCache.query;
  const inspect = (text) => {
    const query = evalEpisodeQueryChunk(text);
    if (query) {
      episodeQueryCache = { appUrl: config.appUrl, buildId: config.buildId, query };
      return query;
    }
    return null;
  };
  if (config.sourceUrl) {
    try {
      const query = inspect(await fetchText(config.sourceUrl, { Accept: "application/javascript,*/*" }));
      if (query) return query;
    } catch {}
  }
  const html = await fetchText(`${REFERER}/`, { Accept: "text/html,*/*", "Cache-Control": "no-cache", Pragma: "no-cache" });
  const appUrl = appEntryUrl(html);
  if (!appUrl) return episodeQuery();
  const queue = [appUrl];
  const seen = new Set();
  while (queue.length && seen.size < DISCOVERY_LIMIT) {
    const batch = queue.splice(0, DISCOVERY_CONCURRENCY).filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
    const chunks = await Promise.all(batch.map(async (url) => {
      try {
        return { url, text: await fetchText(url, { Accept: "application/javascript,*/*" }) };
      } catch {
        return null;
      }
    }));
    for (const item of chunks.filter(Boolean)) {
      const query = inspect(item.text);
      if (query) return query;
      const imported = [
        ...item.text.matchAll(/(?:import\(|from\s*)["']([^"']+\.js)["']/g),
        ...item.text.matchAll(/["'](\.\.\/(?:chunks|nodes)\/[^"'\n]+\.js)["']/g)
      ].map((match) => match[1]).filter((value) => value.startsWith(".") || value.startsWith("/"));
      for (const value of imported) {
        const next = new URL(value, item.url).toString();
        if (!seen.has(next)) queue.push(next);
      }
    }
  }
  return episodeQuery();
}
__name(discoverEpisodeQuery, "discoverEpisodeQuery");

function buildMaskSeed(buildId) {
  const n = String(buildId || "");
  const out = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    out[i] = (n.charCodeAt(i % n.length) || 0) ^ ((i * 17 + 31) & 255);
  }
  return out;
}
__name(buildMaskSeed, "buildMaskSeed");

function buildMask(config) {
  const { buildId, maskParts } = config;
  if (config.scheme === "fragments") {
    const salt = Buffer.alloc(32);
    const name = String(buildId || "");
    for (let i = 0; i < salt.length; i++) {
      salt[i] = (name.charCodeAt(i % name.length) || 0) ^ ((i * config.saltMul + config.saltAdd) & 255);
    }
    const out = Buffer.alloc(32);
    for (let i = 0; i < maskParts.length; i++) {
      const part = Buffer.from(maskParts[i], "base64");
      const offset = i * 8;
      for (let j = 0; j < 8; j++) {
        out[offset + j] = part[j] ^ salt[offset + j] ^ ((i * config.fragMul + j * config.fragAdd) & 255);
      }
    }
    return out;
  }
  const seed = buildMaskSeed(buildId);
  const out = Buffer.alloc(32);
  for (let i = 0; i < maskParts.length; i++) {
    const part = Buffer.from(maskParts[i], "base64");
    const offset = i * 8;
    for (let j = 0; j < 8; j++) {
      out[offset + j] = (part[j] ^ seed[offset + j]) ^ ((i * 41 + j * 7) & 255);
    }
  }
  return out;
}
__name(buildMask, "buildMask");

function currentEpochs(now = Date.now()) {
  const epoch = Math.floor(now / BOOT_EPOCH_MS);
  const previousGrace = now - epoch * BOOT_EPOCH_MS < BOOT_GRACE_MS && epoch > 0 ? epoch - 1 : epoch;
  return [...new Set([previousGrace, epoch])];
}
__name(currentEpochs, "currentEpochs");

function makeBootToken(config, epoch, lane = CONTENT_LANE) {
  const mask = buildMask(config);
  const bootKey = hmacBytes(mask, `${config.bootPrefix ?? "aa-boot:"}${config.buildId}`);
  if (config.scheme !== "fragments") {
    return hmacBytes(bootKey, `${config.buildId}:${KEY_GROUP}:${REFERER_HOST}:${epoch}:${lane}`).toString("hex");
  }
  const fields = { buildId: config.buildId, group: KEY_GROUP, host: REFERER_HOST, epoch: String(epoch), lane: String(lane || "") };
  const parts = config.omitEmptyLane && !fields.lane ? config.parts.filter((part) => part !== "lane") : config.parts;
  return hmacBytes(bootKey, parts.map((part) => fields[part] ?? "").join(config.join)).toString("hex");
}
__name(makeBootToken, "makeBootToken");

function isUnknownBuildId(raw) {
  try {
    return JSON.parse(raw)?.error === "unknown_build_id";
  } catch {
    return /unknown_build_id/i.test(raw);
  }
}
__name(isUnknownBuildId, "isUnknownBuildId");

async function fetchBootstrap(lane = CONTENT_LANE, force = false) {
  let lastError = null;
  for (let refresh = 0; refresh < 2; refresh++) {
    const config = await discoverCryptoConfig(force || refresh > 0);
    let retryWithFreshEntry = false;
    for (const epoch of currentEpochs()) {
      const res = await sessionFetch(`${API}/client-crypto/v1/bootstrap?buildId=${encodeURIComponent(config.buildId)}&k=${encodeURIComponent(lane)}`, {
        headers: {
          "Referer": `${REFERER}/`,
          "Origin": REFERER,
          "x-build-id": config.buildId,
          "x-aa-boot": makeBootToken(config, epoch, lane)
        }
      });
      const raw = await res.text();
      if (!res.ok) {
        lastError = new Error(`Bootstrap ${res.status}: ${raw.slice(0, 180)}`);
        if (isUnknownBuildId(raw)) {
          cryptoConfigCache = null;
          episodeQueryCache = null;
          retryWithFreshEntry = true;
          break;
        }
        continue;
      }
      const data = JSON.parse(raw);
      if (!data?.partB) {
        lastError = new Error("Bootstrap missing partB");
        continue;
      }
      return { ...data, ...config, lane, buildId: config.buildId };
    }
    if (!retryWithFreshEntry) break;
  }
  throw lastError || new Error("MKissa bootstrap failed");
}
__name(fetchBootstrap, "fetchBootstrap");

function deriveLaneKey(partB, config) {
  const encrypted = Buffer.from(partB, "base64");
  const mask = buildMask(config);
  const key = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    key[i] = encrypted[i] ^ mask[i % mask.length];
  }
  return key;
}
__name(deriveLaneKey, "deriveLaneKey");

async function getLaneKey(lane = CONTENT_LANE, force = false) {
  const boot = await fetchBootstrap(lane, force);
  return { key: deriveLaneKey(boot.partB, boot), epoch: boot.epoch, buildId: boot.buildId };
}
__name(getLaneKey, "getLaneKey");

function makeAaReq(key, epoch, buildId, queryHash, lane = CONTENT_LANE) {
  const ts = Math.floor(Date.now() / AA_REQ_MS) * AA_REQ_MS;
  const payload = Buffer.from(JSON.stringify({ v: 1, ts, epoch, buildId, qh: queryHash, k: lane }));
  const iv = crypto.createHash("sha256").update(`${epoch}:${buildId}:${queryHash}:${ts}:${lane}`).digest().subarray(0, 12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(payload), cipher.final(), cipher.getAuthTag()]);
  return Buffer.concat([Buffer.from([1]), iv, body]).toString("base64");
}
__name(makeAaReq, "makeAaReq");

function decryptTobeparsed(b64, key) {
  const buf = Buffer.from(b64, "base64");
  const version = buf[0];
  if (version !== 1) throw new Error(`Unsupported MKissa encryption version: ${version}`);
  const iv = buf.subarray(1, 13);
  const body = buf.subarray(13);
  const ct = body.subarray(0, body.length - 16);
  const tag = body.subarray(body.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8"));
}
__name(decryptTobeparsed, "decryptTobeparsed");

function episodeQuery() {
  const zt = `
tbObj {
  u
  sm
  md
  ts
}
`;
  const pu = `
_id
name
englishName
nativeName
slugTime
`;
  const xa = `
${pu}
thumbnail
${zt}
lastEpisodeInfo
lastEpisodeDate
type
season
score
airedStart
availableEpisodes
episodeDuration
episodeCount
lastUpdateEnd
characterCount
`;
  const ef = `
  _id
  username
  displayName
  createdAt
  picture
  reputation
  roleLevel

  
  brief
  followerCount
  followingCount
  pDec
  equippedBadgeKey
  equippedBadge {
    key
    name
    rank
    iconPath
    date
  }
  ugcContributorStats {
    mediaEditReviewSubmitCount
    mediaEditApprovedCount
    mediaEditRejectedCount
    mediaEditAppliedCount
    mediaEditContributionPoints
    mediaEditModContributionPoints
  }

  hideMe
`;
  const fr = `
views
likesCount
commentCount
dislikesCount
boostsCount
reviewCount
userScoreCount
userScoreTotalValue
userScoreAverValue
viewers{
firstViewers{
viewCount
lastWatchedDate
user{
${ef}
}
}
recViewers{
viewCount
lastWatchedDate
user{
${ef}
}
}
}
`;
  return `
query(
$showId: String!
$translationType: VaildTranslationTypeEnumType!
$episodeString: String!
) {
episode(
showId: $showId
translationType: $translationType
episodeString: $episodeString
) {
episodeString
uploadDate
sourceUrls
thumbnail
notes
show{
${xa}
description
broadcastInterval
banner
characters
availableEpisodesDetail
nameOnlyString
characters
isAdult
relatedShows
relatedMangas
altNames
disqusIds
}
pageStatus{
_id
notes
pageId
showId
${fr}
}
episodeInfo{
notes
thumbnails
${zt}
vidInforssub
uploadDates
vidInforsdub
vidInforsraw
description
}
versionFix
}
}
`;
}
__name(episodeQuery, "episodeQuery");

async function apiPost(query, variables, options = {}) {
  const config = options.buildId ? options : await discoverCryptoConfig();
  const body = options.extensions ? { query, variables, extensions: options.extensions } : { query, variables };
  const res = await apiSessionFetch(API_URL, {
    method: "POST",
    headers: apiHeaders(config.buildId, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body)
  });
  const raw = await res.text();
  if (!res.ok) {
    const err = new Error(`API POST ${res.status}`);
    err.rawBody = raw;
    throw err;
  }
  const json = JSON.parse(raw);
  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message || e.extensions?.code || "GraphQL error");
    const err = new Error(messages.join(" · "));
    if (messages.includes("NEED_CAPTCHA")) err.code = "NEED_CAPTCHA";
    err.rawBody = raw;
    err.graphql = json;
    throw err;
  }
  return json.data;
}
__name(apiPost, "apiPost");

async function apiEpisode(query, variables, options = {}) {
  const { force = false, captchaRetry = 0, captcha = null, postFallback = false } = options;
  const hash = sha256Hex(query);
  const { key, epoch, buildId } = await getLaneKey(CONTENT_LANE, force);
  const extensions = {
    persistedQuery: { version: 1, sha256Hash: hash },
    k: CONTENT_LANE,
    aaReq: makeAaReq(key, epoch, buildId, hash, CONTENT_LANE)
  };
  if (captcha) extensions.captcha = captcha;
  if (captcha) {
    const posted = await apiPost(query, variables, { buildId, extensions });
    return posted?.tobeparsed ? decryptTobeparsed(posted.tobeparsed, key) : posted;
  }
  const url = `${API_URL}?variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(JSON.stringify(extensions))}`;
  const res = await apiSessionFetch(url, {
    headers: apiHeaders(buildId)
  });
  const raw = await res.text();
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.rawBody = raw;
    throw err;
  }
  const json = JSON.parse(raw);
  const messages = json.errors?.map((e) => e.message || e.extensions?.code).filter(Boolean) || [];
  if (messages.includes("PersistedQueryNotFound") || messages.some((m) => /Context creation failed/i.test(m))) {
    const posted = await apiPost(query, variables, { buildId, extensions });
    return posted?.tobeparsed ? decryptTobeparsed(posted.tobeparsed, key) : posted;
  }
  if (messages.includes("NEED_CAPTCHA")) {
    if (!postFallback) {
      try {
        const postHash = sha256Hex(query);
        const postExtensions = {
          persistedQuery: { version: 1, sha256Hash: postHash },
          k: CONTENT_LANE,
          aaReq: makeAaReq(key, epoch, buildId, postHash, CONTENT_LANE)
        };
        const posted = await apiPost(query, variables, { buildId, extensions: postExtensions });
        return posted?.tobeparsed ? decryptTobeparsed(posted.tobeparsed, key) : posted;
      } catch (err) {
        if (err.code !== "NEED_CAPTCHA") throw err;
      }
    }
    if (captchaRetry < 5) {
      await sleep(1500 + captchaRetry * 1200);
      return apiEpisode(query, variables, { force: true, captchaRetry: captchaRetry + 1, postFallback: true });
    }
    const err = new Error("MKissa requested captcha");
    err.code = "NEED_CAPTCHA";
    err.rawBody = raw;
    throw err;
  }
  if (messages.some((m) => /^AA_CRYPTO_/.test(m))) {
    if (!force) return apiEpisode(query, variables, { force: true, captchaRetry, captcha, postFallback });
    const err = new Error(messages.join(" · "));
    err.rawBody = raw;
    throw err;
  }
  if (json.data?.tobeparsed) {
    return decryptTobeparsed(json.data.tobeparsed, key);
  }
  if (messages.length) {
    const err = new Error(messages.join(" · "));
    err.rawBody = raw;
    throw err;
  }
  return json.data;
}
__name(apiEpisode, "apiEpisode");

async function searchMkissa(query, mode = "sub") {
  const gql = `query($search:SearchInput $limit:Int $page:Int $translationType:VaildTranslationTypeEnumType $countryOrigin:VaildCountryOriginEnumType){shows(search:$search limit:$limit page:$page translationType:$translationType countryOrigin:$countryOrigin){edges{_id name englishName nativeName slugTime availableEpisodes availableEpisodesDetail aniListId __typename}}}`;
  const data = await apiPost(gql, {
    search: { allowAdult: false, allowUnknown: false, query },
    limit: 40,
    page: 1,
    translationType: mode,
    countryOrigin: "ALL"
  });
  return data?.shows?.edges ?? [];
}
__name(searchMkissa, "searchMkissa");

async function getEpisodeSources(showId, epNum, audio = "sub", captcha = null) {
  const query = await discoverEpisodeQuery();
  const data = await apiEpisode(query, { showId, translationType: audio, episodeString: String(epNum) }, { captcha });
  return data?.episode ?? null;
}
__name(getEpisodeSources, "getEpisodeSources");

function slugifyTitle(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(slugifyTitle, "slugifyTitle");

async function warmWatchPage(showId, show, epNum, audio) {
  const slug = show?.slugTime || slugifyTitle(show?.englishName || show?.name || show?.nativeName);
  if (!slug || !showId) return;
  const page = `${REFERER}/anime/${slug}-${showId}/${audio}/${epNum}`;
  try {
    await fetchWithTimeout(page, {
      headers: browserHeaders({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": `${REFERER}/`,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      })
    }, FETCH_TIMEOUT_MS);
  } catch {}
}
__name(warmWatchPage, "warmWatchPage");

async function fetchAniZip(anilistId) {
  const res = await fetch(`${ANIZIP}?anilist_id=${anilistId}`);
  if (!res.ok) return null;
  return res.json();
}
__name(fetchAniZip, "fetchAniZip");

function extractYear(title) {
  if (!title) return null;
  const m = title.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}
__name(extractYear, "extractYear");

function findBestMatch(results, titles, targetYear, targetId) {
  const scored = [];
  for (const r of results) {
    if (targetId && r.aniListId && String(r.aniListId) === String(targetId)) return r;
    const titleScore = titleIdentityScore(titles, [r.name, r.englishName, r.nativeName]);
    if (titleScore < 0.62) continue;
    const rYear = extractYear(r.name) || extractYear(r.englishName) || extractYear(r.nativeName);
    const yearAdjustment = targetYear && rYear ? (rYear === targetYear ? 0.08 : -0.08) : 0;
    scored.push({ show: r, score: titleScore + yearAdjustment });
  }
  scored.sort((left, right) => right.score - left.score);
  const best = scored[0];
  const runnerUp = scored[1];
  if (!best || best.score < 0.62 || runnerUp && best.score - runnerUp.score < 0.06) {
    throw new Error("MKissa title match is ambiguous");
  }
  return best.show;
}
__name(findBestMatch, "findBestMatch");

async function fetchAniListMedia(anilistId) {
  try {
    const q = "query ($id: Int) { Media (id: $id, type: ANIME) { seasonYear startDate { year } title { romaji english native } } }";
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA4, "Origin": "https://anilist.co" },
      body: JSON.stringify({ query: q, variables: { id: Number(anilistId) } })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.Media ?? null;
  } catch {
    return null;
  }
}
__name(fetchAniListMedia, "fetchAniListMedia");

async function resolveMkissaId(anilistId, ctx = {}) {
  const [anizipRes, alMedia] = await Promise.all([
    ctx.anizip ? Promise.resolve(ctx.anizip) : fetchAniZip(anilistId).catch(() => ({})),
    ctx.media ? Promise.resolve(ctx.media) : fetchAniListMedia(anilistId).catch(() => null)
  ]);
  const anizip = anizipRes || {};
  let titlesToTry = [...new Set([...buildTitles(alMedia, anizip), ...Object.values(anizip.titles || {})].filter(Boolean))];
  if (!titlesToTry.length && anizip.mappings) {
    const apId = anizip.mappings.animeplanet_id;
    if (apId) titlesToTry = [apId.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")];
  }
  if (!titlesToTry.length) throw new Error(`Could not resolve titles for AniList ID: ${anilistId}`);
  const targetYear = alMedia?.seasonYear || alMedia?.startDate?.year || null;
  const queries = buildTitleSearchQueries(titlesToTry, 16);
  const resultMap = new Map();
  for (let index = 0; index < queries.length; index += 4) {
    const batches = await Promise.all(queries.slice(index, index + 4).map((query) => searchMkissa(query, "sub").catch(() => [])));
    for (const results of batches) {
      for (const result of results) {
        if (result?._id && !resultMap.has(result._id)) resultMap.set(result._id, result);
      }
    }
  }
  const allResults = [...resultMap.values()];
  if (!allResults.length) throw new Error(`No MKissa match for "${titlesToTry[0]}"`);
  const match = findBestMatch(allResults, titlesToTry, targetYear, anilistId);
  return { showId: match._id, show: match, anizip };
}
__name(resolveMkissaId, "resolveMkissaId");

function hexToBytes(hex) {
  const clean = hex.replace(/[^0-9a-f]/gi, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}
__name(hexToBytes, "hexToBytes");

async function aesDecrypt(hex) {
  const decipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from("kiemtienmua911ca"), Buffer.from("1234567890oiuytr"));
  return Buffer.concat([decipher.update(Buffer.from(hexToBytes(hex))), decipher.final()]).toString("utf8");
}
__name(aesDecrypt, "aesDecrypt");

async function extractMp4(id) {
  try {
    const r = await fetchWithTimeout(`https://www.mp4upload.com/embed-${id}.html`, {
      headers: { "User-Agent": UA4, Referer: "https://mp4upload.com/" }
    });
    if (!r.ok) return null;
    const h = await r.text();
    const m = h.match(/player\.src\s*\(\s*\{[^}]*\bsrc\s*:\s*"([^"]+)"/) || h.match(/"file"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/) || h.match(/\bsrc\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/);
    return m?.[1]?.replace(/\\/g, "") || null;
  } catch {
    return null;
  }
}
__name(extractMp4, "extractMp4");

async function extractUns(url) {
  try {
    const parsed = new URL(url);
    const id = parsed.hash.replace(/^#/, "").split("&")[0];
    if (!id) return null;
    const base = `${parsed.protocol}//${parsed.host}`;
    const r = await fetchWithTimeout(`${base}/api/v1/video?id=${encodeURIComponent(id)}&w=1280&h=720&r=`, {
      headers: { "User-Agent": UA4, Referer: `${base}/#${id}`, Origin: base }
    });
    if (!r.ok) return null;
    const hex = (await r.text()).trim();
    if (!hex || !/^[0-9a-f]+$/i.test(hex)) return null;
    const data = JSON.parse(await aesDecrypt(hex));
    return data?.source || data?.cf || null;
  } catch {
    return null;
  }
}
__name(extractUns, "extractUns");

async function extractOk(id) {
  try {
    const r = await fetchWithTimeout(`https://ok.ru/videoembed/${id}`, {
      headers: { "User-Agent": UA4, Referer: "https://ok.ru/" }
    });
    if (!r.ok) return null;
    const h = await r.text();
    const m = h.match(/ondemandHls\\&quot;:\\&quot;(https?:\/\/.*?)\\&quot;/);
    return m?.[1]?.replace(/\\u0026/g, "&") || null;
  } catch {
    return null;
  }
}
__name(extractOk, "extractOk");

async function extractStreamSB(id) {
  try {
    const baseHeaders = {
      "User-Agent": UA4,
      "Referer": `${REFERER}/`,
      "watchsb": "streamsb",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9"
    };
    const r1 = await fetchWithTimeout(`https://streamsb.net/api/v1/video?id=${id}`, { headers: baseHeaders });
    const sid = (r1.headers.get("set-cookie") || "").match(/sid=([^;]+)/)?.[1] ?? "";
    const html = await r1.text();
    const m = html.match(/window\.location\.replace\('([^']+)'\)/);
    if (!m) return null;
    const r2 = await fetchWithTimeout(m[1], { headers: { ...baseHeaders, Cookie: `sid=${sid}`, Referer: `https://streamsb.net/e/${id}.html` } });
    if (!r2.ok) return null;
    const ct = r2.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return null;
    const data = await r2.json();
    return data?.stream_data?.file ?? data?.data?.file ?? null;
  } catch {
    return null;
  }
}
__name(extractStreamSB, "extractStreamSB");

async function extractStreamlare(id) {
  try {
    const r = await fetchWithTimeout("https://streamlare.com/api/video/stream/get", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA4, "Referer": "https://streamlare.com/", "Origin": "https://streamlare.com", "Accept": "application/json, */*" },
      body: JSON.stringify({ id })
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.data?.file ?? null;
  } catch {
    return null;
  }
}
__name(extractStreamlare, "extractStreamlare");

async function extractClock(url) {
  try {
    const parsed = new URL(url);
    const clockUrl = parsed.pathname.includes("/clock.json") ? url : url.replace("/clock", "/clock.json");
    const r = await fetchWithTimeout(clockUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Referer": "https://allanime.day/player.html",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      }
    });
    if (!r.ok) return null;
    const data = await r.json();
    const links = Array.isArray(data?.links) ? data.links : [];
    const best = links.find((item) => item?.hls && item?.link) || links.find((item) => item?.link);
    return best?.link || null;
  } catch {
    return null;
  }
}
__name(extractClock, "extractClock");

function embedMediaType(url) {
  if (!url) return null;
  if (url.includes(".m3u8")) return "hls";
  if (url.includes(".mp4")) return "mp4";
  return "direct";
}
__name(embedMediaType, "embedMediaType");

async function extractSource(src) {
  let url = src.sourceUrl;
  if (url && url.startsWith("--")) url = decodeHexUrl(url.slice(2));
  if (url && url.startsWith("/apivtwo/clock")) url = "https://allanime.day" + url.replace("/clock", "/clock.json");
  if (url && /^https?:\/\/allanime\.day\/apivtwo\/clock(?:\.json)?/i.test(url)) url = url.replace("/clock?", "/clock.json?");
  let extractedUrl = null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "allanime.day" && /\/apivtwo\/clock(?:\.json)?/i.test(new URL(url).pathname)) {
      extractedUrl = await extractClock(url);
    } else if (src.type === "player") extractedUrl = url;
    else if (host === "mp4upload.com") {
      const m = url.match(/embed-([a-zA-Z0-9]+)\.html/i);
      if (m?.[1]) extractedUrl = await extractMp4(m[1]);
    } else if (/uns\.bio$/i.test(host)) {
      extractedUrl = await extractUns(url);
    } else if (host === "ok.ru") {
      const m = url.match(/\/(?:videoembed\/)?(\d+)(?:[/?#]|$)/i);
      if (m?.[1]) extractedUrl = await extractOk(m[1]);
    } else if (/streamsb\./i.test(host)) {
      const m = url.match(/\/(?:e\/|embed-)([a-zA-Z0-9]+)(?:\.html)?/i);
      if (m?.[1]) extractedUrl = await extractStreamSB(m[1]);
    } else if (/streamlare\./i.test(host)) {
      const m = url.match(/\/e\/([a-zA-Z0-9]+)/i);
      if (m?.[1]) extractedUrl = await extractStreamlare(m[1]);
    }
  } catch {}
  return {
    name: src.sourceName || "",
    url,
    extractedUrl,
    extractedType: embedMediaType(extractedUrl),
    type: src.type,
    priority: src.priority,
    headers: {
      "Referer": REFERER,
      "User-Agent": UA4
    },
    downloads: src.downloads || null
  };
}
__name(extractSource, "extractSource");

async function fetchAniListFull(anilistId) {
  const q = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      synonyms
      format
      episodes
      seasonYear
      startDate { year }
      type
      relations {
        edges { relationType(version: 2) node { id type format title { romaji english native } } }
      }
    }
  }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA4, "Origin": "https://anilist.co" },
    body: JSON.stringify({ query: q, variables: { id: Number(anilistId) } })
  });
  if (!res.ok) throw new Error("AniList fetch failed");
  const json = await res.json();
  return json.data?.Media;
}
__name(fetchAniListFull, "fetchAniListFull");

async function fetchKitsuId(malId) {
  if (!malId) return null;
  try {
    const res = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}`);
    const json = await res.json();
    const mapping = json.data?.[0];
    if (mapping?.relationships?.item?.links?.related) {
      const itemRes = await fetch(mapping.relationships.item.links.related);
      const itemJson = await itemRes.json();
      return itemJson.data?.id ? Number(itemJson.data.id) : null;
    }
  } catch {}
  return null;
}
__name(fetchKitsuId, "fetchKitsuId");

async function fetchTMDB(titles, year, format) {
  const tmdbType = format === "MOVIE" || format === "OVA" || format === "SPECIAL" ? "movie" : "tv";
  let result = null;
  for (const title of titles) {
    if (!title) continue;
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/${tmdbType}?query=${encodeURIComponent(title)}&first_air_date_year=${year}&year=${year}`;
      const res = await fetch(searchUrl, { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: "application/json" } });
      const json = await res.json();
      if (json.results?.length) {
        result = json.results[0];
        break;
      }
    } catch {}
  }
  if (!result) return { themoviedbId: null, imdbId: null, thetvdbId: null };
  try {
    const extUrl = `https://api.themoviedb.org/3/${tmdbType}/${result.id}/external_ids`;
    const extRes = await fetch(extUrl, { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: "application/json" } });
    const externalIds = await extRes.json();
    return {
      themoviedbId: result.id,
      imdbId: externalIds.imdb_id || null,
      thetvdbId: externalIds.tvdb_id || null
    };
  } catch {
    return { themoviedbId: result.id, imdbId: null, thetvdbId: null };
  }
}
__name(fetchTMDB, "fetchTMDB");

async function handleMap(anilistId) {
  const al = await fetchAniListFull(anilistId);
  if (!al) throw new Error("AniList entry not found");
  const year = al.seasonYear || al.startDate?.year;
  const titlesToSearch = [al.title.english, al.title.romaji, al.title.native].filter(Boolean);
  const [kitsuId, tmdbData] = await Promise.all([
    fetchKitsuId(al.idMal),
    fetchTMDB(titlesToSearch, year, al.format)
  ]);
  return {
    mappings: {
      id: Number(anilistId),
      title: al.title.english || al.title.romaji,
      type: al.type,
      format: al.format,
      episodes: al.episodes,
      malId: al.idMal,
      aniId: Number(anilistId),
      anidbId: null,
      animePlanetId: null,
      kitsuId,
      imdbId: tmdbData.imdbId,
      themoviedbId: tmdbData.themoviedbId,
      thetvdbId: tmdbData.thetvdbId,
      livechartId: null,
      annId: null,
      synonyms: al.synonyms || [],
      franchise: al.relations?.edges?.map((e) => ({
        relation: e.relationType,
        id: e.node.id,
        title: e.node.title.romaji || e.node.title.english,
        type: e.node.type,
        format: e.node.format
      })) || []
    }
  };
}
__name(handleMap, "handleMap");

async function handleEpisodes(anilistId, ctx = {}) {
  const { showId, show, anizip } = await resolveMkissaId(anilistId, ctx);
  const epDetail = show.availableEpisodesDetail || {};
  const subEps = (epDetail.sub || []).map(Number).sort((a, b) => a - b);
  const dubEps = (epDetail.dub || []).map(Number).sort((a, b) => a - b);
  const buildList = (nums, audio) => nums.map((n) => {
    const meta = anizip.episodes?.[String(n)] ?? {};
    return {
      id: `watch/mkissa/${anilistId}/${audio}/mkissa-${n}`,
      number: n,
      title: meta.title?.en || meta.title?.["x-jat"] || null,
      duration: meta.runtime ?? meta.length ?? 0,
      audio,
      filler: meta.filler ?? false,
      uncensored: false,
      description: meta.overview || meta.summary || null,
      image: meta.image || anizip.images?.cover || null,
      airDate: meta.airdate || meta.aired || null
    };
  });
  return {
    meta: {
      id: showId,
      title: show.englishName || show.name
    },
    episodes: {
      sub: buildList(subEps, "sub"),
      dub: buildList(dubEps, "dub"),
      raw: []
    }
  };
}
__name(handleEpisodes, "handleEpisodes");

async function handleEpisodesRoute(anilistId) {
  const { showId, show, anizip } = await resolveMkissaId(anilistId);
  const epDetail = show.availableEpisodesDetail || {};
  const subEps = (epDetail.sub || []).map(Number).sort((a, b) => a - b);
  const dubEps = (epDetail.dub || []).map(Number).sort((a, b) => a - b);
  const buildEpList = (nums, audio) => nums.map((n) => {
    const meta = anizip.episodes?.[String(n)] ?? {};
    return {
      id: `watch/mkissa/${anilistId}/${audio}/mkissa-${n}`,
      number: n,
      title: meta.title?.en || meta.title?.["x-jat"] || `Episode ${n}`,
      duration: meta.runtime ?? meta.length ?? 0,
      audio,
      filler: meta.filler ?? false,
      uncensored: false,
      description: meta.overview || meta.summary || "",
      image: meta.image || anizip.images?.cover || "",
      airDate: meta.airdate || meta.aired || ""
    };
  });
  return {
    anilistId: Number(anilistId),
    mkissaId: showId,
    title: show.englishName || show.name,
    sub: buildEpList(subEps, "sub"),
    dub: buildEpList(dubEps, "dub")
  };
}
__name(handleEpisodesRoute, "handleEpisodesRoute");

function readCaptcha(request, url) {
  const token = url.searchParams.get("captchaToken") || url.searchParams.get("turnstileToken") || request.headers.get("x-captcha-token") || request.headers.get("cf-turnstile-response");
  const provider = url.searchParams.get("captchaProvider") || request.headers.get("x-captcha-provider") || "turnstile1";
  return token ? { token, provider } : null;
}
__name(readCaptcha, "readCaptcha");

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
__name(html, "html");

function handleCaptchaPage(url) {
  const next = url.searchParams.get("next") || "";
  const safeNext = next.startsWith("/watch/mkissa/") ? next : "";
  const endpoint = `${API.replace(/\/$/, "")}/captcha/turnstile`;
  return html(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MKissa Security Check</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#101114;color:#f5f5f5;display:grid;place-items:center;min-height:100vh}
main{width:min(720px,calc(100vw - 32px))}
h1{font-size:20px;font-weight:650;margin:0 0 14px}
#captcha-root{min-height:160px}
iframe{width:100%;min-height:180px;border:0;border-radius:8px;background:white}
pre{white-space:pre-wrap;word-break:break-word;background:#17191f;border:1px solid #2a2d36;border-radius:8px;padding:14px;max-height:48vh;overflow:auto}
button{border:0;border-radius:6px;padding:10px 14px;background:#f5f5f5;color:#111;font-weight:650;cursor:pointer}
</style>
</head>
<body>
<main>
<h1>MKissa Security Check</h1>
<div id="captcha-root"></div>
<pre id="out">Waiting for captcha...</pre>
</main>
<script>
const next=${JSON.stringify(safeNext)};
const endpoint=${JSON.stringify(endpoint)};
const out=document.getElementById("out");
const root=document.getElementById("captcha-root");
function show(value){out.textContent=typeof value==="string"?value:JSON.stringify(value,null,2)}
function run(token,provider){
  if(!next){show({error:"Missing next watch path"});return}
  const u=new URL(next,location.origin);
  u.searchParams.set("captchaToken",token);
  u.searchParams.set("captchaProvider",provider||"turnstile");
  show("Captcha solved. Retrying watch request...");
  fetch(u).then(r=>r.text().then(t=>{try{show(JSON.parse(t))}catch{show(t)}})).catch(e=>show({error:String(e)}));
}
window.addEventListener("message",event=>{
  if(event.origin!==new URL(endpoint).origin)return;
  const data=event.data;
  if(!data||data.type!=="sitea-captcha-ready")return;
  if(data.error){show({error:data.error});return}
  if(!data.token){show({error:"Captcha token missing"});return}
  run(data.token,data.provider);
});
const iframe=document.createElement("iframe");
iframe.src=endpoint;
iframe.title="Security check";
iframe.loading="eager";
iframe.referrerPolicy="strict-origin-when-cross-origin";
iframe.onerror=()=>show({error:"Failed to load captcha frame"});
root.appendChild(iframe);
</script>
</body>
</html>`);
}
__name(handleCaptchaPage, "handleCaptchaPage");

async function handleWatch(anilistId, audio, epNum, captcha = null) {
  const cacheKey = `${anilistId}:${audio}:${epNum}`;
  const cached = watchMemoryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt && !captcha) return cached.data;
  const { showId, show, anizip } = await resolveMkissaId(anilistId);
  if (!captcha) await warmWatchPage(showId, show, epNum, audio);
  let episode;
  try {
    episode = await getEpisodeSources(showId, epNum, audio, captcha);
  } catch (err) {
    if (err.code === "NEED_CAPTCHA" && cached?.data) return cached.data;
    throw err;
  }
  if (!episode) throw new Error("Episode not found");
  const sources = await Promise.all((episode.sourceUrls || []).map(extractSource));
  sources.sort((a, b) => b.priority - a.priority);
  const epMeta = anizip?.episodes?.[String(epNum)] ?? {};
  const data = {
    anilistId: Number(anilistId),
    mkissaId: showId,
    episode: Number(epNum),
    audio,
    intro: epMeta.intro ?? null,
    outro: epMeta.outro ?? null,
    sources
  };
  watchMemoryCache.set(cacheKey, { data, expiresAt: Date.now() + WATCH_MEMORY_TTL });
  return data;
}
__name(handleWatch, "handleWatch");

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    }
  });
}
__name(json, "json");

function matchRoute(pathname) {
  let m = pathname.match(/^\/episodes\/(\d+)\/?$/);
  if (m) return { handler: "episodes", anilistId: m[1] };
  m = pathname.match(/^\/watch\/mkissa\/(\d+)\/(sub|dub)\/mkissa-(\d+)\/?$/);
  if (m) return { handler: "watch", anilistId: m[1], audio: m[2], ep: m[3] };
  m = pathname.match(/^\/map\/(\d+)\/?$/);
  if (m) return { handler: "map", anilistId: m[1] };
  m = pathname.match(/^\/captcha\/mkissa\/?$/);
  if (m) return { handler: "captcha" };
  return null;
}
__name(matchRoute, "matchRoute");

const mkissaDefault = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const route = matchRoute(url.pathname);
    if (!route) {
      return json({
        error: "Not found",
        routes: [
          "GET /episodes/:anilistId",
          "GET /watch/mkissa/:anilistId/:audio/mkissa-:ep",
          "GET /captcha/mkissa?next=/watch/mkissa/:anilistId/:audio/mkissa-:ep",
          "GET /map/:anilistId"
        ]
      }, 404);
    }
    try {
      if (route.handler === "captcha") return handleCaptchaPage(url);
      if (route.handler === "map") return json(await handleMap(route.anilistId));
      if (route.handler === "episodes") return json(await handleEpisodesRoute(route.anilistId));
      if (route.handler === "watch") return json(await handleWatch(route.anilistId, route.audio, route.ep, readCaptcha(request, url)));
    } catch (err) {
      const status = err.code === "NEED_CAPTCHA" ? 403 : 500;
      const solveUrl = route.handler === "watch" ? `/captcha/mkissa?next=${encodeURIComponent(url.pathname)}` : null;
      return json({ error: err.message, code: err.code ?? null, captcha: err.code === "NEED_CAPTCHA" ? { endpoint: `${API.replace(/\/$/, "")}/captcha/turnstile`, provider: "turnstile", tokenQuery: "captchaToken", tokenHeader: "x-captcha-token", solveUrl } : null, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, status);
    }
  }
};

export default mkissaDefault;
export { handleEpisodes as getEpisodes };
