// src/api.ts
export const RADIO_ROOT = "https://de1.api.radio-browser.info";

export interface Station {
  name: string;
  url_resolved: string;
  stationuuid: string;
  country: string;
  codec: string;
  bitrate: number;
  tags: string;
}

/** Simple GET -> JSON helper that always sends a descriptive User-Agent */
async function getJSON<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  // Strip undefined/null values so they aren't sent as "undefined"
  const clean = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
  const qp = new URLSearchParams(clean).toString();
  const url = `${RADIO_ROOT}/${path}${qp ? "?" + qp : ""}`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent": "radio-bun/0.1",
      Accept: "application/json",
    },
  });

  if (!resp.ok) throw new Error(`Radio API ${resp.status}: ${resp.statusText}`);
  return (await resp.json()) as T;
}

/** Search stations - all the parameters that the Radio-Browser API accepts */
export async function searchStations(query: {
  name?: string;
  country?: string;
  tag?: string;
  codec?: string;
  limit?: number;
  offset?: number;
}): Promise<Station[]> {
  return await getJSON<Station[]>("json/stations/search", query as Record<string, string | number | undefined>);
}

/** Record a click (required by the public API to keep stats correct) */
export async function clickStation(uuid: string): Promise<void> {
  await fetch(`${RADIO_ROOT}/json/url/${uuid}`, {
    method: "GET",
    headers: { "User-Agent": "radio-bun/0.1" },
  });
}
