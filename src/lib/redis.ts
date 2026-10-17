import net from "node:net";
import tls from "node:tls";

const COMMAND_TIMEOUT_MS = 300;

interface PendingCommand {
  resolve: (val: any) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

class LightweightRedisClient {
  private url: URL | null = null;
  private lastUrlStr = "";
  private socket: net.Socket | null = null;
  private connected = false;
  private connecting: Promise<boolean> | null = null;
  private queue: PendingCommand[] = [];
  private buffer: Buffer = Buffer.alloc(0);
  private lastFailAt = 0;

  private getUrl(): URL | null {
    const raw = process.env.REDIS_URL || "";
    if (!raw) return null;
    if (raw !== this.lastUrlStr) {
      this.lastUrlStr = raw;
      try {
        this.url = new URL(raw);
      } catch {
        this.url = null;
      }
    }
    return this.url;
  }

  public isConfigured(): boolean {
    return this.getUrl() !== null;
  }

  private encodeCommand(args: Array<string | number>): Buffer {
    let out = `*${args.length}\r\n`;
    for (const arg of args) {
      const str = String(arg);
      const byteLen = Buffer.byteLength(str, "utf8");
      out += `$${byteLen}\r\n${str}\r\n`;
    }
    return Buffer.from(out, "utf8");
  }

  private parseNext(): { parsed: boolean; value?: any; error?: Error } {
    if (this.buffer.length < 3) return { parsed: false };
    const prefix = String.fromCharCode(this.buffer[0]);
    const lineEnd = this.buffer.indexOf("\r\n");
    if (lineEnd === -1) return { parsed: false };

    const header = this.buffer.subarray(1, lineEnd).toString("utf8");

    if (prefix === "+") {
      this.buffer = this.buffer.subarray(lineEnd + 2);
      return { parsed: true, value: header };
    }
    if (prefix === "-") {
      this.buffer = this.buffer.subarray(lineEnd + 2);
      return { parsed: true, error: new Error(header) };
    }
    if (prefix === ":") {
      this.buffer = this.buffer.subarray(lineEnd + 2);
      return { parsed: true, value: Number(header) };
    }
    if (prefix === "$") {
      const len = Number(header);
      if (len === -1) {
        this.buffer = this.buffer.subarray(lineEnd + 2);
        return { parsed: true, value: null };
      }
      const totalNeeded = lineEnd + 2 + len + 2;
      if (this.buffer.length < totalNeeded) return { parsed: false };
      const strVal = this.buffer
        .subarray(lineEnd + 2, lineEnd + 2 + len)
        .toString("utf8");
      this.buffer = this.buffer.subarray(totalNeeded);
      return { parsed: true, value: strVal };
    }
    if (prefix === "*") {
      const count = Number(header);
      if (count <= 0) {
        this.buffer = this.buffer.subarray(lineEnd + 2);
        return { parsed: true, value: [] };
      }
      const saved = this.buffer;
      this.buffer = this.buffer.subarray(lineEnd + 2);
      const items: any[] = [];
      for (let i = 0; i < count; i++) {
        const sub = this.parseNext();
        if (!sub.parsed) {
          this.buffer = saved;
          return { parsed: false };
        }
        items.push(sub.value);
      }
      return { parsed: true, value: items };
    }

    this.buffer = Buffer.alloc(0);
    return { parsed: true, value: null };
  }

  private drainBuffer() {
    while (this.queue.length > 0 && this.buffer.length > 0) {
      const res = this.parseNext();
      if (!res.parsed) break;
      const pending = this.queue.shift()!;
      clearTimeout(pending.timer);
      if (res.error) pending.reject(res.error);
      else pending.resolve(res.value);
    }
  }

  private failAll(err: Error) {
    while (this.queue.length > 0) {
      const p = this.queue.shift()!;
      clearTimeout(p.timer);
      p.reject(err);
    }
  }

  private async ensureConnected(): Promise<boolean> {
    const u = this.getUrl();
    if (!u) return false;
    if (this.connected && this.socket && !this.socket.destroyed) return true;
    if (Date.now() - this.lastFailAt < 5_000) return false;
    if (this.connecting) return this.connecting;

    this.connecting = new Promise<boolean>((resolve) => {
      const port = Number(u.port) || 6379;
      const host = u.hostname || "127.0.0.1";
      const isTls = u.protocol === "rediss:";

      const sock = isTls
        ? tls.connect({ host, port, servername: host })
        : net.createConnection({ host, port });

      const connectTimer = setTimeout(() => {
        sock.destroy();
        this.lastFailAt = Date.now();
        this.connecting = null;
        resolve(false);
      }, COMMAND_TIMEOUT_MS);

      sock.on("connect", async () => {
        clearTimeout(connectTimer);
        this.socket = sock;
        this.connected = true;
        this.buffer = Buffer.alloc(0);

        const password = decodeURIComponent(u.password || "");
        const username = decodeURIComponent(u.username || "");
        const dbPath = u.pathname?.replace("/", "");

        try {
          if (password) {
            if (username && username !== "default") {
              await this.sendRaw(["AUTH", username, password]);
            } else {
              await this.sendRaw(["AUTH", password]);
            }
          }
          if (dbPath && Number.isFinite(Number(dbPath)) && Number(dbPath) > 0) {
            await this.sendRaw(["SELECT", Number(dbPath)]);
          }
          this.connecting = null;
          resolve(true);
        } catch {
          sock.destroy();
          this.connected = false;
          this.lastFailAt = Date.now();
          this.connecting = null;
          resolve(false);
        }
      });

      sock.on("data", (chunk: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.drainBuffer();
      });

      sock.on("error", (err) => {
        clearTimeout(connectTimer);
        this.connected = false;
        this.lastFailAt = Date.now();
        this.connecting = null;
        this.failAll(err);
        resolve(false);
      });

      sock.on("close", () => {
        this.connected = false;
        this.failAll(new Error("Redis socket closed"));
      });
    });

    return this.connecting;
  }

  private sendRaw(args: Array<string | number>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) {
        return reject(new Error("Socket not connected"));
      }
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((q) => q.timer === timer);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new Error("Redis command timeout"));
      }, COMMAND_TIMEOUT_MS);

      this.queue.push({ resolve, reject, timer });
      this.socket.write(this.encodeCommand(args));
    });
  }

  public async exec(args: Array<string | number>): Promise<any> {
    if (!this.isConfigured()) return null;
    const ok = await this.ensureConnected();
    if (!ok) return null;
    try {
      return await this.sendRaw(args);
    } catch {
      return null;
    }
  }
}

const redisClient = new LightweightRedisClient();

export async function redisGet(key: string): Promise<string | null> {
  const res = await redisClient.exec(["GET", `kitsune:${key}`]);
  return typeof res === "string" ? res : null;
}

export async function redisSet(
  key: string,
  value: string,
  ttlMs: number,
): Promise<boolean> {
  const px = Math.max(1000, Math.ceil(ttlMs));
  const res = await redisClient.exec(["SET", `kitsune:${key}`, value, "PX", px]);
  return res === "OK";
}

export async function redisDel(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  await redisClient.exec(["DEL", ...keys.map((k) => `kitsune:${k}`)]);
}

export async function redisKeys(pattern: string): Promise<string[]> {
  const res = await redisClient.exec(["KEYS", `kitsune:${pattern}`]);
  if (!Array.isArray(res)) return [];
  return res.map((k: string) => String(k).replace(/^kitsune:/, ""));
}

export function isRedisConfigured(): boolean {
  return redisClient.isConfigured();
}
