import React from 'react';
import { StemControls } from '../types/music';
import { Sliders, Volume2, VolumeX, Mic, Activity, Disc, Sparkles, Cloud, RotateCcw } from 'lucide-react';

interface StemMixerProps {
  stems: StemControls;
  onUpdateStem: (stem: keyof Omit<StemControls, 'filterCutoff' | 'reverbAmount'>, updates: Partial<{ volume: number; muted: boolean; solo: boolean }>) => void;
  onFilterCutoffChange: (hz: number) => void;
  onResetStems: () => void;
  isPlaying: boolean;
}

export const StemMixer: React.FC<StemMixerProps> = ({
  stems,
  onUpdateStem,
  onFilterCutoffChange,
  onResetStems,
  isPlaying,
}) => {
  const stemConfigs = [
    {
      key: 'lead' as const,
      name: 'Vocal / Lead Synth',
      desc: '未完成の旋律・リードシンセ',
      icon: Mic,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      key: 'bass' as const,
      name: 'Cyber Bass',
      desc: '0と1の境界を震わせる低音',
      icon: Activity,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'arp' as const,
      name: 'Neon Arp',
      desc: '浮遊する光のアルペジオ',
      icon: Sparkles,
      color: 'from-teal-400 to-cyan-500',
    },
    {
      key: 'pad' as const,
      name: 'Hologram Pad',
      desc: '青の深淵を漂う空間和音',
      icon: Cloud,
      color: 'from-sky-400 to-indigo-500',
    },
    {
      key: 'drums' as const,
      name: 'Electro Rhythm',
      desc: '鼓動のスピードを刻むビート',
      icon: Disc,
      color: 'from-cyan-300 to-emerald-400',
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 md:p-7 shadow-[0_4px_30px_rgba(3,7,18,0.4)]">
      {/* Title & Reset */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-cyan-500/10 mb-5">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-sm md:text-base font-semibold text-slate-100 tracking-wide">
              リアルタイム・ステムミキサー // SOUND MATRIX
            </h3>
            <p className="text-xs text-slate-400">
              各音響レイヤーの音量・ミュート・ソロを個別に操作できます
            </p>
          </div>
        </div>

        <button
          onClick={onResetStems}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
          title="Reset all stem levels"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>リセット</span>
        </button>
      </div>

      {/* Stem Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {stemConfigs.map(item => {
          const stemState = stems[item.key];
          const IconComponent = item.icon;

          return (
            <div
              key={item.key}
              className={`p-3.5 rounded-xl border transition-all ${
                stemState.muted
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : stemState.solo
                  ? 'bg-cyan-950/50 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950/60 border-cyan-500/15 hover:border-cyan-500/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconComponent className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateStem(item.key, { muted: !stemState.muted })}
                    className={`p-1 rounded text-[10px] font-mono transition-colors ${
                      stemState.muted
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                    }`}
                    title="Mute stem"
                  >
                    {stemState.muted ? <VolumeX className="w-3 h-3" /> : 'M'}
                  </button>
                  <button
                    onClick={() => onUpdateStem(item.key, { solo: !stemState.solo })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      stemState.solo
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                    }`}
                    title="Solo stem"
                  >
                    S
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 truncate mb-3">{item.desc}</p>

              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>LEVEL</span>
                  <span className="tabular-nums font-semibold text-cyan-300">
                    {Math.round(stemState.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={stemState.volume}
                  onChange={e => onUpdateStem(item.key, { volume: parseFloat(e.target.value) })}
                  disabled={stemState.muted}
                  aria-label={`${item.name} volume`}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                />
              </div>

              {/* Dynamic pulse activity indicator */}
              <div className="mt-2.5 flex items-center gap-1">
                <div
                  className={`h-1 flex-1 rounded-full transition-all duration-100 ${
                    isPlaying && !stemState.muted
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800'
                  }`}
                  style={{
                    opacity: isPlaying && !stemState.muted ? 0.3 + stemState.volume * 0.7 : 0.2,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cyber Resonance Lowpass Filter Bar */}
      <div className="bg-slate-950/70 border border-cyan-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              サイバー・レゾナンスフィルター (Lowpass Cutoff)
            </span>
            <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
              {Math.round(stems.filterCutoff)} Hz
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            スライダーを下げると水中に潜ったような深海ダークサウンドへと変調します
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-64">
          <span className="text-[11px] font-mono text-slate-500">400Hz</span>
          <input
            type="range"
            min={400}
            max={18000}
            step={100}
            value={stems.filterCutoff}
            onChange={e => onFilterCutoffChange(parseFloat(e.target.value))}
            aria-label="Lowpass filter cutoff"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[11px] font-mono text-slate-500">18kHz</span>
        </div>
      </div>
    </div>
  );
};
