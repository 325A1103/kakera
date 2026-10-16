import React from 'react';
import { cyberDivaSilhouette, hologramBackdrop } from '../data/tracks';
import { Sparkles, Compass, Cpu, Radio } from 'lucide-react';

export const ConceptStory: React.FC = () => {
  return (
    <div className="w-full space-y-12">
      {/* Visual Lore Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 md:p-10 shadow-[0_4px_40px_rgba(3,7,18,0.5)]">
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ARTISTIC CONCEPT & NARRATIVE</span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            深海のような暗青の空間に漂う、<br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              失われた言葉と光の結晶
            </span>
          </h2>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            『ネオンの欠片』は、情報過多なデジタル社会の底に沈んだ感情や未完成の言葉たちを、
            青いネオンの破片として拾い集め、ひとつの旋律へと再構築するサイバー・エレクトロニック・プロジェクトです。
          </p>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            0と1の二進数で区切られた無機質な世界の中で、息を止めるような一瞬の鼓動。
            ホログラムとして空中を浮遊する幾何学結晶は、鳴り響く音響の周波数に共振し、
            見る角度と音のダイナミクスによってリアルタイムにその輝きを変化させます。
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-cyan-500/15">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">主旋律・調性</span>
              <span className="text-sm font-semibold text-cyan-300 font-mono">F# Minor / A Major</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">ビート速度</span>
              <span className="text-sm font-semibold text-cyan-300 font-mono">140 BPM Electro</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">ホログラム投影</span>
              <span className="text-sm font-semibold text-cyan-300 font-mono">Real-time WebGL/Canvas</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative group">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <img
              src={cyberDivaSilhouette}
              alt="Cyber Diva Silhouette"
              className="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider block">
                VIRTUAL VOCAL RESONANCE
              </span>
              <p className="text-xs text-slate-300 mt-1">
                「0と1の狭間で叫んだ声が交わり合う」
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/50 backdrop-blur-md border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-500/35 transition-all">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">3D無重力浮遊アニメーション</h3>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            28個の多面体ネオン結晶が3次元空間をゼログラビティで漂流。低音（キック／サブベース）で発光膨張し、高音（ハット／シンセ）で微細な光の粒子を放ちます。
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-500/35 transition-all">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">インタラクティブ視差パララックス</h3>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            マウスやタッチの動きに合わせてホログラムの投影面がリアルタイムに傾き、まるでガラスキューブ内の立体映像を覗き込んでいるかのような奥行きを体験できます。
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-500/35 transition-all">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Web Audio ステムシンセサイザー</h3>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            リードシンセ、サブベース、アルペジオ、パッド、ドラムの5トラックをWeb Audio API上で生成。自作の音声ファイル（MP3/WAV）のドラッグ＆ドロップ再生にも完全対応しています。
          </p>
        </div>
      </div>
    </div>
  );
};
