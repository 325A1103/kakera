import React from 'react';
import { Play, Pause } from 'lucide-react';

interface HeaderProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  onPlayPause,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <a
          href="#top"
          onClick={e => {
            e.preventDefault();
            onNavigate('top');
          }}
          className="text-lg md:text-xl font-bold tracking-tight text-white hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] group-hover:scale-125 transition-transform" />
          <span>ネオンの欠片</span>
        </a>

        {/* Zone 2: 4-5 Concise Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('visualizer')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            ホログラム投影
          </button>
          <button
            onClick={() => onNavigate('player')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            プレイヤー
          </button>
          <button
            onClick={() => onNavigate('mixer')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            音響ミキサー
          </button>
          <button
            onClick={() => onNavigate('lyrics')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            歌詞
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            楽曲コンセプト
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onPlayPause}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all whitespace-nowrap shrink-0"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>再生中 (一時停止)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>ホログラム再生</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
