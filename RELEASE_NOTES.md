## Release Notes for v1.1.6

### Installer Reliability Fix

- Fixed Bun global-install failure caused by `bun install -g .` (`DependencyLoop` on Bun 1.3.9).
- Updated `install.sh` to link the CLI at `~/.bun/bin/radio` instead of global package install.
- Updated README install instructions:
  - macOS/Linux: symlink-based CLI setup
  - Windows: use `bun run src/cli.ts <command>`

---

## Release Notes for v1.1.5

### Documentation and Release Consistency

- Rewrote `README.md` with complete install and usage instructions:
  - platform-specific install flows (macOS/Linux script + Windows manual)
  - command reference for search, playback, favorites, daemon, and web UI
  - quick start, troubleshooting, and development commands
- Updated project version metadata to `1.1.5` for release alignment.

---

## Release Notes for v1.1.0

### Windows PATH Management Improvements

This release includes significant enhancements for automatic PATH handling, making troubleshooting easier for Windows users. 

- Improved automatic management of system PATH variables.
- Enhanced logging for better clarity on PATH related issues.
- Steps to troubleshoot common PATH errors on Windows.

These improvements aim to provide a seamless experience for Windows users when managing their PATH settings.
