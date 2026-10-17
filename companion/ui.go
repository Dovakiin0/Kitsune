package main

import (
	_ "embed"
	"encoding/json"
	"net/http"
	"time"
)

//go:generate go run gen_assets.go

//go:embed icon.png
var iconPNG []byte

func (s *CompanionState) handleIcon(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(iconPNG)
}

func (s *CompanionState) handleStatus(w http.ResponseWriter, r *http.Request) {
	setCorsPNAHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	running := s.running.Load()
	var uptime int64
	if running {
		started := s.startedAt.Load()
		if started > 0 {
			uptime = time.Now().Unix() - started
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"running":         running,
		"port":            s.port,
		"version":         Version,
		"requestsProxied": s.requestsProxied.Load(),
		"bytesProxied":    s.bytesProxied.Load(),
		"uptimeSeconds":   uptime,
	})
}

func (s *CompanionState) handleControl(w http.ResponseWriter, r *http.Request) {
	setCorsPNAHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Action string `json:"action"`
	}
	_ = json.NewDecoder(r.Body).Decode(&payload)

	switch payload.Action {
	case "start":
		s.SetRunning(true)
	case "stop":
		s.SetRunning(false)
	case "quit":
		s.SetRunning(false)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "running": false})
		go func() {
			time.Sleep(150 * time.Millisecond)
			select {
			case <-s.quitCh:
			default:
				close(s.quitCh)
			}
		}()
		return
	default:
		http.Error(w, "Invalid action (expected start, stop, or quit)", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"ok":      true,
		"running": s.running.Load(),
	})
}

const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/png" href="/icon.png" />
<title>Kitsune Companion</title>
<style>
  :root {
    --bg: #090d16;
    --card: rgba(17, 24, 39, 0.85);
    --border: rgba(255, 255, 255, 0.08);
    --accent: #e9376b;
    --emerald: #10b981;
    --amber: #f59e0b;
    --text: #f3f4f6;
    --muted: #9ca3af;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(circle at top, #1e1b4b 0%, var(--bg) 70%);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .card {
    width: 100%;
    max-width: 380px;
    background: var(--card);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-img {
    width: 34px;
    height: 34px;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(233, 55, 107, 0.45));
  }
  .title { font-size: 17px; font-weight: 700; letter-spacing: 0.3px; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge.running {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .badge.stopped {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }
  .stat-box {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
  }
  .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-val { font-size: 16px; font-weight: 700; margin-top: 4px; }
  .btn {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: none;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-toggle.start {
    background: var(--emerald);
    color: #052e16;
  }
  .btn-toggle.stop {
    background: var(--accent);
    color: white;
  }
  .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .secondary-row {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .btn-sec {
    flex: 1;
    padding: 9px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-sec:hover { color: var(--text); background: rgba(255, 255, 255, 0.1); }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <img src="/icon.png" class="logo-img" alt="Kitsune" />
        <span class="title">Kitsune Companion</span>
      </div>
      <span id="status-badge" class="badge running">
        <span class="dot"></span>
        <span id="status-text">Running</span>
      </span>
    </div>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-label">Segments</div>
        <div class="stat-val" id="req-val">0</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Data Streamed</div>
        <div class="stat-val" id="bytes-val">0.0 MB</div>
      </div>
    </div>

    <button id="toggle-btn" class="btn btn-toggle stop" onclick="toggleState()">
      Stop
    </button>

    <div class="secondary-row">
      <button class="btn-sec" onclick="minimizeToTray()">Minimize to Tray</button>
      <button class="btn-sec" onclick="quitCompanion()">Quit</button>
    </div>
  </div>

  <script>
    let isRunning = true;
    let keepAliveInTray = false;

    async function refreshStatus() {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        isRunning = Boolean(data.running);
        document.getElementById("req-val").textContent = data.requestsProxied;
        document.getElementById("bytes-val").textContent = (data.bytesProxied / (1024 * 1024)).toFixed(1) + " MB";

        const badge = document.getElementById("status-badge");
        const text = document.getElementById("status-text");
        const btn = document.getElementById("toggle-btn");
        if (isRunning) {
          badge.className = "badge running";
          text.textContent = "Running";
          btn.className = "btn btn-toggle stop";
          btn.textContent = "Stop";
        } else {
          badge.className = "badge stopped";
          text.textContent = "Stopped";
          btn.className = "btn btn-toggle start";
          btn.textContent = "Start";
        }
      } catch (e) {}
    }

    async function toggleState() {
      const action = isRunning ? "stop" : "start";
      await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await refreshStatus();
    }

    function minimizeToTray() {
      keepAliveInTray = true;
      window.close();
    }

    async function quitCompanion() {
      keepAliveInTray = true;
      await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quit" }),
      });
      document.body.innerHTML = "<div style='color:#9ca3af;text-align:center'>Kitsune Companion stopped. You can close this window.</div>";
      setTimeout(() => window.close(), 200);
    }

    let sentQuit = false;
    function onWindowClose() {
      if (!keepAliveInTray && !sentQuit && navigator.sendBeacon) {
        sentQuit = true;
        navigator.sendBeacon("/api/control", JSON.stringify({ action: "quit" }));
      }
    }
    window.addEventListener("beforeunload", onWindowClose);
    window.addEventListener("pagehide", onWindowClose);

    refreshStatus();
    setInterval(refreshStatus, 2000);
  </script>
</body>
</html>`

func (s *CompanionState) handleUI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(dashboardHTML))
}
