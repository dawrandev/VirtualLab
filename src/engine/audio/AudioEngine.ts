import { Howl, Howler } from "howler";
import type { AudioId } from "../types";
import { audioManifest } from "./manifest";

interface PlayOptions {
  volume?: number;
  rate?: number;
}

/**
 * Howler-based audio engine. Lazily loaded sounds, master mute & volume,
 * autoplay-policy unlock on first user gesture.
 */
class AudioEngineImpl {
  private sounds = new Map<AudioId, Howl>();
  private loopHandles = new Map<AudioId, number>();
  private initialized = false;
  private muted = false;
  private masterVolume = 0.6;

  /** Preload manifest subset. Idempotent. */
  init(ids: AudioId[]): void {
    if (this.initialized) return;
    for (const id of ids) {
      const entry = audioManifest[id];
      if (!entry) continue;
      if (this.sounds.has(id)) continue;
      const howl = new Howl({
        src: entry.src,
        loop: entry.loop ?? false,
        volume: (entry.volume ?? 1) * this.masterVolume,
        html5: entry.html5 ?? false,
        preload: true,
        onloaderror: (_, err) => {
          console.warn(`[AudioEngine] failed to load ${id}:`, err);
        },
      });
      this.sounds.set(id, howl);
    }
    this.initialized = true;
  }

  /** Resume audio context after first user gesture (browser autoplay policy). */
  async unlock(): Promise<void> {
    const ctx = Howler.ctx;
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn("[AudioEngine] unlock failed:", err);
      }
    }
  }

  play(id: AudioId, opts: PlayOptions = {}): number | undefined {
    if (this.muted) return undefined;
    const howl = this.sounds.get(id);
    if (!howl) return undefined;
    const soundId = howl.play();
    if (opts.volume !== undefined) howl.volume(opts.volume * this.masterVolume, soundId);
    if (opts.rate !== undefined) howl.rate(opts.rate, soundId);
    return soundId;
  }

  /** Start (or resume) a looping sound; subsequent calls are no-ops. */
  loop(id: AudioId): void {
    if (this.muted) return;
    const howl = this.sounds.get(id);
    if (!howl) return;
    if (this.loopHandles.has(id)) {
      const handle = this.loopHandles.get(id)!;
      if (!howl.playing(handle)) howl.play(handle);
      return;
    }
    const handle = howl.play();
    this.loopHandles.set(id, handle);
  }

  stopLoop(id: AudioId, fadeMs = 300): void {
    const howl = this.sounds.get(id);
    const handle = this.loopHandles.get(id);
    if (!howl || handle === undefined) return;
    howl.fade(howl.volume(handle) as number, 0, fadeMs, handle);
    setTimeout(() => howl.stop(handle), fadeMs + 50);
    this.loopHandles.delete(id);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    Howler.mute(muted);
  }

  setMasterVolume(v: number): void {
    this.masterVolume = Math.max(0, Math.min(1, v));
    Howler.volume(this.masterVolume);
  }

  dispose(): void {
    for (const howl of this.sounds.values()) howl.unload();
    this.sounds.clear();
    this.loopHandles.clear();
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngineImpl();
