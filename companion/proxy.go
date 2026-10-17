package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var (
	flixImageXorKey = []byte{
		157, 42, 241, 71, 179, 142, 92, 112,
		166, 25, 228, 59, 216, 98, 15, 197,
	}
	uriAttrRegex = regexp.MustCompile(`URI="([^"]+)"`)
	httpClient   = &http.Client{
		Timeout: 30 * time.Second,
	}
)

const defaultUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

func decryptFlixManifest(raw []byte, playlistKey string) string {
	trimmed := strings.TrimSpace(string(raw))
	if strings.HasPrefix(trimmed, "#EXTM3U") || playlistKey == "" {
		return trimmed
	}
	key, err := base64.StdEncoding.DecodeString(playlistKey)
	if err != nil || len(key) == 0 {
		return trimmed
	}
	payload, err := base64.StdEncoding.DecodeString(trimmed)
	if err != nil || len(payload) == 0 {
		return trimmed
	}
	out := make([]byte, len(payload))
	for i := range payload {
		out[i] = payload[i] ^ key[i%len(key)]
	}
	text := strings.TrimSpace(string(out))
	if strings.HasPrefix(text, "#EXTM3U") {
		return text
	}
	return trimmed
}

func unwrapFlixImageSegment(body []byte) ([]byte, bool) {
	offset := 0
	needsXor := false

	isWebp := len(body) > 12 &&
		body[0] == 0x52 && body[1] == 0x49 && body[2] == 0x46 && body[3] == 0x46 &&
		body[8] == 0x57 && body[9] == 0x45 && body[10] == 0x42 && body[11] == 0x50

	isPng := len(body) > 8 &&
		body[0] == 0x89 && body[1] == 0x50 && body[2] == 0x4e && body[3] == 0x47 &&
		body[4] == 0x0d && body[5] == 0x0a && body[6] == 0x1a && body[7] == 0x0a

	if isWebp {
		offset = 12
		needsXor = body[offset] != 0x47
	} else if isPng {
		offset = 8
		needsXor = body[offset] != 0x47
	}

	if offset == 0 {
		return body, false
	}

	out := make([]byte, len(body)-offset)
	copy(out, body[offset:])
	if needsXor {
		for i := range out {
			out[i] ^= flixImageXorKey[i%len(flixImageXorKey)]
		}
	}
	return out, true
}

func resolveRelativeURL(baseStr, refStr, origin string) string {
	if strings.HasPrefix(refStr, "http://") || strings.HasPrefix(refStr, "https://") {
		return refStr
	}
	if strings.HasPrefix(refStr, "/") {
		return origin + refStr
	}
	baseU, err := url.Parse(baseStr)
	if err != nil {
		return baseStr + refStr
	}
	refU, err := url.Parse(refStr)
	if err != nil {
		return baseStr + refStr
	}
	return baseU.ResolveReference(refU).String()
}

