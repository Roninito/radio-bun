// src/player.ts
//
// Wraps node-mpv v1.x which spawns MPV in idle mode on construction
// and exposes control methods over a UNIX IPC socket.

// @ts-expect-error – node-mpv ships no type declarations
import MPV from "node-mpv";

export interface PlayerStatus {
  uuid: string | null;
  paused: boolean;
  volume: number;
  title: string | null;
}

export class RadioPlayer {
  private mpv: any;
  private currentUuid: string | null = null;
  private currentTitle: string | null = null;
  private ready: Promise<void>;

  constructor(binary?: string) {
    // node-mpv v1.x spawns mpv immediately from the constructor.
    // audio_only: true  => passes --no-video --no-audio-display
    // idle mode is always on by default.
    this.mpv = new MPV({ audio_only: true, binary: binary || undefined });

    // Give MPV a moment to create its IPC socket before we send commands.
    this.ready = new Promise((resolve) => setTimeout(resolve, 500));
  }

  /** Play a resolved stream URL. */
  async play(uuid: string, url: string, title?: string): Promise<void> {
    await this.ready;
    this.mpv.load(url);
    this.currentUuid = uuid;
    this.currentTitle = title ?? null;
  }

  /** Toggle pause. */
  async pause(): Promise<void> {
    await this.ready;
    this.mpv.togglePause();
  }

  /** Stop playback (MPV stays in idle mode). */
  async stop(): Promise<void> {
    await this.ready;
    this.mpv.stop();
    this.currentUuid = null;
    this.currentTitle = null;
  }

  /** Set volume (0-100). */
  async setVolume(v: number): Promise<void> {
    await this.ready;
    this.mpv.volume(Math.max(0, Math.min(100, v)));
  }

  /** Get current playback status. */
  async status(): Promise<PlayerStatus> {
    await this.ready;
    let paused = false;
    let volume = 100;
    try {
      paused = !!(await this.mpv.getProperty("pause"));
    } catch { /* mpv may not have a file loaded */ }
    try {
      volume = Number(await this.mpv.getProperty("volume")) || 100;
    } catch { /* ignore */ }

    return {
      uuid: this.currentUuid,
      paused,
      volume,
      title: this.currentTitle,
    };
  }

  /** Gracefully shut down the MPV process. */
  quit(): void {
    try { this.mpv.quit(); } catch { /* already gone */ }
  }
}
