package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"
)

const Version = "1.0.0"

type CompanionState struct {
	running         atomic.Bool
	port            int
	requestsProxied atomic.Uint64
	bytesProxied    atomic.Uint64
	startedAt       atomic.Int64
	quitCh          chan struct{}
}

func NewCompanionState(port int) *CompanionState {
	s := &CompanionState{
		port:   port,
		quitCh: make(chan struct{}),
	}
	s.running.Store(true)
	s.startedAt.Store(time.Now().Unix())
	return s
}

func (s *CompanionState) SetRunning(v bool) {
	was := s.running.Swap(v)
	if v && !was {
		s.startedAt.Store(time.Now().Unix())
	} else if !v {
		s.startedAt.Store(0)
	}
}

func setCorsPNAHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Private-Network", "true")
}

func main() {
	portFlag := flag.Int("port", 43210, "Local loopback port to listen on")
	noBrowser := flag.Bool("no-browser", false, "Do not auto-open control window on startup")
	flag.Parse()

	if envPort := os.Getenv("PORT"); envPort != "" {
		var p int
		if _, err := fmt.Sscanf(envPort, "%d", &p); err == nil && p > 0 && p <= 65535 {
			*portFlag = p
		}
	}

	state := NewCompanionState(*portFlag)
	addr := fmt.Sprintf("127.0.0.1:%d", state.port)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		setCorsPNAHeaders(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		if !state.running.Load() {
			w.WriteHeader(http.StatusServiceUnavailable)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"ok":      false,
				"mode":    "local",
				"running": false,
				"version": Version,
			})
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":      true,
			"mode":    "local",
			"running": true,
			"version": Version,
		})
	})

	mux.HandleFunc("/api/status", state.handleStatus)
	mux.HandleFunc("/api/control", state.handleControl)
	mux.HandleFunc("/proxy", state.handleProxy)
	mux.HandleFunc("/api/proxy", state.handleProxy)
	mux.HandleFunc("/fetch", state.handleFetch)
	mux.HandleFunc("/icon.png", state.handleIcon)
	mux.HandleFunc("/favicon.ico", state.handleIcon)
	mux.HandleFunc("/ui", state.handleUI)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/ui" {
			state.handleUI(w, r)
			return
		}
		setCorsPNAHeaders(w)
		http.NotFound(w, r)
	})

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		log.Printf("Port %s is already in use (another Companion instance may be running): %v", addr, err)
		if !*noBrowser {
			openControlWindow(fmt.Sprintf("http://%s/ui", addr))
		}
		os.Exit(1)
	}

	srv := &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("Kitsune Companion v%s listening on http://%s (UI: http://%s/ui)", Version, addr, addr)
		if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	go func() {
		select {
		case <-sigCh:
			close(state.quitCh)
		case <-state.quitCh:
		}
	}()

	uiURL := fmt.Sprintf("http://%s/ui", addr)
	if !*noBrowser {
		go func() {
			time.Sleep(150 * time.Millisecond)
			openControlWindow(uiURL)
		}()
	}

	runPlatformTray(state, uiURL)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
