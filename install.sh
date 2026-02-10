#!/usr/bin/env bash
# install.sh — radio-bun installer for macOS and Linux
set -euo pipefail

REPO="https://github.com/Roninito/radio-bun.git"
INSTALL_DIR="${RADIO_BUN_DIR:-$HOME/radio-bun}"

# ---------- helpers ----------
info()  { printf '\033[1;34m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m==> %s\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m==> %s\033[0m\n' "$*"; }
fail()  { printf '\033[1;31m==> %s\033[0m\n' "$*"; exit 1; }

command_exists() { command -v "$1" &>/dev/null; }

# ---------- detect OS & package manager ----------
detect_os() {
  case "$(uname -s)" in
    Darwin*) OS="macos" ;;
    Linux*)  OS="linux" ;;
    *)       fail "Unsupported OS: $(uname -s). Use install.ps1 for Windows." ;;
  esac
}

detect_pkg() {
  if   command_exists brew;    then PKG="brew"
  elif command_exists apt-get; then PKG="apt"
  elif command_exists dnf;     then PKG="dnf"
  elif command_exists pacman;  then PKG="pacman"
  elif command_exists zypper;  then PKG="zypper"
  elif command_exists apk;     then PKG="apk"
  else PKG="none"
  fi
}

# ---------- install MPV ----------
install_mpv() {
  if command_exists mpv; then
    ok "MPV already installed ($(mpv --version | head -1))"
    return
  fi

  info "Installing MPV..."
  case "$PKG" in
    brew)   brew install mpv ;;
    apt)    sudo apt-get update -qq && sudo apt-get install -y mpv ;;
    dnf)    sudo dnf install -y mpv ;;
    pacman) sudo pacman -S --noconfirm mpv ;;
    zypper) sudo zypper install -y mpv ;;
    apk)    sudo apk add mpv ;;
    none)
      fail "No supported package manager found. Install MPV manually: https://mpv.io/installation/"
      ;;
  esac
  ok "MPV installed"
}

# ---------- install Bun ----------
install_bun() {
  if command_exists bun; then
    ok "Bun already installed ($(bun --version))"
    return
  fi

  info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash

  # Source the updated profile so bun is available in this session
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"

  if ! command_exists bun; then
    fail "Bun installation succeeded but 'bun' is not on PATH. Restart your shell and re-run this script."
  fi
  ok "Bun installed ($(bun --version))"
}

# ---------- clone / update repo ----------
install_repo() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Updating existing repo at $INSTALL_DIR..."
    git -C "$INSTALL_DIR" pull --ff-only || warn "Could not pull latest changes (you may have local modifications)"
  else
    info "Cloning radio-bun to $INSTALL_DIR..."
    git clone "$REPO" "$INSTALL_DIR"
  fi
}

# ---------- install deps & link globally ----------
install_radio() {
  info "Installing dependencies..."
  (cd "$INSTALL_DIR" && bun install)

  info "Installing radio CLI globally..."
  (cd "$INSTALL_DIR" && bun install -g .)

  ok "radio CLI installed globally"
}

# ---------- verify ----------
verify() {
  if command_exists radio; then
    ok "Installation complete!"
    echo ""
    echo "  radio --version    Check version"
    echo "  radio search jazz  Search for stations"
    echo "  radio play 1       Play a station"
    echo "  radio --help       Show all commands"
    echo ""
  else
    warn "Installation finished but 'radio' is not on PATH."
    warn "You may need to restart your terminal or add ~/.bun/bin to your PATH:"
    echo ""
    echo "  export PATH=\"\$HOME/.bun/bin:\$PATH\""
    echo ""
  fi
}

# ---------- main ----------
main() {
  echo ""
  info "radio-bun installer"
  echo ""

  detect_os
  detect_pkg
  info "Detected: $OS (package manager: $PKG)"
  echo ""

  install_mpv
  install_bun
  install_repo
  install_radio
  verify
}

main