func (s *CompanionState) handleProxy(w http.ResponseWriter, r *http.Request) {
	setCorsPNAHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if !s.running.Load() {
		http.Error(w, "Companion proxy is stopped", http.StatusServiceUnavailable)
		return
	}

	q := r.URL.Query()
	targetURL := q.Get("url")
	refererParam := q.Get("referer")
	headersParam := q.Get("headers")
	playlistKey := q.Get("playlist_key")

	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	targetURI, err := url.Parse(targetURL)
	if err != nil || targetURI.Scheme == "" || targetURI.Host == "" {
		http.Error(w, "Invalid target url", http.StatusBadRequest)
		return
	}
	origin := targetURI.Scheme + "://" + targetURI.Host

	customHeaders := map[string]string{}
	if headersParam != "" {
		_ = json.Unmarshal([]byte(headersParam), &customHeaders)
	}

	referer := refererParam
	if referer == "" {
		if v, ok := customHeaders["Referer"]; ok {
			referer = v
		} else if v, ok := customHeaders["referer"]; ok {
			referer = v
		}
	}
	if referer == "" || strings.Contains(referer, "localhost") || strings.Contains(referer, "127.0.0.1") {
		referer = origin + "/"
	}

	refererOrigin := origin
	if refU, err := url.Parse(referer); err == nil && refU.Scheme != "" && refU.Host != "" {
		refererOrigin = refU.Scheme + "://" + refU.Host
	}

	doUpstream := func(includeReferer bool) (*http.Response, error) {
		req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, targetURL, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("User-Agent", defaultUA)
		req.Header.Set("Accept", "*/*")
		req.Header.Set("Accept-Language", "en-US,en;q=0.9")
		for k, v := range customHeaders {
			req.Header.Set(k, v)
		}
		if includeReferer {
			req.Header.Set("Referer", referer)
			if customHeaders["Origin"] == "" && customHeaders["origin"] == "" {
				req.Header.Set("Origin", refererOrigin)
			}
		} else {
			req.Header.Del("Referer")
			req.Header.Del("Origin")
		}
		return httpClient.Do(req)
	}

	resp, err := doUpstream(true)
	if err != nil {
		http.Error(w, "Upstream fetch error: "+err.Error(), http.StatusBadGateway)
		return
	}
	if resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusNotFound {
		_ = resp.Body.Close()
		resp, err = doUpstream(false)
		if err != nil {
			http.Error(w, "Upstream retry error: "+err.Error(), http.StatusBadGateway)
			return
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		http.Error(w, fmt.Sprintf("Upstream returned %d", resp.StatusCode), resp.StatusCode)
		return
	}

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed reading upstream body", http.StatusBadGateway)
		return
	}

	s.requestsProxied.Add(1)
	s.bytesProxied.Add(uint64(len(rawBody)))

	contentType := strings.ToLower(resp.Header.Get("Content-Type"))
	urlWithoutQuery := strings.Split(targetURL, "?")[0]

	isM3u8 := playlistKey != "" ||
		strings.HasSuffix(strings.ToLower(urlWithoutQuery), ".m3u8") ||
		strings.Contains(contentType, "mpegurl") ||
		strings.Contains(contentType, "x-mpegurl") ||
		strings.Contains(contentType, "vnd.apple.mpegurl")

	host := r.Host
	if host == "" {
		host = fmt.Sprintf("127.0.0.1:%d", s.port)
	}
	proxyBase := fmt.Sprintf("http://%s/proxy", host)

	buildProxyLink := func(absURL string, includeKey bool) string {
		vals := url.Values{}
		vals.Set("url", absURL)
		if referer != "" {
			vals.Set("referer", referer)
		}
		if headersParam != "" {
			vals.Set("headers", headersParam)
		}
		if includeKey && playlistKey != "" {
			vals.Set("playlist_key", playlistKey)
		}
		return proxyBase + "?" + vals.Encode()
	}

	if isM3u8 {
		manifestText := decryptFlixManifest(rawBody, playlistKey)
		if strings.HasPrefix(manifestText, "#EXTM3U") || strings.HasSuffix(strings.ToLower(urlWithoutQuery), ".m3u8") {
			lastSlash := strings.LastIndex(urlWithoutQuery, "/")
			baseURL := urlWithoutQuery
			if lastSlash >= 0 {
				baseURL = urlWithoutQuery[:lastSlash+1]
			}
			isMaster := strings.Contains(manifestText, "#EXT-X-STREAM-INF")

			lines := strings.Split(strings.ReplaceAll(manifestText, "\r\n", "\n"), "\n")
			for i, line := range lines {
				trimmed := strings.TrimSpace(line)
				if trimmed == "" || strings.HasPrefix(trimmed, "#") {
					if strings.HasPrefix(trimmed, "#EXT-X-KEY:") ||
						strings.HasPrefix(trimmed, "#EXT-X-MAP:") ||
						strings.HasPrefix(trimmed, "#EXT-X-MEDIA:") {
						lines[i] = uriAttrRegex.ReplaceAllStringFunc(trimmed, func(m string) string {
							sub := uriAttrRegex.FindStringSubmatch(m)
							if len(sub) < 2 {
								return m
							}
							abs := resolveRelativeURL(baseURL, sub[1], origin)
							isChild := strings.HasSuffix(strings.Split(abs, "?")[0], ".m3u8") ||
								strings.HasPrefix(trimmed, "#EXT-X-MEDIA:")
							return fmt.Sprintf(`URI="%s"`, buildProxyLink(abs, isChild))
						})
					}
					continue
				}
				segURL := resolveRelativeURL(baseURL, trimmed, origin)
				isChild := isMaster || strings.HasSuffix(strings.Split(segURL, "?")[0], ".m3u8")
				lines[i] = buildProxyLink(segURL, isChild)
			}

			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
			w.Header().Set("Cache-Control", "no-cache")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(strings.Join(lines, "\n")))
			return
		}
	}

	finalBody, unwrapped := unwrapFlixImageSegment(rawBody)
	if unwrapped {
		w.Header().Set("Content-Type", "video/mp2t")
	} else if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(finalBody)
}

func (s *CompanionState) handleFetch(w http.ResponseWriter, r *http.Request) {
	setCorsPNAHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if !s.running.Load() {
		http.Error(w, "Companion proxy is stopped", http.StatusServiceUnavailable)
		return
	}

	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	var reqBody io.Reader
	if r.Method == http.MethodPost {
		b, _ := io.ReadAll(r.Body)
		reqBody = bytes.NewReader(b)
	}

	upReq, err := http.NewRequestWithContext(r.Context(), r.Method, targetURL, reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	upReq.Header.Set("User-Agent", defaultUA)

	if headersJSON := r.URL.Query().Get("headers"); headersJSON != "" {
		custom := map[string]string{}
		if json.Unmarshal([]byte(headersJSON), &custom) == nil {
			for k, v := range custom {
				upReq.Header.Set(k, v)
			}
		}
	}

	resp, err := httpClient.Do(upReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	s.requestsProxied.Add(1)
	s.bytesProxied.Add(uint64(len(body)))

	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}
