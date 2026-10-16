import React from 'react';
import { Track } from '../types/music';
import { Play, Pause, Disc3, Clock, Zap } from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
}) => {
  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 md:p-7 shadow-[0_4px_30px_rgba(3,7,18,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/10 mb-4">
        <div className="flex items-center gap-2.5">
          <Disc3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm md:text-base font-semibold text-slate-100 tracking-wide">
            トラックコレクション // TRACKLIST
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {tracks.length} TRACKS AVAILABLE
        </span>
      </div>

      {/* Tracks Grid */}
      <div className="space-y-2.5">
        {tracks.map((track, idx) => {
          const isCurrent = track.id === currentTrackId;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900/80 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-950/40 border-cyan-500/10 hover:border-cyan-500/30 hover:bg-slate-800/40'
              }`}
            >
              {/* Left: Index / Play Icon & Thumbnail */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-cyan-500/20">
                  <img
                    src={track.coverImage}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                      isCurrent && isPlaying
                        ? 'bg-cyan-950/60 opacity-100'
                        : 'bg-slate-950/40 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-5 h-5 text-cyan-300 fill-cyan-300" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400/80">0{idx + 1}.</span>
                    <h4
                      className={`text-sm md:text-base font-semibold truncate transition-colors ${
                        isCurrent ? 'text-cyan-200' : 'text-slate-200 group-hover:text-cyan-300'
                      }`}
                    >
                      {track.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="truncate">{track.artist}</span>
                    <span aria-hidden="true">·</span>
                    <span className="hidden sm:inline font-mono">{track.genre}</span>
                  </div>
                </div>
              </div>

              {/* Right: Meta & Duration */}
              <div className="flex items-center gap-4 shrink-0 text-xs font-mono text-slate-400 tabular-nums">
                <div className="hidden sm:flex items-center gap-1.5 text-cyan-400/80">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{track.bpm} BPM</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {Math.floor(track.duration / 60)}:
                    {Math.floor(track.duration % 60) < 10 ? '0' : ''}
                    {Math.floor(track.duration % 60)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
