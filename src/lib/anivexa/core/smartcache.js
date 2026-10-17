import {
  redisGet,
  redisSet,
  redisDel,
  redisKeys,
  isRedisConfigured,
} from "@/lib/redis";

// Reads process.env safely — process may be undefined/limited on edge runtimes.
function readEnv(name) {
  try {
    return typeof process !== "undefined" ? process.env?.[name] : undefined;
  } catch { return undefined; }
}

function envBool(name, fallback) {
  const raw = readEnv(name);
  if (raw === undefined || raw === "") return fallback;
  return ["true", "1", "yes", "on"].includes(String(raw).toLowerCase());
}

function envInt(name, fallback) {
  const raw = readEnv(name);
  const n = Number(raw);
  return raw !== undefined && raw !== "" && Number.isFinite(n) && n > 0 ? n : fallback;
}

// change CACHE_ENABLED=false in .env to disable caching
export const _CACHE_ENABLED = envBool("CACHE_ENABLED", true);

const IS_LOCAL_NODE = (() => {
  try {
    return (
      typeof process !== "undefined" &&
      typeof process.versions?.node === "string" &&
      !process.env.VERCEL
    );
  } catch { return false; }
})();

const UPSTASH_REDIS_REST_URL = readEnv("UPSTASH_REDIS_REST_URL") ?? ""; //get it from upstash.com
const UPSTASH_REDIS_REST_TOKEN = readEnv("UPSTASH_REDIS_REST_TOKEN") ?? "";
const UPSTASH_ENABLED = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

// DEFAULT_REDIS_TTL is in seconds (default 900s / 15min) — used as the fallback expiry
// for Redis writes that don't carry their own computed ttl (see redisWrite below).
const REDIS_TTL_MS = envInt("DEFAULT_REDIS_TTL", 900) * 1000;
const REDIS_PREFIX = "kitsune:anivexa:";

function encodeEntry(entry) {
  return JSON.stringify(entry, (_, value) => value === Infinity ? "__Infinity__" : value);
}

function decodeEntry(raw) {
  return JSON.parse(raw, (_, value) => value === "__Infinity__" ? Infinity : value);
}

async function upstashCommand(command) {
  if (!UPSTASH_ENABLED || typeof fetch !== "function") return null;
  const res = await fetch(UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  }).catch(() => null);
  if (!res?.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.result ?? null;
}

async function redisReadRaw(key) {
  const namespaced = `${REDIS_PREFIX}${key}`;
  if (isRedisConfigured()) {
    const val = await redisGet(namespaced);
    if (val !== null) return val;
  }
  if (UPSTASH_ENABLED) {
    return await upstashCommand(["GET", key]);
  }
  return null;
}

async function redisWrite(key, entry) {
  const value = encodeEntry(entry);
  const ttlMs = Number.isFinite(entry.ttl) && entry.ttl > 0 ? entry.ttl : REDIS_TTL_MS;
  if (isRedisConfigured()) {
    await redisSet(`${REDIS_PREFIX}${key}`, value, Math.ceil(ttlMs));
  }
  if (UPSTASH_ENABLED) {
    await upstashCommand(["SET", key, value, "PX", Math.ceil(ttlMs)]);
  }
}

async function redisDeleteKey(key) {
  if (isRedisConfigured()) {
    await redisDel(`${REDIS_PREFIX}${key}`);
  }
  if (UPSTASH_ENABLED) {
    await upstashCommand(["DEL", key]);
  }
}

let diskRead  = () => null;
let diskWrite = () => {};
let diskDel   = () => {};

