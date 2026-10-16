import React from 'react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-cyan-500/15 bg-slate-950/90 py-10 px-6 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-base font-bold text-white tracking-wide">
            ネオンの欠片
          </div>
          <p className="text-xs text-slate-400">
            Holographic Audio Experience & Cyber Synth Odyssey
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <button onClick={() => onNavigate('visualizer')} className="hover:text-cyan-300 transition-colors">
            ホログラム投影
          </button>
          <button onClick={() => onNavigate('player')} className="hover:text-cyan-300 transition-colors">
            プレイヤー
          </button>
          <button onClick={() => onNavigate('mixer')} className="hover:text-cyan-300 transition-colors">
            音響ミキサー
          </button>
          <button onClick={() => onNavigate('lyrics')} className="hover:text-cyan-300 transition-colors">
            歌詞
          </button>
          <button onClick={() => onNavigate('about')} className="hover:text-cyan-300 transition-colors">
            楽曲コンセプト
          </button>
        </nav>

        <div className="text-xs text-slate-500 font-mono text-center md:text-right">
          © {new Date().getFullYear()} ネオンの欠片. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
