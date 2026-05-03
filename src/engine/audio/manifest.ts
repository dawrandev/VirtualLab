import type { AudioId } from "../types";

export interface AudioManifestEntry {
  src: string[];
  loop?: boolean;
  volume?: number;
  /** Use HTML5 streaming for long files; default false for low-latency triggering. */
  html5?: boolean;
}

/**
 * AudioId → file paths (under /public/audio/).
 * Multiple sources allow browser to pick a supported format.
 * NOTE: actual audio files will be sourced as CC0 from Freesound and placed in
 * public/audio/ during the asset-sourcing task. Until then these paths
 * resolve to 404; AudioEngine.init logs a warning and the lab still runs silent.
 */
export const audioManifest: Record<AudioId, AudioManifestEntry> = {
  burner_hum_loop: {
    src: ["/audio/tools/burner_hum.ogg", "/audio/tools/burner_hum.mp3"],
    loop: true,
    volume: 0.4,
  },
  success_ping: {
    src: ["/audio/ui/success.ogg", "/audio/ui/success.mp3"],
    volume: 0.6,
  },
  error_buzz: {
    src: ["/audio/ui/error.ogg", "/audio/ui/error.mp3"],
    volume: 0.5,
  },
  liquid_drop: {
    src: ["/audio/tools/liquid_drop.ogg", "/audio/tools/liquid_drop.mp3"],
    volume: 0.6,
  },
  metal_clink: {
    src: ["/audio/tools/metal_clink.ogg", "/audio/tools/metal_clink.mp3"],
    volume: 0.5,
  },
  match_strike: {
    src: ["/audio/tools/match_strike.ogg", "/audio/tools/match_strike.mp3"],
    volume: 0.7,
  },
  lamp_ignition: {
    src: ["/audio/tools/lamp_ignition.ogg", "/audio/tools/lamp_ignition.mp3"],
    volume: 0.6,
  },
  ui_click: {
    src: ["/audio/ui/click.ogg", "/audio/ui/click.mp3"],
    volume: 0.4,
  },
  fanfare: {
    src: ["/audio/ui/fanfare.ogg", "/audio/ui/fanfare.mp3"],
    volume: 0.7,
  },
  glass_smear_loop: {
    src: ["/audio/tools/glass_smear.ogg", "/audio/tools/glass_smear.mp3"],
    loop: true,
    volume: 0.4,
  },
  water_flow_loop: {
    src: ["/audio/tools/water_flow.ogg", "/audio/tools/water_flow.mp3"],
    loop: true,
    volume: 0.5,
  },
};