if (IS_LOCAL_NODE) {
  const { readFileSync, mkdirSync, existsSync } = await import("node:fs");
  const { writeFile, unlink }                   = await import("node:fs/promises");
  const { join, dirname }                        = await import("node:path");
  const { fileURLToPath }                        = await import("node:url");

  const __dir    = dirname(fileURLToPath(import.meta.url));
  const CACHE_DIR = join(__dir, ".cache");
  try { mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

  const keyToPath = (key) =>
    join(CACHE_DIR, key.replace(/[^a-zA-Z0-9_-]/g, "_") + ".json");

  diskRead = (key) => {
    try {
      const p = keyToPath(key);
      if (!existsSync(p)) return null;
      return decodeEntry(readFileSync(p, "utf8"));
    } catch { return null; }
  };

  diskWrite = (key, entry) => {
    writeFile(keyToPath(key), encodeEntry(entry)).catch(() => {});
  };

  diskDel = (key) => {
    unlink(keyToPath(key)).catch(() => {});
  };
}

const MAX_MEM = 800;
const mem     = new Map();

function evict() {
  if (mem.size <= MAX_MEM) return;
  const drop = mem.size - MAX_MEM;
  let   n    = 0;
  for (const k of mem.keys()) {
    if (n++ >= drop) break;
    mem.delete(k);
  }
}

export function get(key) {
  if (!_CACHE_ENABLED) return null;
  let e = mem.get(key);
  if (e) return e;

  e = diskRead(key);
  if (!e) return null;

  mem.set(key, e);
  evict();
  return e;
}

export async function getAsync(key) {
  if (!_CACHE_ENABLED) return null;

  // Primary cache: Redis (TCP/TLS via REDIS_URL or Upstash REST)
  const raw = await redisReadRaw(key);
  if (raw) {
    try {
      const e = typeof raw === "string" ? decodeEntry(raw) : raw;
      if (!isFresh(e)) {
        await delAsync(key);
        return null;
      }
      mem.set(key, e);
      evict();
      diskWrite(key, e);
      return e;
    } catch {
      // Fall through to in-memory / disk fallback
    }
  }

  // Fallback cache: In-memory + local disk
  const localHit = get(key);
  if (localHit && isFresh(localHit)) {
    return localHit;
  }
  return null;
}

function setLocal(key, data, ttlMs, refreshAfterMs) {
  const now   = Date.now();
  const entry = {
    data,
    cachedAt:     now,
    ttl:          ttlMs,
    refreshAfter: refreshAfterMs ?? ttlMs,
    expiresAt:    now + ttlMs,
  };
  mem.delete(key);
  mem.set(key, entry);
  evict();
  diskWrite(key, entry);
  return entry;
}

export function set(key, data, ttlMs, refreshAfterMs) {
  if (!_CACHE_ENABLED) return { data, cachedAt: Date.now(), ttl: ttlMs, refreshAfter: refreshAfterMs ?? ttlMs, expiresAt: Date.now() + ttlMs };
  const entry = setLocal(key, data, ttlMs, refreshAfterMs);
  redisWrite(key, entry).catch(() => {});
  return entry;
}

export async function setAsync(key, data, ttlMs, refreshAfterMs) {
  if (!_CACHE_ENABLED) return { data, cachedAt: Date.now(), ttl: ttlMs, refreshAfter: refreshAfterMs ?? ttlMs, expiresAt: Date.now() + ttlMs };
  const entry = setLocal(key, data, ttlMs, refreshAfterMs);
  await redisWrite(key, entry);
  return entry;
}

export function isFresh(entry) {
  return entry !== null && entry !== undefined && Date.now() < entry.expiresAt;
}

export function needsRefresh(entry) {
  return !entry || Date.now() - entry.cachedAt > entry.refreshAfter;
}

function delLocal(key) {
  mem.delete(key);
  diskDel(key);
}

export function del(key) {
  delLocal(key);
  redisDeleteKey(key).catch(() => {});
}

export async function delAsync(key) {
  delLocal(key);
  await redisDeleteKey(key);
}

export function delByPrefix(prefix) {
  for (const k of [...mem.keys()]) {
    if (k.startsWith(prefix)) mem.delete(k);
  }
}

export async function delByPrefixAsync(prefix) {
  delByPrefix(prefix);
  if (isRedisConfigured()) {
    const keys = await redisKeys(`${REDIS_PREFIX}${prefix}*`);
    if (Array.isArray(keys) && keys.length) {
      await redisDel(...keys);
    }
  }
  if (UPSTASH_ENABLED) {
    const keys = await upstashCommand(["KEYS", `${prefix}*`]);
    if (Array.isArray(keys) && keys.length) {
      await upstashCommand(["DEL", ...keys]);
    }
  }
}

const MIN  = 60_000;
const HOUR = 60 * MIN;
const DAY  = 24 * HOUR;

export function episodeTTL(status) {
  switch (status) {
    case "FINISHED":         return [7 * DAY,   Infinity];
    case "RELEASING":        return [2 * HOUR,  15 * MIN];
    case "HIATUS":           return [6 * HOUR,  60 * MIN];
    case "NOT_YET_RELEASED": return [30 * MIN,  15 * MIN];
    default:                 return [HOUR,       15 * MIN];
  }
}

export function mapTTL(status) {
  return status === "FINISHED" ? 30 * DAY : 12 * HOUR;
}

export const WATCH_TTL         = 3 * HOUR;
export const SHOW_IDENTITY_TTL = 24 * HOUR;
export const THIRTY_DAYS       = 30 * DAY;
