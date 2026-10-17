import {
  redisGet,
  redisSet,
  redisDel,
  redisKeys,
  isRedisConfigured,
} from "@/lib/redis";

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

export const _CACHE_ENABLED = envBool("CACHE_ENABLED", true);

const MIN  = 60_000;
const HOUR = 60 * MIN;

// Default Redis TTL: 30 minutes (1800s); hard max 3 hours to prevent memory bloat
const REDIS_TTL_MS = envInt("DEFAULT_REDIS_TTL", 1800) * 1000;
const MAX_REDIS_TTL_MS = 3 * HOUR;
const REDIS_PREFIX = "providers:v1:";

function encodeEntry(entry) {
  return JSON.stringify(entry, (_, value) => value === Infinity ? "__Infinity__" : value);
}

function decodeEntry(raw) {
  return JSON.parse(raw, (_, value) => value === "__Infinity__" ? Infinity : value);
}

async function redisReadRaw(key) {
  if (!isRedisConfigured()) return null;
  return await redisGet(`${REDIS_PREFIX}${key}`);
}

async function redisWrite(key, entry) {
  if (!isRedisConfigured()) return;
  const value = encodeEntry(entry);
  const rawTtl = Number.isFinite(entry.ttl) && entry.ttl > 0 ? entry.ttl : REDIS_TTL_MS;
  const ttlMs = Math.min(Math.ceil(rawTtl), MAX_REDIS_TTL_MS);
  await redisSet(`${REDIS_PREFIX}${key}`, value, ttlMs);
}

async function redisDeleteKey(key) {
  if (!isRedisConfigured()) return;
  await redisDel(`${REDIS_PREFIX}${key}`);
}

const MAX_MEM = 150;
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
  return mem.get(key) ?? null;
}

export async function getAsync(key) {
  if (!_CACHE_ENABLED) return null;

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
      return e;
    } catch {
      // Fall through to in-memory fallback
    }
  }

  const localHit = get(key);
  if (localHit && isFresh(localHit)) {
    return localHit;
  }
  return null;
}

function setLocal(key, data, ttlMs, refreshAfterMs) {
  const cappedTtl = Math.min(Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : REDIS_TTL_MS, MAX_REDIS_TTL_MS);
  const now   = Date.now();
  const entry = {
    data,
    cachedAt:     now,
    ttl:          cappedTtl,
    refreshAfter: refreshAfterMs ?? cappedTtl,
    expiresAt:    now + cappedTtl,
  };
  mem.delete(key);
  mem.set(key, entry);
  evict();
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
}

export function episodeTTL(status) {
  switch (status) {
    case "FINISHED":         return [2 * HOUR,  Infinity];
    case "RELEASING":        return [HOUR,      15 * MIN];
    case "HIATUS":           return [2 * HOUR,  30 * MIN];
    case "NOT_YET_RELEASED": return [30 * MIN,  15 * MIN];
    default:                 return [HOUR,      15 * MIN];
  }
}

export function mapTTL(status) {
  return status === "FINISHED" ? 3 * HOUR : HOUR;
}

export const WATCH_TTL         = 2 * HOUR;
export const SHOW_IDENTITY_TTL = 2 * HOUR;
export const THIRTY_DAYS       = 3 * HOUR;
