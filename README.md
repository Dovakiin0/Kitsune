![logo.png](logo.png)

# Kitsune

Watch your favourite anime anywhere, anytime. No ads, no popups.

Kitsune is a modern, open-source anime streaming web application built with [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/).

---

## Features

- **Ad-Free Experience**: No popups, redirects, or third-party ads.
- **PWA Ready**: Installable as a Progressive Web App on mobile and desktop.
- **Rich Anime Discovery**: Explore trending, popular, seasonal anime, search suggestions, and filters powered by AniList.
- **Advanced Player**: Integrated ArtPlayer with custom HLS playback, audio/subtitles selector, and auto-skip for intro/outro.
- **User Profiles & Sync**: Bookmarks and watch progress tracking powered by [PocketBase](https://pocketbase.io).
- **Kitsune Companion**: Lightweight optional desktop helper to bypass ISP restrictions and CORS blocking.

---

## Prerequisites

- **Node.js**: `v20.x` or later (Node 20+ recommended)
- **PocketBase**: For user authentication, bookmarks, and watch history
- **(Optional) Redis**: For faster caching of AniList metadata and video manifests (in-memory cache is used if omitted)
- **(Optional) Go**: `1.22+` if you want to run or build the Kitsune Companion from source

---

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

| Variable                      | Required | Default                  | Description                                             |
| ----------------------------- | -------- | ------------------------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_POCKETBASE_URL`  | Yes      | `http://localhost:8090`  | PocketBase instance URL                                 |
| `REDIS_URL`                   | No       | _None_                   | Redis connection string (e.g. `redis://localhost:6379`) |
| `NEXT_PUBLIC_LOCAL_PROXY_URL` | No       | `http://127.0.0.1:43210` | URL of the local Kitsune Companion                      |
| `DOMAIN_URL`                  | No       | `localhost:3000`         | Host domain for OpenGraph cards                         |

---

## Running Locally

1. **Clone the repository**:

   ```bash
   git clone https://github.com/dovakiin0/Kitsune.git
   cd Kitsune
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## PocketBase Setup

Kitsune uses PocketBase to manage users, authentication, bookmarks, and watch history.

1. Download and run [PocketBase](https://pocketbase.io/docs/):
   ```bash
   ./pocketbase serve --http="0.0.0.0:8090"
   ```
2. Open the Admin UI at `http://localhost:8090/_/` and create your superadmin account.
3. In the PocketBase dashboard, navigate to **Settings > Import Collections**.
4. Import the schema file located in [docs/pb.json](docs/pb.json).
5. (Optional) Under **Settings > Auth Providers**, configure OAuth2 providers (Discord) if desired.

---

## Kitsune Companion

The **Kitsune Companion** is an optional desktop utility that runs locally on your computer (`http://127.0.0.1:43210`). It routes video streams directly from your personal IP address, bypassing ISP blocks, Cloudflare challenges, and browser CORS limitations.

The web app automatically detects when Companion is running.

### Option A: Run from Source

Requires [Go](https://go.dev/dl/) installed:

```bash
cd companion
go run .
```

To build a standalone executable:

```bash
cd companion
go build -o kitsune-companion .
./kitsune-companion
```

### Option B: Download Prebuilt Binary

Download the precompiled binary for Windows, macOS, or Linux from the [GitHub Releases](https://github.com/dovakiin0/Kitsune/releases/latest) page and run it. It runs in the system tray and includes a local web UI at `http://127.0.0.1:43210/ui`.

---

## Docker Setup

### Option 1: Docker Compose (Recommended)

Start Kitsune with an accompanying Redis instance:

```bash
docker compose up -d --build
```

Access the app at `http://localhost:3000`.

### Option 2: Dockerfile Build

1. **Build the container image**:

   ```bash
   docker build -t kitsune .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_POCKETBASE_URL="http://host.docker.internal:8090" \
     kitsune
   ```

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m "feat: add feature"`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

---

## Community & Support

- Discord: [https://discord.gg/6yAJ3XDHTt](https://discord.gg/6yAJ3XDHTt)
