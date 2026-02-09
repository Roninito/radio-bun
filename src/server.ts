// src/server.ts
//
// Tiny HTTP/JSON control server. Owns a single RadioPlayer (MPV process)
// that all CLI commands and the web UI talk to over HTTP.

import { serve } from "bun";
import { RadioPlayer } from "./player.ts";
import { clickStation, searchStations } from "./api.ts";
import type { Station } from "./api.ts";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const player = new RadioPlayer();
const PORT = Number(process.env.RADIO_PORT) || 4242;

// Write a PID file so the CLI can check if we're running
const PID_DIR = join(homedir(), ".radio-bun");
const PID_FILE = join(PID_DIR, "server.pid");
try {
  const { mkdirSync } = await import("node:fs");
  mkdirSync(PID_DIR, { recursive: true });
  writeFileSync(PID_FILE, `${process.pid}\n`);
} catch { /* best effort */ }

// In-memory cache of the last search results
let lastSearch: Station[] = [];

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

function shutdown() {
  player.quit();
  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
  process.exit(0);
}

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // ------------------- API -------------------

    if (path === "/api/search") {
      const term = url.searchParams.get("q") ?? "";
      const limit = Number(url.searchParams.get("limit")) || 30;
      const country = url.searchParams.get("country") ?? undefined;
      const tag = url.searchParams.get("tag") ?? undefined;

      const stations = await searchStations({ name: term, limit, country, tag });
      lastSearch = stations;
      return json(stations);
    }

    // GET /api/play?i=<index>  — play from the server's cached search (web UI)
    if (path === "/api/play" && req.method === "GET") {
      const idx = Number(url.searchParams.get("i") ?? "0");
      if (!lastSearch[idx]) return err("Invalid index - run a search first");
      const st = lastSearch[idx];
      await clickStation(st.stationuuid);
      await player.play(st.stationuuid, st.url_resolved, st.name);
      return json({ ok: true, station: st });
    }

    // POST /api/play { uuid, url, name } — play a specific station (CLI)
    if (path === "/api/play" && req.method === "POST") {
      try {
        const body = await req.json() as { uuid?: string; url?: string; name?: string };
        if (!body.url) return err("Missing 'url' in body");
        const uuid = body.uuid ?? "unknown";
        if (body.uuid) {
          clickStation(uuid).catch(() => {}); // fire-and-forget
        }
        await player.play(uuid, body.url, body.name);
        return json({ ok: true, name: body.name ?? null });
      } catch {
        return err("Invalid JSON body");
      }
    }

    if (path === "/api/pause") {
      await player.pause();
      return json({ ok: true });
    }

    if (path === "/api/stop") {
      await player.stop();
      return json({ ok: true });
    }

    if (path === "/api/vol") {
      const v = Number(url.searchParams.get("v") ?? "-1");
      if (Number.isNaN(v) || v < 0 || v > 100) return err("Volume must be 0-100");
      await player.setVolume(v);
      return json({ ok: true, volume: v });
    }

    if (path === "/api/status") {
      const s = await player.status();
      return json(s);
    }

    // Graceful shutdown — kills MPV, removes PID file, exits
    if (path === "/api/quit") {
      // Respond first, then shut down
      setTimeout(shutdown, 100);
      return json({ ok: true, message: "Shutting down" });
    }

    // ------------- Static UI (public/) -------------

    const staticPath = `./public${path === "/" ? "/index.html" : path}`;
    const file = Bun.file(staticPath);
    if (await file.exists()) {
      return new Response(file, { headers: CORS });
    }

    return new Response("Not found", { status: 404, headers: CORS });
  },
});

console.log(`Radio daemon listening on http://localhost:${PORT}  (pid ${process.pid})`);

// Clean up MPV on exit
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
