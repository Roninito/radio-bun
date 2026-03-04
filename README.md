# radio-bun

Internet radio CLI + HTTP/web manager built with Bun and MPV.

## Prerequisites

- [Bun](https://bun.sh/)
- [MPV](https://mpv.io/installation/)
- Git

## Install

### macOS / Linux (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Roninito/radio-bun/main/install.sh | bash
```

This script installs MPV (if missing), installs Bun (if missing), clones the repo, installs dependencies, and links the `radio` command.

### Windows (manual)

1. Install Bun: https://bun.sh/docs/installation
2. Install MPV: https://mpv.io/installation/
3. Clone and install:

```powershell
git clone https://github.com/Roninito/radio-bun.git
cd radio-bun
bun install
bun run src/cli.ts --help
```

Use `bun run src/cli.ts <command>` on Windows, or add your own wrapper script if you want a `radio` command.

### From source (macOS/Linux)

```bash
git clone https://github.com/Roninito/radio-bun.git
cd radio-bun
bun install
mkdir -p ~/.bun/bin
ln -sf "$(pwd)/src/cli.ts" ~/.bun/bin/radio
```

## Quick start

```bash
radio search jazz
radio play 1
radio vol 60
radio status
radio pause
radio stop
```

## Usage

### Search and play

- `radio search <term>` - search stations
  - options: `--country <name>`, `--tag <name>`, `--limit <n>`
- `radio play <index>` - play from the last cached search/favorites list
- `radio play` - replay the last played station

### Playback controls

- `radio pause` - toggle pause
- `radio stop` - stop playback
- `radio vol <0-100>` - set volume
- `radio status` - current playback status

### Favorites

- `radio add <index>` - add station by cached index
- `radio add` - add currently playing station
- `radio favs` - list favorites (and cache them for `radio play <index>`)
- `radio remove <index>` - remove favorite by number

### Daemon and web UI

- `radio view` - open web UI (starts daemon automatically)
- `radio server --port 4242` - run server in foreground
- `radio quit` - stop daemon and MPV

The daemon listens on `http://localhost:4242` by default (or `RADIO_PORT`).

## Troubleshooting

- **`radio` command not found:** ensure Bun global bin is on PATH (`~/.bun/bin` on macOS/Linux, `%USERPROFILE%\.bun\bin` on Windows).
- **No audio / playback fails:** verify MPV is installed and available as `mpv` in terminal.
- **`radio play <n>` says no cached search:** run `radio search ...` first, or `radio favs` before playing from favorites.

## Development

```bash
bun install
bun run dev      # run CLI entry directly
bun run serve    # run HTTP server
bun run build    # build compiled binary
```
