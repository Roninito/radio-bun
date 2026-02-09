#!/usr/bin/env bun
// src/cli.ts
//
// The user-facing `radio` command.
// Every command that touches the player is just an HTTP request to the daemon.
// The daemon is auto-started in the background if it isn't already running.

import { Command } from "commander";
import { searchStations } from "./api.ts";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { spawn } from "node:child_process";

const CACHE = join(homedir(), ".radio-bun", "last-search.json");
const LAST_PLAYED = join(homedir(), ".radio-bun", "last-played.json");
const CACHE_DIR = join(homedir(), ".radio-bun");
const PORT = Number(process.env.RADIO_PORT) || 4242;
const BASE = `http://localhost:${PORT}`;

// ── Daemon helpers ──────────────────────────────────────────────

/** Check if the daemon is reachable. */
async function isDaemonUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/status`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Start the daemon as a detached background process. */
async function ensureDaemon(): Promise<void> {
  if (await isDaemonUp()) return;

  // Resolve server.ts relative to this file (works whether running from
  // source or via a global symlink).
  const serverPath = join(import.meta.dir, "server.ts");

  const child = spawn("bun", ["run", serverPath], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, RADIO_PORT: String(PORT) },
    cwd: join(import.meta.dir, ".."), // project root, so public/ is found
  });
  child.unref(); // let the CLI exit without waiting for the child

  // Wait for the daemon to become reachable (up to 3s)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (await isDaemonUp()) return;
  }
  console.error("Failed to start radio daemon. Try running `radio server` manually.");
  process.exit(1);
}

/** Send a GET request to the daemon and return the JSON body. */
async function daemonGet(path: string): Promise<any> {
  await ensureDaemon();
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

/** Send a POST request to the daemon and return the JSON body. */
async function daemonPost(path: string, body: unknown): Promise<any> {
  await ensureDaemon();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function ensureCacheDir() {
  const { mkdirSync } = require("node:fs");
  mkdirSync(CACHE_DIR, { recursive: true });
}

// ── CLI ─────────────────────────────────────────────────────────

const prog = new Command();
prog
  .name("radio")
  .description("Internet radio CLI (Bun + MPV)")
  .version("0.1.0");

// ---------------------------------------------------
//  SEARCH  (no daemon needed — just hits Radio-Browser)
// ---------------------------------------------------
prog
  .command("search <term>")
  .description("Search the Radio-Browser database")
  .option("-c, --country <c>", "filter by country")
  .option("-t, --tag <t>", "filter by tag")
  .option("-l, --limit <n>", "max results", "30")
  .action(async (term: string, opts: { country?: string; tag?: string; limit: string }) => {
    const stations = await searchStations({
      name: term,
      country: opts.country,
      tag: opts.tag,
      limit: Number(opts.limit),
    });

    if (!stations.length) {
      console.log("No stations found.");
      return;
    }

    stations.forEach((s, i) => {
      const num = String(i + 1).padStart(2, " ");
      const bitrate = s.bitrate ? `${s.bitrate}k` : "?k";
      console.log(`  ${num}) ${s.name}  [${s.country}]  ${s.codec}/${bitrate}`);
    });

    ensureCacheDir();
    writeFileSync(CACHE, JSON.stringify(stations, null, 2));
    console.log(`\n${stations.length} result(s) cached. Use  radio play <num>  to listen.`);
  });

// ---------------------------------------------------
//  PLAY  (sends station to the daemon)
// ---------------------------------------------------
prog
  .command("play [index]")
  .description("Play a station by index, or replay the last played station")
  .action(async (idxStr?: string) => {
    let st: any;

    if (idxStr) {
      // Play by index from the last search
      const idx = Number(idxStr) - 1;
      if (Number.isNaN(idx) || idx < 0) {
        console.error("Index must be a positive integer.");
        process.exit(1);
      }
      if (!existsSync(CACHE)) {
        console.error("No cached search - run `radio search ...` first.");
        process.exit(1);
      }

      const stations = JSON.parse(readFileSync(CACHE, "utf8"));
      st = stations[idx];
      if (!st) {
        console.error(`No station at index ${idx + 1}. (${stations.length} results cached)`);
        process.exit(1);
      }
    } else {
      // No index — replay the last played station
      if (!existsSync(LAST_PLAYED)) {
        console.error("No last played station. Use  radio play <num>  after a search.");
        process.exit(1);
      }
      st = JSON.parse(readFileSync(LAST_PLAYED, "utf8"));
    }

    const data = await daemonPost("/api/play", {
      uuid: st.stationuuid,
      url: st.url_resolved,
      name: st.name,
    });

    if (data.ok) {
      // Save as last played
      ensureCacheDir();
      writeFileSync(LAST_PLAYED, JSON.stringify(st, null, 2));
      console.log(`Now playing: ${st.name}`);
    } else {
      console.error("Failed to play:", data.error ?? "unknown error");
    }
  });

// ---------------------------------------------------
//  TRANSPORT CONTROLS
// ---------------------------------------------------
prog
  .command("pause")
  .description("Toggle pause")
  .action(async () => {
    await daemonGet("/api/pause");
    console.log("Toggled pause");
  });

prog
  .command("stop")
  .description("Stop playback")
  .action(async () => {
    await daemonGet("/api/stop");
    console.log("Stopped");
  });

prog
  .command("vol <num>")
  .description("Set volume (0-100)")
  .action(async (valStr: string) => {
    const v = Number(valStr);
    if (Number.isNaN(v) || v < 0 || v > 100) {
      console.error("Volume must be 0-100");
      process.exit(1);
    }
    await daemonGet(`/api/vol?v=${v}`);
    console.log(`Volume set to ${v}`);
  });

prog
  .command("status")
  .description("Show current playback state")
  .action(async () => {
    const s = await daemonGet("/api/status");
    if (!s.uuid) {
      console.log("Nothing playing");
      return;
    }
    console.log(`Station: ${s.title ?? s.uuid}`);
    console.log(`Paused:  ${s.paused}`);
    console.log(`Volume:  ${s.volume}`);
  });

// ---------------------------------------------------
//  QUIT  (shuts down the daemon + MPV)
// ---------------------------------------------------
prog
  .command("quit")
  .description("Shut down the radio daemon and MPV")
  .action(async () => {
    if (!(await isDaemonUp())) {
      console.log("Daemon is not running.");
      return;
    }
    try {
      await fetch(`${BASE}/api/quit`, { signal: AbortSignal.timeout(2000) });
    } catch { /* connection reset is expected */ }
    console.log("Radio daemon stopped.");
  });

// ---------------------------------------------------
//  SERVER  (foreground, for manual / systemd use)
// ---------------------------------------------------
prog
  .command("server")
  .description("Start the HTTP control server in the foreground")
  .option("-p, --port <port>", "port to listen on", "4242")
  .action(async (opts: { port: string }) => {
    process.env.RADIO_PORT = opts.port;
    await import("./server.ts");
  });

prog.parse();
