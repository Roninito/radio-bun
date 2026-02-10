# install.ps1 — radio-bun installer for Windows (PowerShell 5.1+)
#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Repo       = "https://github.com/Roninito/radio-bun.git"
$InstallDir = if ($env:RADIO_BUN_DIR) { $env:RADIO_BUN_DIR } else { Join-Path $env:USERPROFILE "radio-bun" }

# ---------- helpers ----------
function Info  ($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok    ($msg) { Write-Host "==> $msg" -ForegroundColor Green }
function Warn  ($msg) { Write-Host "==> $msg" -ForegroundColor Yellow }
function Fail  ($msg) { Write-Host "==> $msg" -ForegroundColor Red; exit 1 }

function Command-Exists ($cmd) {
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

# ---------- detect package manager ----------
function Get-PkgManager {
    if (Command-Exists "scoop")  { return "scoop" }
    if (Command-Exists "choco")  { return "choco" }
    if (Command-Exists "winget") { return "winget" }
    return "none"
}

# ---------- install MPV ----------
function Install-MPV {
    if (Command-Exists "mpv") {
        Ok "MPV already installed"
        return
    }

    $pkg = Get-PkgManager
    Info "Installing MPV via $pkg..."

    switch ($pkg) {
        "scoop"  { scoop install mpv }
        "choco"  { choco install mpv -y }
        "winget" { winget install --id=mpv-player.mpv -e --accept-source-agreements --accept-package-agreements }
        "none"   {
            Fail "No supported package manager found (scoop, choco, or winget). Install one first:`n  - Scoop:  irm get.scoop.sh | iex`n  - Choco:  https://chocolatey.org/install`n  - Winget: comes with modern Windows 10/11"
        }
    }
    Ok "MPV installed"
}

# ---------- install Bun ----------
function Install-Bun {
    if (Command-Exists "bun") {
        Ok "Bun already installed ($(bun --version))"
        return
    }

    Info "Installing Bun..."
    irm bun.sh/install.ps1 | iex

    # Refresh PATH for this session
    $bunBin = Join-Path $env:USERPROFILE ".bun\bin"
    if (Test-Path $bunBin) {
        $env:PATH = "$bunBin;$env:PATH"
    }

    if (-not (Command-Exists "bun")) {
        Fail "Bun installation succeeded but 'bun' is not on PATH. Restart PowerShell and re-run this script."
    }
    Ok "Bun installed ($(bun --version))"
}

# ---------- install Git (if needed) ----------
function Ensure-Git {
    if (Command-Exists "git") { return }

    $pkg = Get-PkgManager
    Info "Git not found. Installing via $pkg..."

    switch ($pkg) {
        "scoop"  { scoop install git }
        "choco"  { choco install git -y }
        "winget" { winget install --id=Git.Git -e --accept-source-agreements --accept-package-agreements }
        "none"   { Fail "Git is required. Install it from https://git-scm.com/download/win" }
    }

    # Refresh PATH
    $gitPaths = @(
        "C:\Program Files\Git\cmd",
        "C:\Program Files (x86)\Git\cmd",
        (Join-Path $env:USERPROFILE "scoop\shims")
    )
    foreach ($p in $gitPaths) {
        if (Test-Path $p) { $env:PATH = "$p;$env:PATH" }
    }

    if (-not (Command-Exists "git")) {
        Fail "Git was installed but is not on PATH. Restart PowerShell and re-run this script."
    }
    Ok "Git installed"
}

# ---------- clone / update repo ----------
function Install-Repo {
    if (Test-Path (Join-Path $InstallDir ".git")) {
        Info "Updating existing repo at $InstallDir..."
        git -C $InstallDir pull --ff-only
    } else {
        Info "Cloning radio-bun to $InstallDir..."
        git clone $Repo $InstallDir
    }
}

# ---------- install deps & link globally ----------
function Install-Radio {
    Info "Installing dependencies..."
    Push-Location $InstallDir
    try {
        bun install

        Info "Installing radio CLI globally..."
        bun install -g .
    } finally {
        Pop-Location
    }
    Ok "radio CLI installed globally"
}

# ---------- verify ----------
function Verify {
    # Refresh PATH to pick up bun global bin
    $bunBin = Join-Path $env:USERPROFILE ".bun\bin"
    if (Test-Path $bunBin) { $env:PATH = "$bunBin;$env:PATH" }

    if (Command-Exists "radio") {
        Ok "Installation complete!"
        Write-Host ""
        Write-Host "  radio --version    Check version"
        Write-Host "  radio search jazz  Search for stations"
        Write-Host "  radio play 1       Play a station"
        Write-Host "  radio --help       Show all commands"
        Write-Host ""
    } else {
        Warn "Installation finished but 'radio' is not on PATH."
        Warn "Restart PowerShell or add the Bun bin directory to your PATH:"
        Write-Host ""
        Write-Host "  `$env:PATH = `"$bunBin;`$env:PATH`""
        Write-Host ""
    }
}

# ---------- main ----------
Write-Host ""
Info "radio-bun installer"
Write-Host ""

Ensure-Git
Install-MPV
Install-Bun
Install-Repo
Install-Radio
Verify
