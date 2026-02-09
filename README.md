# radio-bun

Internet radio CLI + HTTP control server built with Bun and MPV.

Search thousands of stations, play them from the terminal, and control playback from anywhere. The CLI never locks your terminal -- a background daemon handles audio.

## Install MPV

MPV is the only external dependency. Install it for your OS:

### macOS (Homebrew)

```bash
brew install mpv
```

### Ubuntu / Debian

```bash
sudo apt-get update && sudo apt-get install -y mpv
```

### Fedora

```bash
sudo dnf install mpv
```

### Arch Linux

```bash
sudo pacman -S mpv
```

### Windows (Scoop)

```powershell
scoop install mpv
```

### Windows (Chocolatey)

```powershell
choco install mpv
```

Verify it's installed:

```bash
mpv --version
```

## Install radio-bun

### 1. Install Bun (if you haven't already)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clone and install globally

```bash
git clone https://github.com/Roninito/radio-bun.git
cd radio-bun
bun install
bun install -g .
```

This puts the `radio` command on your PATH (symlinked into `~/.bun/bin/`). You can now run `radio` from any directory.

### 3. Verify

```bash
radio --version
radio search "jazz"
```

## CLI Usage

```bash
# Search for stations
radio search "jazz"
radio search "bbc" --country "United Kingdom" --limit 10

# Play a station from the last search (by number)
radio play 1

# Replay the last station (no argument needed)
radio play

# Transport controls
radio pause       # toggle pause
radio stop        # stop playback
radio vol 75      # set volume (0-100)
radio status      # show what's playing

# Shut down the background daemon and MPV
radio quit

# Start the HTTP server + web UI in the foreground
radio server
radio server --port 8080
```

A background daemon is started automatically on your first playback command. You don't need to manage it -- `radio play` starts it, `radio quit` stops it.

## HTTP API

The daemon listens on port 4242 by default. You can also start it in the foreground with `radio server`.

| Endpoint | Method | Params | Description |
|---|---|---|---|
| `/api/search` | GET | `q`, `limit`, `country`, `tag` | Search stations |
| `/api/play` | GET | `i` (index from last search) | Play by index (web UI) |
| `/api/play` | POST | `{ uuid, url, name }` | Play a specific station (CLI) |
| `/api/pause` | GET | -- | Toggle pause |
| `/api/stop` | GET | -- | Stop playback |
| `/api/vol` | GET | `v` (0-100) | Set volume |
| `/api/status` | GET | -- | Current playback state |
| `/api/quit` | GET | -- | Shut down daemon + MPV |

A web UI is served at `http://localhost:4242`.

## Run as a system service (optional)

If you want the daemon running permanently (e.g. to control it from your phone or another machine), you can set it up as a system service.

### macOS (launchd)

Create `~/Library/LaunchAgents/com.radio-bun.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.radio-bun</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/YOUR_USERNAME/.bun/bin/radio</string>
    <string>server</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>/Users/YOUR_USERNAME/radio-bun</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/Users/YOUR_USERNAME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

Replace `YOUR_USERNAME` with your macOS username, then load it:

```bash
launchctl load ~/Library/LaunchAgents/com.radio-bun.plist
```

To stop: `launchctl unload ~/Library/LaunchAgents/com.radio-bun.plist`

### Linux (systemd)

Create `/etc/systemd/system/radio-bun.service`:

```ini
[Unit]
Description=radio-bun daemon (Bun + MPV)
After=network.target

[Service]
Type=simple
ExecStart=/home/YOUR_USERNAME/.bun/bin/radio server
Restart=on-failure
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/radio-bun
Environment=PATH=/home/YOUR_USERNAME/.bun/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

Replace `YOUR_USERNAME`, then enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable radio-bun
sudo systemctl start radio-bun
```

The HTTP API and web UI will then be available at `http://localhost:4242` at all times.

## How It Works

1. **`radio search`** hits the [Radio-Browser](https://www.radio-browser.info/) API and caches results to `~/.radio-bun/`.
2. **`radio play`** auto-starts a background daemon (if not already running), sends the station to it over HTTP, and returns immediately.
3. **MPV** runs once in idle/audio-only mode inside the daemon. All commands are sent over an IPC socket via `node-mpv` -- no new process per track.
4. **`radio stop`** stops playback. **`radio quit`** shuts down the daemon and MPV entirely.
5. **`radio server`** runs the daemon in the foreground for manual or service use. The same JSON API powers the CLI, scripts, and the built-in web UI.

## License

MIT
