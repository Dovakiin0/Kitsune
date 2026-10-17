import { webcrypto as crypto } from "node:crypto";

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const BLOCKS = 512;
const MASK = BLOCKS - 1;
const ROUNDS = 2;
const MUL_A = 2654435761;
const MUL_B = 2246822519;

function b64u(value) {
  return Buffer.from(value).toString("base64url");
}

function b64uDec(value) {
  return Buffer.from(value, "base64url");
}

function rot(value, shift) {
  return (value << shift | value >>> 32 - shift) >>> 0;
}

function mul(value, factor) {
  return Math.imul(value, factor) >>> 0;
}

function mix(state) {
  state[0] = state[0] + state[1] >>> 0;
  state[3] = rot(state[3] ^ state[0], 16);
  state[2] = state[2] + state[3] >>> 0;
  state[1] = rot(state[1] ^ state[2], 12);
  state[0] = state[0] + state[1] >>> 0;
  state[3] = rot(state[3] ^ state[0], 8);
  state[2] = state[2] + state[3] >>> 0;
  state[1] = rot(state[1] ^ state[2], 7);
}

function hash(bytes) {
  const state = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762]);
  for (let i = 0; i < bytes.length; i++) {
    state[0] = state[0] + bytes[i] >>> 0;
    state[0] = rot(state[0], 7);
    mix(state);
  }
  for (let i = 0; i < 8; i++) mix(state);
  const table = new Uint32Array(BLOCKS);
  for (let i = 0; i < BLOCKS; i++) {
    mix(state);
    table[i] = (state[0] ^ state[2]) >>> 0;
  }
  for (let i = 0; i < ROUNDS; i++) {
    for (let index = 0; index < BLOCKS; index++) {
      const tableIndex = table[index] & MASK;
      let value = table[index] + table[tableIndex] >>> 0;
      value = rot(value, 13);
      value = (value ^ mul(table[(index + 1) & MASK], MUL_A)) >>> 0;
      table[index] = value;
      state[0] = (state[0] ^ value) >>> 0;
      mix(state);
    }
  }
  const out = new Uint32Array(8);
  const width = BLOCKS / 8;
  for (let i = 0; i < 8; i++) {
    mix(state);
    let value = state[0];
    const offset = i * width;
    for (let index = 0; index < width; index++) {
      const tableValue = table[offset + index];
      value = value + tableValue >>> 0;
      value = rot(value, 5);
      value = (value ^ mul(tableValue, MUL_B)) >>> 0;
    }
    out[i] = (value ^ state[2]) >>> 0;
  }
  return out;
}

function latin1Bytes(value) {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 255;
  return out;
}

function leadingZeros(value) {
  let total = 0;
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (item === 0) {
      total += 32;
      continue;
    }
    return total + Math.clz32(item);
  }
  return total;
}

function solvePoW(nonce, difficulty) {
  const prefix = `${nonce}:`;
  for (let counter = 0; ; counter++) {
    if (leadingZeros(hash(latin1Bytes(prefix + counter))) >= difficulty) return String(counter);
  }
}

export function canExtractByse(url) {
  return /(?:bysesayeveum\.com|gn1r5n\.org)\/e\//i.test(String(url));
}

export async function extractByse(embedUrl, { fetchImpl = fetch, userAgent = DEFAULT_USER_AGENT, referer } = {}) {
  const code = String(embedUrl).match(/\/e\/([a-z0-9]+)/i)?.[1];
  if (!code) throw new Error(`Cannot extract Byse code from ${embedUrl}`);
  const embedOrigin = new URL(embedUrl).origin;
  const parentUrl = referer || embedUrl;
  const parentHost = new URL(parentUrl).hostname;
  const embedHeaders = {
    "X-Embed-Origin": parentHost,
    "X-Embed-Referer": parentUrl,
    "X-Embed-Parent": embedUrl,
  };
  const detailsResponse = await fetchImpl(`${embedOrigin}/api/videos/${code}/embed/details`, {
    headers: { "User-Agent": userAgent, "Referer": embedUrl, ...embedHeaders }
  });
  if (!detailsResponse.ok) throw new Error(`Byse details HTTP ${detailsResponse.status}`);
  const details = await detailsResponse.json();
  const frameUrl = details.embed_frame_url || embedUrl;
  const frameBase = new URL(frameUrl).origin;
  const challengeResponse = await fetchImpl(`${frameBase}/api/videos/access/challenge`, {
    method: "POST",
    headers: { "Content-Length": "0", "Origin": frameBase, "Referer": frameUrl, "User-Agent": userAgent }
  });
  if (!challengeResponse.ok) throw new Error(`Byse challenge HTTP ${challengeResponse.status}`);
  const challenge = await challengeResponse.json();
  const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keyPair.privateKey, new TextEncoder().encode(challenge.nonce));
  const attestResponse = await fetchImpl(`${frameBase}/api/videos/access/attest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": userAgent },
    body: JSON.stringify({ nonce: challenge.nonce, challenge_id: challenge.challenge_id, public_key: publicKey, signature: b64u(signature) })
  });
  if (!attestResponse.ok) throw new Error(`Byse attest HTTP ${attestResponse.status}`);
  const attest = await attestResponse.json();
  const cookie = `byse_viewer_id=${attest.viewer_id}; byse_device_id=${attest.device_id}`;
  const fingerprint = { token: attest.token, viewer_id: attest.viewer_id, device_id: attest.device_id, confidence: attest.confidence };
  const captchaResponse = await fetchImpl(`${frameBase}/api/videos/${code}/embed/captcha`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": userAgent, "Cookie": cookie, ...embedHeaders },
    body: JSON.stringify({ fingerprint })
  });
  if (!captchaResponse.ok) throw new Error(`Byse captcha HTTP ${captchaResponse.status}`);
  const captcha = await captchaResponse.json();
  const verifyResponse = await fetchImpl(`${frameBase}/api/videos/${code}/embed/captcha/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": userAgent, "Cookie": cookie, ...embedHeaders },
    body: JSON.stringify({ pow_token: captcha.pow_token, solution: solvePoW(captcha.pow_nonce, captcha.pow_difficulty), fingerprint })
  });
  if (!verifyResponse.ok) throw new Error(`Byse verify HTTP ${verifyResponse.status}`);
  const verification = await verifyResponse.json();
  const playbackResponse = await fetchImpl(`${frameBase}/api/videos/${code}/embed/playback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": userAgent, "Cookie": cookie, "X-Captcha-Token": verification.token, ...embedHeaders },
    body: JSON.stringify({ fingerprint })
  });
  if (!playbackResponse.ok) throw new Error(`Byse playback HTTP ${playbackResponse.status}`);
  const playbackData = await playbackResponse.json();
  const playback = playbackData.playback;
  const keyBytes = Buffer.concat(playback.key_parts.filter((item) => b64uDec(item).length === 16).map(b64uDec));
  const aesKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64uDec(playback.iv) }, aesKey, b64uDec(playback.payload));
  return JSON.parse(new TextDecoder().decode(decrypted)).sources.map((item) => item.url);
}
