# radio-bun

Internet radio CLI + HTTP control server built with Bun and MPV.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [MPV](https://mpv.io/) media player (`brew install mpv` on macOS)

## Setup

```bash
cd radio-bun
bun install
```

### Global install (optional)

```bash
bun link .
# Now `radio` is available system-wide
```

## CLI Usage

```bash
# Search for stations
radio search "jazz"
radio search "bbc" --country "United Kingdom" --limit 10

# Play a station from the last search (by number)
radio play 1

# Transport controls
radio pause       # toggle pause
radio stop        # stop playback
radio vol 75      # set volume (0-100)
radio status      # show what's playing

# Start the HTTP server + web UI
radio server
radio server --port 8080
```

## HTTP API

Start the server with `radio server` (default port 4242), then:

| Endpoint | Params | Description |
|---|---|---|
| `GET /api/search` | `q`, `limit`, `country`, `tag` | Search stations |
| `GET /api/play` | `i` (index from last search) | Play a station |
| `GET /api/pause` | — | Toggle pause |
| `GET /api/stop` | — | Stop playback |
| `GET /api/vol` | `v` (0-100) | Set volume |
| `GET /api/status` | — | Current playback state |

A web UI is served at `http://localhost:4242`.

## How It Works

1. **`radio search`** hits the [Radio-Browser](https://www.radio-browser.info/) API and caches results locally.
2. **`radio play`** reads the cache, sends a click to the API (for stats), and tells MPV to stream the URL.
3. **MPV** runs once in idle/audio-only mode. All commands (`play`, `pause`, `stop`, `vol`) are sent over an IPC socket via `node-mpv` — no new process per track.
4. **`radio server`** wraps the same player in a `Bun.serve` HTTP API so you can control playback from scripts, curl, or the built-in web UI.

## License

MIT
