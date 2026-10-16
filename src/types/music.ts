export interface LyricLine {
  time: number; // in seconds
  duration: number; // in seconds
  text: string;
  romaji?: string;
  en?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  bpm: number;
  key: string;
  coverImage: string;
  genre: string;
  description: string;
  lyrics: LyricLine[];
  synthPreset: string;
  isCustom?: boolean;
}

export type VisualizerMode = 'shards' | 'orbital' | 'cybermesh' | 'particles';

export interface StemControls {
  lead: { volume: number; muted: boolean; solo: boolean };
  bass: { volume: number; muted: boolean; solo: boolean };
  arp: { volume: number; muted: boolean; solo: boolean };
  pad: { volume: number; muted: boolean; solo: boolean };
  drums: { volume: number; muted: boolean; solo: boolean };
  filterCutoff: number; // 200 - 18000 Hz
  reverbAmount: number; // 0 - 1
}

export interface VisualizerConfig {
  mode: VisualizerMode;
  glowIntensity: number; // 0.2 - 2.0
  floatSpeed: number; // 0.2 - 3.0
  particleDensity: number; // 30 - 200
  showScanlines: boolean;
  chromaticAberration: boolean;
  sensitivity: number; // 0.5 - 2.5
}
