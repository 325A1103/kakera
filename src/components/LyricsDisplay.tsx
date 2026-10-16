import React, { useState } from 'react';
import { LyricLine } from '../types/music';
import { Copy, Check, Languages, Sparkles } from 'lucide-react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  trackTitle: string;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  currentTime,
  onSeek,
  trackTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);

  // Determine current active lyric index
  const activeIndex = lyrics.findIndex(
    line => currentTime >= line.time && currentTime < line.time + line.duration
  );

  const handleCopyLyrics = () => {
    const text = lyrics.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 md:p-7 shadow-[0_4px_30px_rgba(3,7,18,0.4)] flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-cyan-500/10 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm md:text-base font-semibold text-slate-100 tracking-wide">
            歌詞シンクロナイザー // LYRICS
          </h3>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            ({lyrics.length} LINES)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showTranslations
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="Toggle Romaji & English Translation"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>英訳・ローマ字</span>
          </button>

          <button
            onClick={handleCopyLyrics}
            className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
            title="Copy all lyrics"
            aria-label="Copy lyrics"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Lyrics Scrollable Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[360px] md:max-h-[420px]">
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = currentTime >= line.time + line.duration;

          return (
            <div
              key={idx}
              onClick={() => onSeek(line.time)}
              className={`p-3 rounded-xl transition-all duration-300 cursor-pointer text-left border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-slate-900/40 border-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.25)] translate-x-1'
                  : isPassed
                  ? 'bg-slate-950/30 border-transparent hover:bg-slate-800/40 opacity-55 hover:opacity-80'
                  : 'bg-slate-950/40 border-transparent hover:bg-slate-800/50 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p
                    className={`text-sm md:text-base font-medium tracking-wide transition-colors ${
                      isActive
                        ? 'text-cyan-200 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                        : 'text-slate-200'
                    }`}
                  >
                    {line.text}
                  </p>

                  {showTranslations && (line.romaji || line.en) && (
                    <div className="text-xs space-y-0.5">
                      {line.romaji && (
                        <p className={`font-mono ${isActive ? 'text-cyan-400/90' : 'text-slate-400'}`}>
                          {line.romaji}
                        </p>
                      )}
                      {line.en && (
                        <p className={`italic ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {line.en}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <span
                  className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-500'
                  }`}
                >
                  {Math.floor(line.time / 60)}:
                  {Math.floor(line.time % 60) < 10 ? '0' : ''}
                  {Math.floor(line.time % 60)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-cyan-500/10 mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>行をクリックで頭出し再生</span>
        <span className="font-mono text-cyan-400/80">{trackTitle}</span>
      </div>
    </div>
  );
};
