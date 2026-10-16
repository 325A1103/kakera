import React, { useRef } from 'react';
import { Track } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Upload,
  Music,
} from 'lucide-react';

interface PlayerControlsProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  isShuffle: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onFileUpload: (file: File) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLooping,
  isShuffle,
  onPlayPause,
  onSeek,
  onPrevTrack,
  onNextTrack,
  onVolumeChange,
  onToggleLoop,
  onToggleShuffle,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 md:p-6 shadow-[0_4px_30px_rgba(3,7,18,0.5)]">
      {/* Track Info & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <img
              src={currentTrack.coverImage}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-cyan-500/10 mix-blend-screen animate-pulse pointer-events-none" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-bold text-white tracking-wide truncate">
                {currentTrack.title}
              </h3>
              {currentTrack.isCustom && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  User Audio
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="truncate">{currentTrack.artist}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-cyan-400/90">{currentTrack.bpm} BPM</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">{currentTrack.key}</span>
            </div>
          </div>
        </div>

        {/* Load Audio File Action */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/60 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] whitespace-nowrap"
            title="Upload MP3 / WAV audio file to play in holographic visualizer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>自作音源を読込</span>
          </button>
        </div>
      </div>

      {/* Scrubber Bar */}
      <div className="space-y-1 mb-4">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            aria-label="Seek time"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
          {/* Glowing active progress overlay */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Transport Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Shuffle & Loop */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-lg text-xs transition-colors ${
              isShuffle ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Shuffle"
            aria-label="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleLoop}
            className={`p-2 rounded-lg text-xs transition-colors ${
              isLooping ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Loop Track"
            aria-label="Loop Track"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevTrack}
            className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Track"
            aria-label="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold shadow-[0_0_24px_rgba(6,182,212,0.6)] hover:shadow-[0_0_32px_rgba(6,182,212,0.85)] hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Track"
            aria-label="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Master Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title={volume === 0 ? 'Unmute' : 'Mute'}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            aria-label="Volume slider"
            className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};
