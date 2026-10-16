import { StemControls, Track } from '../types/music';

// Frequency table for notes
const NOTE_FREQS: Record<string, number> = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50
};

interface NoteEvent {
  time: number; // in seconds
  duration: number; // in seconds
  note: string;
}

export class HologramSynthEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  // Stems gain nodes
  private leadGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private arpGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private drumsGain: GainNode | null = null;

  // State
  private isPlaying = false;
  private currentTime = 0;
  private duration = 65;
  private currentTrack: Track | null = null;
  private animationFrameId: number | null = null;
  private timerInterval: number | null = null;
  private startTimeOffset = 0;
  private audioCtxStartTime = 0;

  // Custom Audio Element (for uploaded files)
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private isExternalAudio = false;

  // Stems configuration
  private stems: StemControls = {
    lead: { volume: 0.85, muted: false, solo: false },
    bass: { volume: 0.8, muted: false, solo: false },
    arp: { volume: 0.75, muted: false, solo: false },
    pad: { volume: 0.7, muted: false, solo: false },
    drums: { volume: 0.85, muted: false, solo: false },
    filterCutoff: 14000,
    reverbAmount: 0.35,
  };

  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initAudio() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // Master Filter (Futuristic Cyber Lowpass)
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(this.stems.filterCutoff, this.ctx.currentTime);
    this.masterFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Stereo Spatial Delay/Echo
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.25, this.ctx.currentTime);
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // Stem gains
    this.leadGain = this.ctx.createGain();
    this.bassGain = this.ctx.createGain();
    this.arpGain = this.ctx.createGain();
    this.padGain = this.ctx.createGain();
    this.drumsGain = this.ctx.createGain();

    this.updateStemGains();

    // Routing
    const stemsArr = [this.leadGain, this.bassGain, this.arpGain, this.padGain, this.drumsGain];
    stemsArr.forEach(g => {
      if (g && this.masterFilter) {
        g.connect(this.masterFilter);
        // Send some to delay
        if (this.delayNode) {
          g.connect(this.delayNode);
        }
      }
    });

    if (this.delayNode && this.masterFilter) {
      this.delayNode.connect(this.masterFilter);
    }

    this.masterFilter.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  public setTrack(track: Track) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.currentTrack = track;
    this.duration = track.duration;
    this.currentTime = 0;
    this.isExternalAudio = false;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    if (wasPlaying) {
      this.play();
    }
  }

  public loadExternalAudio(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.initAudio();
      this.stop();

      const objectUrl = URL.createObjectURL(file);
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
      }

      this.audioElement.src = objectUrl;
      this.audioElement.onloadedmetadata = () => {
        this.duration = this.audioElement?.duration || 180;
        this.currentTime = 0;
        this.isExternalAudio = true;

        if (this.ctx && !this.audioSourceNode && this.audioElement) {
          try {
            this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
            if (this.masterFilter) {
              this.audioSourceNode.connect(this.masterFilter);
            }
          } catch {
            // Already connected
          }
        }

        resolve(file.name);
      };

      this.audioElement.onerror = () => {
        reject(new Error('Failed to load audio file'));
      };
    });
  }

  public play() {
    this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;

    if (this.isExternalAudio && this.audioElement) {
      this.audioElement.currentTime = this.currentTime;
      this.audioElement.play();
    }

    this.audioCtxStartTime = this.ctx.currentTime;
    this.startTimeOffset = this.currentTime;

    this.startTickLoop();
    this.scheduleNotes();
  }

  public pause() {
    this.isPlaying = false;
    if (this.isExternalAudio && this.audioElement) {
      this.audioElement.pause();
    }
    this.stopNoteScheduling();
  }

  public stop() {
    this.pause();
    this.currentTime = 0;
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, this.duration);
    }
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.isExternalAudio && this.audioElement) {
      this.audioElement.currentTime = this.currentTime;
    }
    if (this.ctx) {
      this.audioCtxStartTime = this.ctx.currentTime;
      this.startTimeOffset = this.currentTime;
    }
    if (this.isPlaying) {
      this.stopNoteScheduling();
      this.scheduleNotes();
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime, this.duration);
    }
  }

  private startTickLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying) return;

      if (this.isExternalAudio && this.audioElement) {
        this.currentTime = this.audioElement.currentTime;
        if (this.audioElement.ended) {
          this.handleEnded();
          return;
        }
      } else if (this.ctx) {
        const elapsed = this.ctx.currentTime - this.audioCtxStartTime;
        this.currentTime = this.startTimeOffset + elapsed;

        if (this.currentTime >= this.duration) {
          this.handleEnded();
          return;
        }
      }

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentTime, this.duration);
      }
    }, 50);
  }

  private handleEnded() {
    this.pause();
    this.currentTime = 0;
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, this.duration);
    }
    if (this.onTrackEndedCallback) {
      this.onTrackEndedCallback();
    }
  }

  // Active synthesizers map for current schedule
  private scheduledOscillators: { stop: () => void }[] = [];

  private stopNoteScheduling() {
    this.scheduledOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    });
    this.scheduledOscillators = [];
  }

  private scheduleNotes() {
    this.stopNoteScheduling();
    if (!this.ctx || this.isExternalAudio) return;

    const bpm = this.currentTrack?.bpm || 140;
    const beatSec = 60 / bpm;
    const now = this.ctx.currentTime;
    const currentSongTime = this.currentTime;

    // We generate procedural synth patterns for 8 bars (around 13.7 seconds), looped
    const loopDuration = 16 * beatSec; // 4 bars loop (about 6.8s) or 8 bars
    const currentLoopPos = currentSongTime % loopDuration;

    // Schedule next chunk of notes up to 10 seconds ahead
    const scheduleWindow = 12;
    const startStep = Math.floor(currentSongTime / (beatSec / 4));
    const totalSteps = Math.ceil(scheduleWindow / (beatSec / 4));

    // Preset check
    const isNeonShards = this.currentTrack?.synthPreset === 'neon_shards';
    const isHorizon = this.currentTrack?.synthPreset === 'digital_horizon';

    // 1. Kick & Drums Pattern
    for (let i = 0; i < totalSteps; i++) {
      const step = startStep + i;
      const stepTime = step * (beatSec / 4);
      const audioTime = now + (stepTime - currentSongTime);

      if (audioTime < now) continue;

      // 4-on-the-floor Kick (every 4 16th notes = beat)
      if (step % 4 === 0) {
        this.triggerKick(audioTime);
      }

      // Snare / Clap on beat 2 and 4 (step % 16 === 4 or 12)
      if (step % 16 === 4 || step % 16 === 12) {
        this.triggerSnare(audioTime);
      }

      // 16th Hi-hats with velocity groove
      const isOffbeat = step % 4 === 2;
      this.triggerHiHat(audioTime, isOffbeat ? 0.3 : 0.15);
    }

    // 2. Neon Arpeggio Pattern (Twinkling floating neon shards)
    const arpNotes = isNeonShards
      ? ['F#4', 'A4', 'C#5', 'E5', 'F#5', 'E5', 'C#5', 'A4', 'B4', 'D5', 'F#5', 'A5', 'G#5', 'E5', 'C#5', 'B4']
      : isHorizon
      ? ['D4', 'F4', 'A4', 'C5', 'D5', 'C5', 'A4', 'F4', 'G4', 'Bb4', 'D5', 'F5', 'E5', 'C5', 'A4', 'G4']
      : ['A3', 'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4', 'F3', 'A3', 'C4', 'E4', 'D4', 'C4', 'A3', 'G3'];

    for (let i = 0; i < totalSteps; i++) {
      const step = startStep + i;
      const stepTime = step * (beatSec / 4);
      const audioTime = now + (stepTime - currentSongTime);
      if (audioTime < now) continue;

      const note = arpNotes[step % arpNotes.length];
      const freq = NOTE_FREQS[note];
      if (freq) {
        this.triggerArp(audioTime, freq, (beatSec / 4) * 0.85);
      }
    }

    // 3. Cyber Bassline Pattern
    const bassChords = isNeonShards
      ? ['F#2', 'D2', 'A2', 'E2']
      : isHorizon
      ? ['D2', 'Bb1', 'F2', 'C2']
      : ['A2', 'F2', 'C2', 'G2'];

    const beatsPerChord = 4;
    const bassTotalSteps = Math.ceil(scheduleWindow / (beatSec / 2));
    const bassStartStep = Math.floor(currentSongTime / (beatSec / 2));

    for (let i = 0; i < bassTotalSteps; i++) {
      const step = bassStartStep + i;
      const stepTime = step * (beatSec / 2);
      const audioTime = now + (stepTime - currentSongTime);
      if (audioTime < now) continue;

      const chordIndex = Math.floor(step / (beatsPerChord * 2)) % bassChords.length;
      const rootNote = bassChords[chordIndex];
      const freq = NOTE_FREQS[rootNote];
      if (freq) {
        this.triggerBass(audioTime, freq, (beatSec / 2) * 0.9);
      }
    }

    // 4. Vocal / Synth Lead Melody (Matching "ネオンの欠片" theme)
    if (isNeonShards) {
      this.scheduleVocalLeadMelody(now, currentSongTime, beatSec);
    } else {
      this.scheduleAmbientLeadMelody(now, currentSongTime, beatSec);
    }

    // 5. Hologram Chord Pad
    const padTotalSteps = Math.ceil(scheduleWindow / (beatSec * 4));
    const padStartStep = Math.floor(currentSongTime / (beatSec * 4));
    for (let i = 0; i < padTotalSteps; i++) {
      const bar = padStartStep + i;
      const barTime = bar * (beatSec * 4);
      const audioTime = now + (barTime - currentSongTime);
      if (audioTime < now) continue;

      const chordIdx = bar % bassChords.length;
      const chordRoot = bassChords[chordIdx];
      this.triggerPadChord(audioTime, chordRoot, beatSec * 3.8);
    }
  }

  // The vocal melody of "ネオンの欠片"
  private scheduleVocalLeadMelody(now: number, currentSongTime: number, beatSec: number) {
    // Vocal phrases that loop or correspond to the lyrics sections
    const melody: NoteEvent[] = [
      // Line 1: "ネオンの海に落ちた ワードの欠片を拾い集めて"
      { time: 19.0, duration: 0.4, note: 'C#5' },
      { time: 19.5, duration: 0.4, note: 'B4' },
      { time: 20.0, duration: 0.4, note: 'A4' },
      { time: 20.5, duration: 0.6, note: 'F#4' },
      { time: 21.2, duration: 0.4, note: 'A4' },
      { time: 21.7, duration: 0.4, note: 'B4' },
      { time: 22.2, duration: 0.8, note: 'C#5' },

      // Line 2: "未完成のメロディーで世界を置き去りにしよう"
      { time: 23.5, duration: 0.4, note: 'C#5' },
      { time: 24.0, duration: 0.4, note: 'D5' },
      { time: 24.5, duration: 0.4, note: 'E5' },
      { time: 25.0, duration: 0.5, note: 'C#5' },
      { time: 25.6, duration: 0.4, note: 'B4' },
      { time: 26.2, duration: 0.4, note: 'A4' },
      { time: 26.8, duration: 1.0, note: 'B4' },

      // Line 3: "0と1の狭間で叫んだ声が交わり合う"
      { time: 29.0, duration: 0.4, note: 'A4' },
      { time: 29.5, duration: 0.4, note: 'B4' },
      { time: 30.0, duration: 0.4, note: 'C#5' },
      { time: 30.6, duration: 0.5, note: 'A4' },
      { time: 31.2, duration: 0.4, note: 'B4' },
      { time: 31.7, duration: 0.4, note: 'C#5' },
      { time: 32.2, duration: 0.8, note: 'E5' },

      // Line 4: "旋律息を止めて この鼓動のスピードで"
      { time: 33.5, duration: 0.4, note: 'F#5' },
      { time: 34.0, duration: 0.4, note: 'E5' },
      { time: 34.5, duration: 0.5, note: 'C#5' },
      { time: 35.1, duration: 0.4, note: 'B4' },
      { time: 35.6, duration: 0.4, note: 'A4' },
      { time: 36.2, duration: 0.8, note: 'B4' },

      // Line 5: "駆け抜けていく..."
      { time: 38.0, duration: 0.5, note: 'C#5' },
      { time: 38.6, duration: 0.5, note: 'E5' },
      { time: 39.2, duration: 1.5, note: 'F#5' },

      // Drop riffs (43 - 55s)
      { time: 43.0, duration: 0.3, note: 'F#5' },
      { time: 43.4, duration: 0.3, note: 'E5' },
      { time: 43.8, duration: 0.3, note: 'F#5' },
      { time: 44.5, duration: 0.5, note: 'A5' },
      { time: 45.2, duration: 0.3, note: 'G#5' },
      { time: 45.6, duration: 0.3, note: 'E5' },
      { time: 46.2, duration: 0.6, note: 'C#5' },
      { time: 47.0, duration: 0.4, note: 'B4' },
      { time: 47.5, duration: 0.5, note: 'C#5' },
      { time: 48.2, duration: 1.2, note: 'F#4' },
    ];

    melody.forEach(item => {
      const audioTime = now + (item.time - currentSongTime);
      if (audioTime >= now && audioTime <= now + 12) {
        const freq = NOTE_FREQS[item.note];
        if (freq) {
          this.triggerLead(audioTime, freq, item.duration);
        }
      }
    });
  }

  private scheduleAmbientLeadMelody(now: number, currentSongTime: number, beatSec: number) {
    const scale = ['D4', 'E4', 'F4', 'A4', 'C5', 'D5', 'E5'];
    const interval = beatSec * 2;
    const startIdx = Math.floor(currentSongTime / interval);

    for (let i = 0; i < 6; i++) {
      const idx = startIdx + i;
      const targetTime = idx * interval;
      const audioTime = now + (targetTime - currentSongTime);
      if (audioTime >= now && audioTime <= now + 12) {
        const note = scale[(idx * 3) % scale.length];
        const freq = NOTE_FREQS[note];
        if (freq) {
          this.triggerLead(audioTime, freq, interval * 0.9);
        }
      }
    }
  }

  // --- Sound Generators ---

  private triggerKick(time: number) {
    if (!this.ctx || !this.drumsGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency drop for punchy kick
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.14);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.drumsGain);

    osc.start(time);
    osc.stop(time + 0.3);
    this.scheduledOscillators.push({ stop: () => { try { osc.stop(); } catch {} } });
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.drumsGain) return;
    // White noise buffer
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(900, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumsGain);

    noise.start(time);
    noise.stop(time + 0.2);
    this.scheduledOscillators.push({ stop: () => { try { noise.stop(); } catch {} } });
  }

  private triggerHiHat(time: number, vol = 0.2) {
    if (!this.ctx || !this.drumsGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(6500, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.drumsGain);

    osc.start(time);
    osc.stop(time + 0.055);
    this.scheduledOscillators.push({ stop: () => { try { osc.stop(); } catch {} } });
  }

  private triggerBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.bassGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Resonant bass filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + duration);
    filter.Q.setValueAtTime(4.0, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGain);

    osc.start(time);
    osc.stop(time + duration);
    this.scheduledOscillators.push({ stop: () => { try { osc.stop(); } catch {} } });
  }

  private triggerArp(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.arpGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + duration);

    osc.connect(gain);
    gain.connect(this.arpGain);

    osc.start(time);
    osc.stop(time + duration);
    this.scheduledOscillators.push({ stop: () => { try { osc.stop(); } catch {} } });
  }

  private triggerLead(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.leadGain) return;
    // Dual detuned oscillator for rich cyber vocal/lead presence
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.004, time); // Subtle cyber chorusing

    // Vocal formant style filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(freq * 2.2, 3500), time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.04);
    gain.gain.setValueAtTime(0.4, time + duration - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.leadGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);

    this.scheduledOscillators.push({
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
        } catch {}
      }
    });
  }

  private triggerPadChord(time: number, rootNote: string, duration: number) {
    if (!this.ctx || !this.padGain) return;
    const baseFreq = NOTE_FREQS[rootNote] || 110;
    const chordFreqs = [baseFreq, baseFreq * 1.2, baseFreq * 1.5, baseFreq * 2.0];

    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.padGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * (1 + idx * 0.002), time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.8);
      gain.gain.setValueAtTime(0.12, time + duration - 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.padGain);

      osc.start(time);
      osc.stop(time + duration);

      this.scheduledOscillators.push({
        stop: () => {
          try {
            osc.stop();
          } catch {}
        }
      });
    });
  }

  // --- Real-time Audio Frequency & Waveform analysis ---
  public getAnalysisData(): { frequencyData: Uint8Array; timeDomainData: Uint8Array; bassLevel: number; midLevel: number; trebleLevel: number } {
    if (!this.analyser) {
      return {
        frequencyData: new Uint8Array(64),
        timeDomainData: new Uint8Array(64),
        bassLevel: 0,
        midLevel: 0,
        trebleLevel: 0,
      };
    }

    const freqArray = new Uint8Array(this.analyser.frequencyBinCount);
    const timeArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getByteFrequencyData(freqArray);
    this.analyser.getByteTimeDomainData(timeArray);

    // Calculate energy bands
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const bassCount = Math.floor(freqArray.length * 0.15);
    const midCount = Math.floor(freqArray.length * 0.45);

    for (let i = 0; i < bassCount; i++) {
      bassSum += freqArray[i];
    }
    for (let i = bassCount; i < midCount; i++) {
      midSum += freqArray[i];
    }
    for (let i = midCount; i < freqArray.length; i++) {
      trebleSum += freqArray[i];
    }

    return {
      frequencyData: freqArray,
      timeDomainData: timeArray,
      bassLevel: bassSum / (bassCount * 255 || 1),
      midLevel: midSum / ((midCount - bassCount) * 255 || 1),
      trebleLevel: trebleSum / ((freqArray.length - midCount) * 255 || 1),
    };
  }

  // --- Controls & Stems Setters ---
  public updateStem(stemKey: keyof Omit<StemControls, 'filterCutoff' | 'reverbAmount'>, updates: Partial<{ volume: number; muted: boolean; solo: boolean }>) {
    this.stems[stemKey] = { ...this.stems[stemKey], ...updates };
    this.updateStemGains();
  }

  public setFilterCutoff(hz: number) {
    this.stems.filterCutoff = hz;
    if (this.masterFilter && this.ctx) {
      this.masterFilter.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  public getStems(): StemControls {
    return { ...this.stems };
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onTrackEnded(cb: () => void) {
    this.onTrackEndedCallback = cb;
  }

  private updateStemGains() {
    if (!this.ctx) return;
    const hasSolo = Object.values(this.stems).some(
      s => typeof s === 'object' && 'solo' in s && s.solo
    );

    const calcVol = (stem: { volume: number; muted: boolean; solo: boolean }) => {
      if (hasSolo) {
        return stem.solo ? stem.volume : 0;
      }
      return stem.muted ? 0 : stem.volume;
    };

    if (this.leadGain) this.leadGain.gain.setValueAtTime(calcVol(this.stems.lead), this.ctx.currentTime);
    if (this.bassGain) this.bassGain.gain.setValueAtTime(calcVol(this.stems.bass), this.ctx.currentTime);
    if (this.arpGain) this.arpGain.gain.setValueAtTime(calcVol(this.stems.arp), this.ctx.currentTime);
    if (this.padGain) this.padGain.gain.setValueAtTime(calcVol(this.stems.pad), this.ctx.currentTime);
    if (this.drumsGain) this.drumsGain.gain.setValueAtTime(calcVol(this.stems.drums), this.ctx.currentTime);
  }
}

export const synthEngine = new HologramSynthEngine();
