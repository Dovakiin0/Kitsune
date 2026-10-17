import crypto from "node:crypto";

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const KEY = Buffer.from("6b69656d7469656e6d75613931316361", "hex");
const IV = Buffer.from("313233343536373839306f6975797472", "hex");

export function canExtractNova(url) {
  return /upn\.one/i.test(String(url));
}

export async function extractNova(embedUrl, { fetchImpl = fetch, userAgent = DEFAULT_USER_AGENT } = {}) {
  const id = String(embedUrl).match(/upn\.one\/#([A-Za-z0-9]+)/i)?.[1];
  if (!id) throw new Error(`Cannot extract Nova id from ${embedUrl}`);
  const response = await fetchImpl(`https://nova.upn.one/api/v1/video?id=${id}&w=1920&h=1080&r=`, {
    headers: { "User-Agent": userAgent, "Referer": "https://nova.upn.one/" }
  });
  if (!response.ok) throw new Error(`Nova fetch HTTP ${response.status}`);
  const hex = (await response.text()).trim();
  const decipher = crypto.createDecipheriv("aes-128-cbc", KEY, IV);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]);
  const data = JSON.parse(decrypted.toString("utf8"));
  const url = data.cf ?? data.source;
  if (!url) throw new Error("Nova response missing m3u8 url");
  return [url];
}
