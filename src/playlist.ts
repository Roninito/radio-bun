// src/playlist.ts
//
// Simple JSON-file personal playlists stored at ~/.radio-bun/playlists.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DIR = join(homedir(), ".radio-bun");
const DB_PATH = join(DIR, "playlists.json");

type Playlists = Record<string, string[]>; // name -> [stationUuid, ...]

function ensureDir(): void {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

function load(): Playlists {
  ensureDir();
  if (!existsSync(DB_PATH)) return {};
  return JSON.parse(readFileSync(DB_PATH, "utf8"));
}

function save(data: Playlists): void {
  ensureDir();
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2) + "\n");
}

export function addToPlaylist(name: string, uuid: string): void {
  const db = load();
  db[name] = db[name] ?? [];
  if (!db[name].includes(uuid)) db[name].push(uuid);
  save(db);
}

export function removeFromPlaylist(name: string, uuid: string): void {
  const db = load();
  if (!db[name]) return;
  db[name] = db[name].filter((id) => id !== uuid);
  if (!db[name].length) delete db[name];
  save(db);
}

export function getPlaylist(name: string): string[] {
  const db = load();
  return db[name] ?? [];
}

export function listPlaylists(): Playlists {
  return load();
}

export function deletePlaylist(name: string): void {
  const db = load();
  delete db[name];
  save(db);
}
