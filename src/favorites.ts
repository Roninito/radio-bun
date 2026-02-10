// src/favorites.ts
//
// Persists favorite stations as full objects in ~/.config/radio-bun/favorites.json
// so they can be listed, played, and managed from CLI and web UI.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Station } from "./api.ts";

const DIR = join(homedir(), ".config", "radio-bun");
const FAV_PATH = join(DIR, "favorites.json");

function ensureDir(): void {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export function loadFavorites(): Station[] {
  ensureDir();
  if (!existsSync(FAV_PATH)) return [];
  try {
    return JSON.parse(readFileSync(FAV_PATH, "utf8"));
  } catch {
    return [];
  }
}

function save(favs: Station[]): void {
  ensureDir();
  writeFileSync(FAV_PATH, JSON.stringify(favs, null, 2) + "\n");
}

/** Add a station to favorites. Returns false if already present. */
export function addFavorite(station: Station): boolean {
  const favs = loadFavorites();
  if (favs.some((f) => f.stationuuid === station.stationuuid)) return false;
  favs.push(station);
  save(favs);
  return true;
}

/** Remove a favorite by 0-based index. Returns the removed station or null. */
export function removeFavoriteByIndex(index: number): Station | null {
  const favs = loadFavorites();
  if (index < 0 || index >= favs.length) return null;
  const [removed] = favs.splice(index, 1);
  save(favs);
  return removed;
}

/** Remove a favorite by UUID. Returns true if found and removed. */
export function removeFavoriteByUuid(uuid: string): boolean {
  const favs = loadFavorites();
  const idx = favs.findIndex((f) => f.stationuuid === uuid);
  if (idx === -1) return false;
  favs.splice(idx, 1);
  save(favs);
  return true;
}

/** Check if a station is a favorite. */
export function isFavorite(uuid: string): boolean {
  return loadFavorites().some((f) => f.stationuuid === uuid);
}
